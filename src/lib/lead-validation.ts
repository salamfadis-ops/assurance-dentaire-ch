import { calculateAssessment, deriveAssessmentRisks, initialAssessment, needCatalog, type AssessmentData, type NeedKey } from "@/lib/dental-assessment";
import { emptyAssessmentDocuments, isDocumentOwnedBySession, type AssessmentDocuments, type StoredDocument } from "@/lib/documents";
import { contactPreferenceLabels, type ContactPreference, type LeadAttribution, type LeadJourney, type LeadPayload } from "@/lib/lead";
import { normalizeSwissFrenchPhone } from "@/lib/phone";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validCantons = new Set(["AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"]);
const journeys = new Set<LeadJourney>(["bilan", "rappel", "calendly"]);
const preferences = new Set<ContactPreference>(Object.keys(contactPreferenceLabels) as ContactPreference[]);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function clean(value: unknown, maxLength = 200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  const candidate = clean(value) as T;
  return allowed.includes(candidate) ? candidate : fallback;
}

function sanitizeAttribution(value: unknown): LeadAttribution {
  const source = record(value);
  return {
    source: clean(source.source, 100) || undefined,
    medium: clean(source.medium, 100) || undefined,
    campaign: clean(source.campaign, 160) || undefined,
    term: clean(source.term, 160) || undefined,
    content: clean(source.content, 160) || undefined,
    referrer: clean(source.referrer, 500) || undefined,
    entryPage: clean(source.entryPage, 500) || undefined,
  };
}

function sanitizeAssessment(value: unknown): AssessmentData {
  const source = record(value);
  const needKeys = Object.keys(needCatalog) as NeedKey[];
  const needs = Array.isArray(source.needs)
    ? source.needs.map((need) => clean(need) as NeedKey).filter((need): need is NeedKey => needKeys.includes(need)).slice(0, needKeys.length)
    : [];

  return {
    ...initialAssessment,
    profile: oneOf(source.profile, ["adult", "child", "unborn"] as const, ""),
    canton: clean(source.canton, 2).toUpperCase(),
    ageGroup: clean(source.ageGroup, 40),
    childAge: clean(source.childAge, 3),
    expectedBirthDate: clean(source.expectedBirthDate, 10),
    needs,
    customBudget: Math.max(0, Math.min(1_000_000, Number(source.customBudget) || 0)),
    coverage: oneOf(source.coverage, ["none", "basic", "supplementary", "unknown"] as const, ""),
    ambulatoryCoverage: oneOf(source.ambulatoryCoverage, ["yes", "no", "unknown"] as const, ""),
    dentalParticipation: oneOf(source.dentalParticipation, ["yes", "no", "unknown", "not_applicable"] as const, ""),
    verifyGuarantees: typeof source.verifyGuarantees === "boolean" ? source.verifyGuarantees : null,
    objective: oneOf(source.objective, ["current_coverage", "protect_child", "anticipate_treatment", "orthodontics", "compare", "unsure"] as const, ""),
    hasQuote: typeof source.hasQuote === "boolean" ? source.hasQuote : null,
    quoteAmount: Math.max(0, Math.min(1_000_000, Number(source.quoteAmount) || 0)),
    prevention: oneOf(source.prevention, ["twice", "yearly", "irregular", "never"] as const, ""),
    reserve: oneOf(source.reserve, ["comfortable", "partial", "limited", "none"] as const, ""),
    timeline: oneOf(source.timeline, ["preventive", "year", "soon", "ongoing"] as const, ""),
  };
}

function sanitizeDocuments(value: unknown, uploadSessionId: string) {
  if (!Array.isArray(value) || !uploadSessionId) return [];
  return value.slice(0, 5).map((item) => {
    const source = record(item);
    return {
      category: oneOf(source.category, ["contract", "quote"] as const, "contract"),
      name: clean(source.name, 120),
      pathname: clean(source.pathname, 500),
      url: clean(source.url, 800),
      size: Number(source.size) || 0,
      contentType: "application/pdf" as const,
      uploadedAt: clean(source.uploadedAt, 40),
    } satisfies StoredDocument;
  }).filter((document) => isDocumentOwnedBySession(document, uploadSessionId));
}

