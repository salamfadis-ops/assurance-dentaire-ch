import type { AssessmentDocuments } from "@/lib/documents";

export const needCatalog = {
  prevention: { label: "Prévention et contrôles", planningAmount: 350, description: "Contrôles, hygiène et soins préventifs" },
  orthodontics: { label: "Orthodontie", planningAmount: 8000, description: "Appareil ou alignement dentaire" },
  implants: { label: "Implants", planningAmount: 4500, description: "Remplacement d’une ou plusieurs dents" },
  prosthetics: { label: "Couronnes et prothèses", planningAmount: 3000, description: "Couronnes, bridges ou prothèses" },
  restorative: { label: "Soins courants", planningAmount: 1200, description: "Caries, traitements et réparations" },
  emergency: { label: "Urgences dentaires", planningAmount: 1500, description: "Réserve en cas d’imprévu" },
} as const;

export type NeedKey = keyof typeof needCatalog;

export type ProfileKey = "adult" | "child" | "unborn" | "";
export type CoverageKey = "none" | "basic" | "supplementary" | "unknown" | "";
export type PreventionKey = "twice" | "yearly" | "irregular" | "never" | "";
export type ReserveKey = "comfortable" | "partial" | "limited" | "none" | "";
export type TimelineKey = "preventive" | "year" | "soon" | "ongoing" | "";
export type AmbulatoryCoverageKey = "yes" | "no" | "unknown" | "";
export type DentalParticipationKey = "yes" | "no" | "unknown" | "not_applicable" | "";
export type CrossBorderKey = "yes" | "no" | "consider" | "";

export type AssessmentData = {
  profile: ProfileKey;
  canton: string;
  ageGroup: string;
  childAge: string;
  expectedBirthDate: string;
  needs: NeedKey[];
  customBudget: number;
  coverage: CoverageKey;
  ambulatoryCoverage: AmbulatoryCoverageKey;
  dentalParticipation: DentalParticipationKey;
  verifyGuarantees: boolean | null;
  crossBorderCare: CrossBorderKey;
  prevention: PreventionKey;
  reserve: ReserveKey;
  timeline: TimelineKey;
};

export type ScoreBreakdown = {
  coverage: number;
  prevention: number;
  anticipation: number;
  budget: number;
  documentation: number;
};

export type AssessmentResult = {
  score: number;
  level: "fragile" | "partial" | "solid";
  label: string;
  summary: string;
  breakdown: ScoreBreakdown;
  planningNeed: number;
  recommendations: string[];
};

export const initialAssessment: AssessmentData = {
  profile: "adult",
  canton: "",
  ageGroup: "",
  childAge: "",
  expectedBirthDate: "",
  needs: [],
  customBudget: 0,
  coverage: "",
  ambulatoryCoverage: "",
  dentalParticipation: "",
  verifyGuarantees: null,
  crossBorderCare: "",
  prevention: "",
  reserve: "",
  timeline: "",
};

export const profileLabels: Record<Exclude<ProfileKey, "">, string> = {
  adult: "Un adulte",
  child: "Un enfant",
  unborn: "Un enfant à naître",
};

export function calculatePlanningNeed(data: AssessmentData) {
  const catalogTotal = data.needs.reduce((total, need) => total + needCatalog[need].planningAmount, 0);
  return data.customBudget || Math.round(catalogTotal / 50) * 50;
}

