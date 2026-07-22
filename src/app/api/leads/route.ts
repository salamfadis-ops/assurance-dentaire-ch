import { NextResponse } from "next/server";
import { normalizeSwissFrenchPhone } from "@/lib/phone";

export const runtime = "nodejs";

type LeadPayload = {
  profile?: string;
  need?: string;
  canton?: string;
  firstName?: string;
  email?: string;
  phone?: string;
  consent?: boolean;
  website?: string;
  attribution?: Record<string, string | undefined>;
  assessment?: { score?: number; planningNeed?: number; coverage?: string };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validCantons = new Set(["AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"]);
const attempts = new Map<string, { count: number; resetAt: number }>();

function clean(value: unknown, maxLength = 200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function sendWithResend(lead: Required<Omit<LeadPayload, "attribution" | "website">> & { attribution: Record<string, string | undefined> }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_TO_EMAIL ?? "contact@assurance-dentaire.ch";
  const from = process.env.LEADS_FROM_EMAIL ?? "Assurance Dentaire <leads@assurance-dentaire.ch>";
  if (!apiKey) return false;

  const details = [
    `Profil : ${lead.profile}`,
    `Besoin : ${lead.need}`,
    `Canton : ${lead.canton}`,
    `Prénom : ${lead.firstName}`,
    `E-mail : ${lead.email}`,
    `Téléphone : ${lead.phone || "Non renseigné"}`,
    `Score dentaire : ${lead.assessment.score || "Non renseigné"}`,
    `Besoin de planification : ${lead.assessment.planningNeed ? `CHF ${lead.assessment.planningNeed}` : "Non renseigné"}`,
    `Couverture déclarée : ${lead.assessment.coverage || "Non renseignée"}`,
    `Source : ${lead.attribution.source ?? "Direct"}`,
    `Campagne : ${lead.attribution.campaign ?? "Non renseignée"}`,
    `Mot-clé : ${lead.attribution.term ?? "Non renseigné"}`,
    `Page : ${lead.attribution.landingPage ?? "Non renseignée"}`,
  ];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: lead.email,
      subject: `Nouveau lead dentaire — ${lead.firstName} (${lead.canton})`,
      text: details.join("\n"),
    }),
  });

  return response.ok;
}

async function sendToWebhook(lead: object) {
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return false;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(8000),
  });
  return response.ok;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) {
    return NextResponse.json({ error: "Requête trop volumineuse" }, { status: 413 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwardedFor || request.headers.get("x-real-ip")?.trim();
  if (clientKey) {
    const currentTime = Date.now();
    const currentAttempt = attempts.get(clientKey);

    if (currentAttempt && currentAttempt.resetAt > currentTime && currentAttempt.count >= 5) {
      return NextResponse.json({ error: "Trop de demandes" }, { status: 429 });
    }

    attempts.set(clientKey, currentAttempt && currentAttempt.resetAt > currentTime
      ? { ...currentAttempt, count: currentAttempt.count + 1 }
      : { count: 1, resetAt: currentTime + 10 * 60 * 1000 });
  }

  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (clean(payload.website)) return NextResponse.json({ ok: true });

  const lead = {
    profile: clean(payload.profile, 80),
    need: clean(payload.need, 120),
    canton: clean(payload.canton, 2).toUpperCase(),
    firstName: clean(payload.firstName, 80),
    email: clean(payload.email, 160).toLowerCase(),
    phone: normalizeSwissFrenchPhone(clean(payload.phone, 40)) ?? "",
    consent: payload.consent === true,
    attribution: {
      source: clean(payload.attribution?.source, 100),
      medium: clean(payload.attribution?.medium, 100),
      campaign: clean(payload.attribution?.campaign, 160),
      term: clean(payload.attribution?.term, 160),
      landingPage: clean(payload.attribution?.landingPage, 500),
    },
    assessment: {
      score: Math.max(0, Math.min(100, Number(payload.assessment?.score) || 0)),
      planningNeed: Math.max(0, Math.min(1_000_000, Number(payload.assessment?.planningNeed) || 0)),
      coverage: clean(payload.assessment?.coverage, 80),
    },
  };

  if (!lead.profile || !lead.need || !validCantons.has(lead.canton) || !lead.firstName || !emailPattern.test(lead.email) || !lead.phone || !lead.consent) {
    return NextResponse.json({ error: "Informations incomplètes" }, { status: 422 });
  }

  try {
    const delivered = (await sendWithResend(lead)) || (await sendToWebhook({ ...lead, createdAt: new Date().toISOString() }));

    if (!delivered) {
      if (process.env.NODE_ENV === "development") {
        console.info("[lead:development]", { ...lead, email: "[masked]", phone: lead.phone ? "[masked]" : "" });
        return NextResponse.json({ ok: true, mode: "development" });
      }
      return NextResponse.json({ error: "Service temporairement indisponible" }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Service temporairement indisponible" }, { status: 503 });
  }
}
