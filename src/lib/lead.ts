import type { AssessmentData, ScoreBreakdown } from "@/lib/dental-assessment";
import type { StoredDocument } from "@/lib/documents";

export type LeadJourney = "bilan" | "rappel" | "calendly";
export type ContactPreference = "asap" | "morning" | "afternoon" | "evening";
export type CalendlyStatus = "not_configured" | "offered" | "opened";

export type LeadContact = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  canton: string;
  preference: ContactPreference;
};

export type LeadAttribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  referrer?: string;
  entryPage?: string;
};

export type LeadScore = {
  global: number;
  breakdown: ScoreBreakdown;
};

export type LeadPayload = {
  requestId: string;
  uploadSessionId?: string;
  journey: LeadJourney;
  contact: LeadContact;
  answers?: AssessmentData;
  score?: LeadScore;
  risks?: string[];
  priorities?: string[];
  documents?: StoredDocument[];
  attribution: LeadAttribution;
  calendlyStatus: CalendlyStatus;
  consent: {
    accepted: boolean;
    timestamp: string;
    purpose: "insurance_contact_and_analysis";
  };
  website?: string;
};

export const contactPreferenceLabels: Record<ContactPreference, string> = {
  asap: "Dès que possible",
  morning: "Matin",
  afternoon: "Après-midi",
  evening: "Soirée",
};

const attributionStorageKey = "vyda-lead-attribution";

export function collectAttribution(): LeadAttribution {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  let saved: LeadAttribution = {};
  try {
    saved = JSON.parse(window.sessionStorage.getItem(attributionStorageKey) || "{}") as LeadAttribution;
  } catch {
    saved = {};
  }
  const current: LeadAttribution = {
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
    term: params.get("utm_term") ?? undefined,
    content: params.get("utm_content") ?? undefined,
    referrer: document.referrer || undefined,
    entryPage: window.location.href,
  };
  const hasCurrentCampaign = Boolean(current.source || current.medium || current.campaign || current.term || current.content);
  const attribution = hasCurrentCampaign
    ? { ...saved, ...current }
    : { ...current, ...saved, referrer: saved.referrer || current.referrer, entryPage: saved.entryPage || current.entryPage };
  try {
    window.sessionStorage.setItem(attributionStorageKey, JSON.stringify(attribution));
  } catch {
    // The lead remains functional when storage is disabled by the browser.
  }
  return attribution;
}

export function calendlyUrl(baseUrl: string, attribution: LeadAttribution, contact?: Partial<LeadContact>) {
  try {
    const url = new URL(baseUrl);
    const values = {
      utm_source: attribution.source,
      utm_medium: attribution.medium,
      utm_campaign: attribution.campaign,
      utm_term: attribution.term,
      utm_content: attribution.content,
      name: [contact?.firstName, contact?.lastName].filter(Boolean).join(" ") || undefined,
      email: contact?.email || undefined,
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url.toString();
  } catch {
    return "";
  }
}