export type ValidatedLead = Omit<LeadPayload, "answers" | "documents" | "score" | "risks" | "priorities"> & {
  createdAt: string;
  answers?: AssessmentData;
  documents: StoredDocument[];
  score?: LeadPayload["score"];
  risks: string[];
  priorities: string[];
};

export function validateLeadPayload(input: unknown): { lead?: ValidatedLead; errors: string[]; spam: boolean } {
  const source = record(input);
  if (clean(source.website, 120)) return { errors: [], spam: true };

  const contactSource = record(source.contact);
  const consentSource = record(source.consent);
  const journey = clean(source.journey) as LeadJourney;
  const preference = clean(contactSource.preference) as ContactPreference;
  const phone = normalizeSwissFrenchPhone(clean(contactSource.phone, 40)) ?? "";
  const email = clean(contactSource.email, 160).toLowerCase();
  const canton = clean(contactSource.canton, 2).toUpperCase();
  const uploadSessionId = clean(source.uploadSessionId, 80);
  const documents = sanitizeDocuments(source.documents, uploadSessionId);
  const answers = journey === "bilan" || journey === "calendly" ? sanitizeAssessment(source.answers) : undefined;
  const assessmentDocuments: AssessmentDocuments = answers ? {
    contracts: documents.filter((document) => document.category === "contract"),
    quotes: documents.filter((document) => document.category === "quote"),
  } : emptyAssessmentDocuments;
  const computed = answers ? calculateAssessment(answers, assessmentDocuments) : undefined;

  const errors: string[] = [];
  if (!journeys.has(journey)) errors.push("type de parcours invalide");
  if (!clean(contactSource.firstName, 80)) errors.push("prénom requis");
  if (!clean(contactSource.lastName, 80)) errors.push("nom requis");
  if (!phone) errors.push("téléphone invalide");
  if (email && !emailPattern.test(email)) errors.push("e-mail invalide");
  if (!preferences.has(preference)) errors.push("préférence de contact requise");
  if (journey === "bilan" && !validCantons.has(canton)) errors.push("canton invalide");
  if (journey === "bilan" && (!answers?.profile || !answers.needs.length || !answers.ambulatoryCoverage || !answers.objective || answers.hasQuote === null)) errors.push("bilan incomplet");
  if (consentSource.accepted !== true || !clean(consentSource.timestamp, 40)) errors.push("consentement requis");

  if (errors.length) return { errors, spam: false };

  return {
    errors: [],
    spam: false,
    lead: {
      requestId: /^[0-9a-f-]{36}$/i.test(clean(source.requestId, 36)) ? clean(source.requestId, 36) : crypto.randomUUID(),
      uploadSessionId: uploadSessionId || undefined,
      journey,
      contact: {
        firstName: clean(contactSource.firstName, 80),
        lastName: clean(contactSource.lastName, 80),
        phone,
        email,
        canton,
        preference,
      },
      answers,
      documents,
      score: computed ? { global: computed.score, breakdown: computed.breakdown } : undefined,
      risks: computed && answers ? deriveAssessmentRisks(answers, assessmentDocuments) : [],
      priorities: computed?.recommendations.slice(0, 6) ?? [],
      attribution: sanitizeAttribution(source.attribution),
      calendlyStatus: oneOf(source.calendlyStatus, ["not_configured", "offered", "opened"] as const, "not_configured"),
      consent: {
        accepted: true,
        timestamp: clean(consentSource.timestamp, 40),
        purpose: "insurance_contact_and_analysis",
      },
      website: "",
      createdAt: new Date().toISOString(),
    },
  };
}
