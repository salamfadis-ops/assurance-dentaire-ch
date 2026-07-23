import { NextResponse } from "next/server";
import { sendLeadNotification, type DeliveryAttempt } from "@/lib/lead-notification";
import { validateLeadPayload, type ValidatedLead } from "@/lib/lead-validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const processedRequests = new Map<string, number>();
const inFlightRequests = new Set<string>();

async function sendToWebhook(lead: ValidatedLead): Promise<DeliveryAttempt> {
  const url = process.env.LEADS_WEBHOOK_URL?.trim();
  if (!url) return { channel: "webhook", configured: false, delivered: false, error: "not_configured" };

  try {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": lead.requestId }, body: JSON.stringify(lead), signal: AbortSignal.timeout(8000) });
    return response.ok
      ? { channel: "webhook", configured: true, delivered: true, status: response.status }
      : { channel: "webhook", configured: true, delivered: false, status: response.status, error: "provider_rejected" };
  } catch {
    return { channel: "webhook", configured: true, delivered: false, error: "request_failed" };
  }
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
    const attempts = await Promise.all([
      sendLeadNotification(validation.lead),
      sendToWebhook(validation.lead),
    ]);
    if (!attempts.some((attempt) => attempt.delivered)) {
      if (process.env.NODE_ENV === "development") {
        processedRequests.set(validation.lead.requestId, Date.now() + 24 * 60 * 60 * 1000);
        return NextResponse.json({ ok: true, mode: "development", delivery: attempts });
      }

      const configured = attempts.some((attempt) => attempt.configured);
      // Les diagnostics ne contiennent aucune coordonnée ni réponse du prospect.
      console.error("[lead_delivery_unavailable]", {
        requestId: validation.lead.requestId,
        journey: validation.lead.journey,
        channels: attempts.map(({ channel, configured: isConfigured, status, error }) => ({ channel, configured: isConfigured, status, error })),
      });

      if (!configured) {
        return NextResponse.json(
          {
            ok: false,
            code: "LEAD_DELIVERY_NOT_CONFIGURED",
            error: "La livraison des demandes n’est pas configurée.",
          },
          { status: 424 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          code: "LEAD_DELIVERY_FAILED",
          error: "La demande n’a pas pu être livrée au conseiller.",
        },
        { status: 502 },
      );
    }
    processedRequests.set(validation.lead.requestId, Date.now() + 24 * 60 * 60 * 1000);
    return NextResponse.json({
      ok: true,
      deliveredBy: attempts.filter((attempt) => attempt.delivered).map((attempt) => attempt.channel),
    });
  } finally {
    inFlightRequests.delete(validation.lead.requestId);
  }
}
