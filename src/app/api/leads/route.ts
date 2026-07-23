import { NextResponse } from "next/server";
import { sendLeadNotification } from "@/lib/lead-notification";
import { validateLeadPayload, type ValidatedLead } from "@/lib/lead-validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const processedRequests = new Map<string, number>();
const inFlightRequests = new Set<string>();

async function sendToWebhook(lead: ValidatedLead) {
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return false;
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": lead.requestId }, body: JSON.stringify(lead), signal: AbortSignal.timeout(8000) });
  return response.ok;
}

function requestAlreadyHandled(requestId: string) {
  const now = Date.now();
  for (const [id, expiresAt] of processedRequests) if (expiresAt <= now) processedRequests.delete(id);
  return processedRequests.has(requestId) || inFlightRequests.has(requestId);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 120_000) return NextResponse.json({ error: "Requête trop volumineuse" }, { status: 413 });

  const limit = rateLimit(`lead:${clientKey(request)}`, 6, 10 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const validation = validateLeadPayload(payload);
  if (validation.spam) return NextResponse.json({ ok: true });
  if (!validation.lead) return NextResponse.json({ error: "Informations incomplètes", fields: validation.errors }, { status: 422 });
  if (requestAlreadyHandled(validation.lead.requestId)) return NextResponse.json({ ok: true, duplicate: true });
  inFlightRequests.add(validation.lead.requestId);

  try {
    const [emailDelivered, webhookDelivered] = await Promise.all([
      sendLeadNotification(validation.lead),
      sendToWebhook(validation.lead),
    ]);
    if (!emailDelivered && !webhookDelivered) {
      if (process.env.NODE_ENV === "development") {
        processedRequests.set(validation.lead.requestId, Date.now() + 24 * 60 * 60 * 1000);
        return NextResponse.json({ ok: true, mode: "development" });
      }
      return NextResponse.json({ error: "Service temporairement indisponible" }, { status: 503 });
    }
    processedRequests.set(validation.lead.requestId, Date.now() + 24 * 60 * 60 * 1000);
    return NextResponse.json({ ok: true });
  } catch {
    // Les logs applicatifs n’incluent aucune coordonnée, réponse ou donnée médicale.
    console.error("[lead_delivery_failed]", { requestId: validation.lead.requestId, journey: validation.lead.journey });
    return NextResponse.json({ error: "Service temporairement indisponible" }, { status: 503 });
  } finally {
    inFlightRequests.delete(validation.lead.requestId);
  }
}