export function calculateAssessment(data: AssessmentData, documents: AssessmentDocuments): AssessmentResult {
  const documentCount = documents.contracts.length + documents.quotes.length;
  const coverageKnowledge = data.dentalParticipation === "yes" || data.dentalParticipation === "no";
  const breakdown: ScoreBreakdown = {
    coverage: data.dentalParticipation === "yes" ? 24 : data.ambulatoryCoverage === "yes" ? 15 : data.coverage === "supplementary" ? 12 : data.coverage === "unknown" ? 6 : 0,
    prevention: data.prevention === "twice" ? 20 : data.prevention === "yearly" ? 16 : data.prevention === "irregular" ? 7 : 0,
    anticipation: data.timeline === "preventive" ? 20 : data.timeline === "year" ? 13 : data.timeline === "soon" ? 5 : 1,
    budget: data.reserve === "comfortable" ? 20 : data.reserve === "partial" ? 12 : data.reserve === "limited" ? 5 : 0,
    documentation: (coverageKnowledge ? 8 : 0) + Math.min(8, documentCount * 3),
  };

  const score = Math.max(0, Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0)));
  const planningNeed = calculatePlanningNeed(data);
  const recommendations: string[] = [];

  if (data.ambulatoryCoverage !== "yes") recommendations.push("Vérifier si une complémentaire ambulatoire ou dentaire correspond à vos besoins et à votre horizon de soins.");
  if (!coverageKnowledge) recommendations.push("Demander le tableau des prestations, les plafonds, la quote-part et les délais d’attente de votre couverture actuelle.");
  if (data.prevention === "irregular" || data.prevention === "never") recommendations.push("Planifier un rythme de prévention régulier afin de détecter les besoins suffisamment tôt.");
  if (data.timeline === "soon" || data.timeline === "ongoing") recommendations.push("Contrôler immédiatement les exclusions : un traitement conseillé ou commencé peut ne pas être couvert.");
  if (data.needs.includes("orthodontics") && (data.profile === "child" || data.profile === "unborn")) recommendations.push("Pour l’orthodontie, comparer l’âge limite d’entrée, le délai d’attente et le plafond total par enfant.");
  if (data.profile === "unborn") recommendations.push("Comparer les conditions de souscription prénatale avant la naissance et les délais d’activation.");
  if (data.crossBorderCare !== "no") recommendations.push("Vérifier par écrit si les soins réalisés dans un pays frontalier sont admis et selon quel tarif.");
  if (data.needs.includes("implants") || data.needs.includes("prosthetics")) recommendations.push("Pour les traitements importants, comparer le taux remboursé et le plafond annuel, pas seulement la prime.");
  if (!documents.contracts.length && data.verifyGuarantees) recommendations.push("Transmettre votre police et son tableau de prestations pour permettre une vérification détaillée.");
  if (recommendations.length < 3) recommendations.push("Conserver une réserve dédiée aux soins non couverts ou dépassant le plafond annuel.");

  if (score >= 72) {
    return { score, level: "solid", label: "Protection solide", summary: "Vos bases sont solides. Vérifiez encore les limites du contrat.", breakdown, planningNeed, recommendations };
  }
  if (score >= 42) {
    return { score, level: "partial", label: "Protection à renforcer", summary: "Vos bases existent, mais plusieurs limites restent à clarifier.", breakdown, planningNeed, recommendations };
  }
  return { score, level: "fragile", label: "Protection fragile", summary: "Une part importante des coûts pourrait rester à votre charge.", breakdown, planningNeed, recommendations };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(value);
}

export function deriveAssessmentRisks(data: AssessmentData, documents: AssessmentDocuments) {
  const risks: string[] = [];
  if (data.ambulatoryCoverage === "no") risks.push("Aucune complémentaire ambulatoire déclarée");
  if (data.ambulatoryCoverage === "unknown" || data.dentalParticipation === "unknown") risks.push("Garanties actuelles non vérifiées");
  if (data.timeline === "soon" || data.timeline === "ongoing") risks.push("Soins proches ou déjà engagés potentiellement exclus");
  if (data.reserve === "limited" || data.reserve === "none") risks.push("Capacité financière limitée face à un reste à charge");
  if (data.needs.includes("orthodontics")) risks.push("Plafonds et âge d’admission à contrôler pour l’orthodontie");
  if (data.crossBorderCare !== "no") risks.push("Prise en charge transfrontalière à confirmer par écrit");
  if (data.verifyGuarantees && !documents.contracts.length) risks.push("Police demandée mais non transmise");
  return risks;
}
