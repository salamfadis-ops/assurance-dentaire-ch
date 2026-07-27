import { head, issueSignedToken, presignUrl } from "@vercel/blob";
import { calculateAssessment, objectiveLabels } from "@/lib/dental-assessment";
import { getDocumentStorageConfiguration } from "@/lib/document-storage";
import { createAdvisorReport, createProspectReport } from "@/lib/dental-report";
import type { AssessmentDocuments } from "@/lib/documents";
import { contactPreferenceLabels } from "@/lib/lead";
import type { ValidatedLead } from "@/lib/lead-validation";

export type DeliveryAttempt = {
  channel: "resend" | "webhook";
  configured: boolean;
  delivered: boolean;
  status?: number;
  error?: "not_configured" | "invalid_configuration" | "request_failed" | "provider_rejected";
  detail?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

async function secureDocumentLinks(lead: ValidatedLead) {
  const configuredHours = Number(process.env.DOCUMENT_LINK_TTL_HOURS);
  const hours = Number.isFinite(configuredHours) && configuredHours > 0 ? configuredHours : 72;
  const validUntil = Date.now() + hours * 60 * 60 * 1000;
  const links: Array<{ name: string; url: string; expiresInHours: number }> = [];
  const storage = getDocumentStorageConfiguration();
  if (!storage.configured) {
    console.error("blob_read_failed", {
      operation: "email_link_generation",
      requestId: lead.requestId,
      providerCode: "credentials_missing",
      documentCount: lead.documents.length,
    });
    return links;
  }
  for (const document of lead.documents) {
    console.info("blob_read_started", {
      operation: "email_link_generation",
      requestId: lead.requestId,
      pathname: document.pathname,
      expectedSize: document.size,
      storedUrl: document.url,
    });
    try {
      // document.url permet aussi de retrouver les anciens uploads dont le
      // pathname brut ne reflétait pas le suffixe aléatoire présent dans l'URL.
      const storedBlob = await head(document.url || document.pathname, {
        ...storage.auth,
        abortSignal: AbortSignal.timeout(10_000),
      });
      if (!lead.uploadSessionId || !storedBlob.pathname.startsWith(`leads/${lead.uploadSessionId}/`) || storedBlob.size !== document.size || storedBlob.contentType !== "application/pdf") {
        throw new Error("Blob metadata mismatch before e-mail link generation");
      }
      console.info("blob_read_success", {
        operation: "email_link_generation",
        requestId: lead.requestId,
        pathname: storedBlob.pathname,
        size: storedBlob.size,
        url: storedBlob.url,
        downloadUrl: storedBlob.downloadUrl,
      });
      const token = await issueSignedToken({
        ...storage.auth,
        pathname: storedBlob.pathname,
        operations: ["get"],
        validUntil,
      });
      const { presignedUrl } = await presignUrl(token, { access: "private", operation: "get", pathname: storedBlob.pathname, validUntil, useCache: false });
      links.push({ name: document.name, url: presignedUrl, expiresInHours: hours });
    } catch (error) {
      console.error("blob_read_failed", {
        operation: "email_link_generation",
        requestId: lead.requestId,
        pathname: document.pathname,
        providerCode: error instanceof Error ? error.constructor.name : "unknown_error",
        message: error instanceof Error ? error.message.slice(0, 300) : "Unknown error",
      });
    }
  }
  return links;
}

async function deliverWithResend(lead: ValidatedLead, apiKey: string, fromEmail: string, notificationEmail: string) {
  const from = `Assurance Dentaire <${fromEmail}>`;
  const to = [notificationEmail];
  const score = lead.score?.global;
  const links = await secureDocumentLinks(lead);
  const rows = [
    ["Parcours", lead.journey],
    ["Téléphone", lead.contact.phone],
    ["E-mail", lead.contact.email || "Non renseigné"],
    ["Canton", lead.contact.canton || "Non renseigné"],
    ["Préférence", contactPreferenceLabels[lead.contact.preference]],
    ["Score", score === undefined ? "Non disponible" : `${score}/100`],
    ["Objectif", lead.answers?.objective ? objectiveLabels[lead.answers.objective] : "Non renseigné"],
    ["Devis reçu", lead.answers?.hasQuote ? "Oui" : "Non"],
    ["Montant du devis", lead.answers?.quoteAmount ? `${lead.answers.quoteAmount.toLocaleString("fr-CH")} CHF` : "Non renseigné"],
    ["Calendly", lead.calendlyStatus],
    ["Source", lead.attribution.source || "Direct"],
    ["Campagne", lead.attribution.campaign || "Non renseignée"],
    ["Mot-clé", lead.attribution.term || "Non renseigné"],
  ];
  const list = (items: string[], empty: string) => items.length ? `<ul style="margin:8px 0 0;padding-left:18px">${items.map((item) => `<li style="margin:6px 0">${escapeHtml(item)}</li>`).join("")}</ul>` : `<p style="margin:8px 0 0;color:#64748b">${empty}</p>`;
  const documentHtml = links.length
    ? `<ul style="margin:8px 0 0;padding-left:18px">${links.map((link) => `<li style="margin:8px 0"><a href="${escapeHtml(link.url)}" style="color:#176654;font-weight:700">${escapeHtml(link.name)}</a> <span style="color:#64748b">(expire dans ${link.expiresInHours} h)</span></li>`).join("")}</ul>`
    : `<p style="margin:8px 0 0;color:#64748b">${lead.documents.length ? "Documents privés disponibles, lien temporaire indisponible." : "Aucun document transmis."}</p>`;
  const html = `<!doctype html><html><body style="margin:0;background:#f3f6f2;font-family:Arial,sans-serif;color:#102d28"><div style="max-width:680px;margin:0 auto;padding:24px 12px"><div style="background:#0b2b25;border-radius:20px 20px 0 0;padding:24px;color:white"><p style="margin:0;font-size:12px;letter-spacing:.12em;color:#b9f1dd;font-weight:700">ASSURANCE-DENTAIRE.CH · VYDA SA</p><h1 style="margin:10px 0 0;font-size:25px">Nouveau lead</h1><p style="margin:8px 0 0;color:#d7e5e1">${escapeHtml(`${lead.contact.lastName} ${lead.contact.firstName}`)}</p></div><div style="background:white;padding:24px;border-radius:0 0 20px 20px"><table role="presentation" style="width:100%;border-collapse:collapse">${rows.map(([label, value]) => `<tr><td style="padding:9px 8px;border-bottom:1px solid #e7ece9;color:#64748b;font-size:13px">${escapeHtml(String(label))}</td><td style="padding:9px 8px;border-bottom:1px solid #e7ece9;text-align:right;font-weight:700;font-size:13px">${escapeHtml(String(value))}</td></tr>`).join("")}</table><h2 style="font-size:17px;margin:26px 0 0">Risques identifiés</h2>${list(lead.risks, "Aucun risque automatique identifié.")}<h2 style="font-size:17px;margin:26px 0 0">Priorités</h2>${list(lead.priorities, "À préciser pendant l’échange.")}<h2 style="font-size:17px;margin:26px 0 0">Documents sécurisés</h2>${documentHtml}<p style="margin:26px 0 0;font-size:12px;line-height:1.6;color:#64748b">Consentement reçu le ${escapeHtml(lead.consent.timestamp)}. Page d’entrée : ${escapeHtml(lead.attribution.entryPage || "Non renseignée")}.</p></div></div></body></html>`;

  const attachments: Array<{ filename: string; content: string }> = [];
  if (lead.answers && lead.score) {
    const documents: AssessmentDocuments = { contracts: lead.documents.filter((item) => item.category === "contract"), quotes: lead.documents.filter((item) => item.category === "quote") };
    const result = calculateAssessment(lead.answers, documents);
    const prospectReport = await createProspectReport(lead.answers, result, documents, {
      firstName: lead.contact.firstName,
      lastName: lead.contact.lastName,
      reference: lead.requestId,
      generatedAt: lead.createdAt,
    });
    attachments.push({ filename: "bilan-prospect.pdf", content: Buffer.from(prospectReport).toString("base64") });
  }
  attachments.push({ filename: "synthese-conseiller-vyda.pdf", content: Buffer.from(createAdvisorReport(lead)).toString("base64") });

  // Ces adresses ne sont pas des secrets. Ce log confirme la configuration
  // réellement utilisée sans jamais exposer RESEND_API_KEY.
  console.info("[resend_delivery_attempt]", {
    requestId: lead.requestId,
    from,
    to,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": lead.requestId },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      from,
      to,
      ...(lead.contact.email ? { reply_to: lead.contact.email } : {}),
      subject: `Nouveau lead assurance-dentaire.ch — ${lead.contact.lastName} ${lead.contact.firstName} — Score ${score ?? "—"}/100`,
      html,
      attachments,
    }),
  });
  return response;
}

