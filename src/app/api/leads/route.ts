import { NextResponse } from "next/server";
import { sendLeadNotification, type DeliveryAttempt } from "@/lib/lead-notification";
import { persistLead } from "@/lib/lead-persistence";
import { validateLeadPayload, type ValidatedLead } from "@/lib/lead-validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const processedRequests = new Map<string, number>();
const inFlightRequests = new Set<string>();

async function sendToWebhook(lead: ValidatedLead): Promise<DeliveryAttempt> {
  const url = process.env.LEADS_WEBHOOK_URL?.trim();
  if (!url) return { channel: "webhook", configured: false, delivered: false, error: "not_configured" };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": lead.requestId },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok
      ? { channel: "webhook", configured: true, delivered: true, status: response.status }
      : { channel: "webhook", configured: true, delivered: false, status: response.status, error: "provider_rejected", detail: `HTTP ${response.status}` };
  } catch (error) {
    return {
      channel: "webhook",
      configured: true,
      delivered: false,
      error: "request_failed",
      detail: error instanceof Error ? error.name : "UnknownError",
    };
  }
}

function deliveryConfiguration() {
  const resendApiKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const resendFromEmail = Boolean(process.env.RESEND_FROM_EMAIL?.trim());
  const leadNotificationEmail = Boolean(process.env.LEAD_NOTIFICATION_EMAIL?.trim());
  const resend = resendApiKey && resendFromEmail && leadNotificationEmail;
  const webhook = Boolean(process.env.LEADS_WEBHOOK_URL?.trim());
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID));
  return {
    resend,
    webhook,
    blob,
    missing: [
      ...(!resendApiKey ? ["RESEND_API_KEY"] : []),
      ...(!resendFromEmail ? ["RESEND_FROM_EMAIL"] : []),
      ...(!leadNotificationEmail ? ["LEAD_NOTIFICATION_EMAIL"] : []),
      ...(!webhook ? ["LEADS_WEBHOOK_URL"] : []),
      ...(!blob ? ["BLOB_READ_WRITE_TOKEN or VERCEL_OIDC_TOKEN + BLOB_STORE_ID"] : []),
    ],
  };
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
    // La copie privée est tentée avant les notifications : un échec d'e-mail
    // ne doit jamais supprimer la seule copie du lead.
    const persistence = await persistLead(validation.lead);
    const attempts = await Promise.all([
      sendLeadNotification(validation.lead),
      sendToWebhook(validation.lead),
    ]);
    const delivered = attempts.some((attempt) => attempt.delivered);

    if (!delivered) {
      if (process.env.NODE_ENV === "development") {
        processedRequests.set(validation.lead.requestId, Date.now() + 24 * 60 * 60 * 1000);
        return NextResponse.json({ ok: true, mode: "development", saved: persistence.saved, delivery: attempts });
      }

      const configured = attempts.some((attempt) => attempt.configured);
      const configuration = deliveryConfiguration();
      // Les diagnostics ne contiennent aucune coordonnée ni réponse du prospect.
      console.error("[lead_delivery_failed]", {
        message: configured
          ? "Tous les canaux de livraison configurés ont échoué."
          : "Aucun canal de livraison n'est configuré. Définir les trois variables Resend ou LEADS_WEBHOOK_URL.",
        requestId: validation.lead.requestId,
        journey: validation.lead.journey,
        configuration,
        persistence,
        channels: attempts.map(({ channel, configured: isConfigured, status, error, detail }) => ({
          channel,
          configured: isConfigured,
          status,
          error,
          detail,
        })),
      });

      if (persistence.saved) {
        processedRequests.set(validation.lead.requestId, Date.now() + 24 * 60 * 60 * 1000);
        return NextResponse.json(
          {
            ok: true,
            saved: true,
            deliveryPending: true,
            message: "La demande est enregistrée dans le stockage de secours malgré l’échec de notification.",
          },
          { status: 202 },
        );
      }

      if (!configured) {
        return NextResponse.json(
          {
            ok: false,
            code: "LEAD_DELIVERY_NOT_CONFIGURED",
            error: "Aucun canal de livraison ni stockage de secours n’est configuré.",
            required: [
              "RESEND_API_KEY + RESEND_FROM_EMAIL + LEAD_NOTIFICATION_EMAIL, ou LEADS_WEBHOOK_URL",
              "BLOB_READ_WRITE_TOKEN ou VERCEL_OIDC_TOKEN + BLOB_STORE_ID pour le secours",
            ],
          },
          { status: 424 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          code: "LEAD_DELIVERY_FAILED",
          error: "La demande n’a pas pu être livrée ni enregistrée dans le stockage de secours.",
        },
        { status: 502 },
      );
    }

    processedRequests.set(validation.lead.requestId, Date.now() + 24 * 60 * 60 * 1000);
    return NextResponse.json({
      ok: true,
      saved: persistence.saved,
      deliveredBy: attempts.filter((attempt) => attempt.delivered).map((attempt) => attempt.channel),
    });
  } finally {
    inFlightRequests.delete(validation.lead.requestId);
  }
}