export async function sendLeadNotification(lead: ValidatedLead): Promise<DeliveryAttempt> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const notificationEmail = process.env.LEAD_NOTIFICATION_EMAIL?.trim();
  const missing = [
    ...(!apiKey ? ["RESEND_API_KEY"] : []),
    ...(!fromEmail ? ["RESEND_FROM_EMAIL"] : []),
    ...(!notificationEmail ? ["LEAD_NOTIFICATION_EMAIL"] : []),
  ];

  if (missing.length > 0 || !apiKey || !fromEmail || !notificationEmail) {
    console.error("[resend_configuration_error]", {
      message: "Envoi Resend annulé : variables d'environnement obligatoires absentes.",
      requestId: lead.requestId,
      missing,
    });
    return {
      channel: "resend",
      configured: false,
      delivered: false,
      error: "invalid_configuration",
      detail: `Missing environment variables: ${missing.join(", ")}`,
    };
  }

  try {
    const response = await deliverWithResend(lead, apiKey, fromEmail, notificationEmail);
    if (response.ok) {
      return { channel: "resend", configured: true, delivered: true, status: response.status };
    }
    let providerDetail = `HTTP ${response.status}`;
    try {
      const body = await response.json() as { name?: string; message?: string };
      providerDetail = [body.name, body.message].filter(Boolean).join(": ").slice(0, 300) || providerDetail;
    } catch {
      // Le statut HTTP reste disponible si le fournisseur ne renvoie pas de JSON.
    }
    return { channel: "resend", configured: true, delivered: false, status: response.status, error: "provider_rejected", detail: providerDetail };
  } catch (error) {
    return {
      channel: "resend",
      configured: true,
      delivered: false,
      error: "request_failed",
      detail: error instanceof Error ? error.name : "UnknownError",
    };
  }
}
