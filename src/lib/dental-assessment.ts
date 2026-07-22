export const needCatalog = {
  prevention: { label: "Prévention et contrôles", planningAmount: 350, description: "Contrôles, hygiène et soins préventifs" },
  orthodontics: { label: "Orthodontie", planningAmount: 8000, description: "Appareil ou alignement dentaire" },
  implants: { label: "Implants", planningAmount: 4500, description: "Remplacement d’une ou plusieurs dents" },
  prosthetics: { label: "Couronnes et prothèses", planningAmount: 3000, description: "Couronnes, bridges ou prothèses" },
  restorative: { label: "Soins courants", planningAmount: 1200, description: "Caries, traitements et réparations" },
  emergency: { label: "Urgences dentaires", planningAmount: 1500, description: "Réserve en cas d’imprévu" },
} as const;

export type NeedKey = keyof typeof needCatalog;
export type ProfileKey = "adult" | "child" | "family" | "";
export type CoverageKey = "none" | "basic" | "supplementary" | "unknown" | "";
export type PreventionKey = "twice" | "yearly" | "irregular" | "never" | "";
export type ReserveKey = "comfortable" | "partial" | "limited" | "none" | "";
export type TimelineKey = "preventive" | "year" | "soon" | "ongoing" | "";

export type AssessmentData = {
  profile: ProfileKey;
  canton: string;
  ageGroup: string;
  householdSize: number;
  needs: NeedKey[];
  customBudget: number;
  coverage: CoverageKey;
  knowsCoverage: boolean;
  prevention: PreventionKey;
  reserve: ReserveKey;
  timeline: TimelineKey;
  firstName: string;
  email: string;
  phone: string;
  consent: boolean;
};

export type AssessmentFiles = {
  contract: File | null;
  quote: File | null;
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
  householdSize: 1,
  needs: [],
  customBudget: 0,
  coverage: "",
  knowsCoverage: false,
  prevention: "",
  reserve: "",
  timeline: "",
  firstName: "",
  email: "",
  phone: "",
  consent: false,
};

export const profileLabels: Record<Exclude<ProfileKey, "">, string> = {
  adult: "Un adulte",
  child: "Un enfant",
  family: "Toute la famille",
};

export function calculatePlanningNeed(data: AssessmentData) {
  const catalogTotal = data.needs.reduce((total, need) => total + needCatalog[need].planningAmount, 0);
  const householdFactor = data.profile === "family" ? Math.min(1.8, 1 + Math.max(0, data.householdSize - 1) * 0.2) : 1;
  return data.customBudget || Math.round((catalogTotal * householdFactor) / 50) * 50;
}

export function calculateAssessment(data: AssessmentData, files: AssessmentFiles): AssessmentResult {
  const breakdown: ScoreBreakdown = {
    coverage: data.coverage === "supplementary" ? 24 : data.coverage === "unknown" ? 9 : data.coverage === "basic" ? 4 : 0,
    prevention: data.prevention === "twice" ? 20 : data.prevention === "yearly" ? 16 : data.prevention === "irregular" ? 7 : 0,
    anticipation: data.timeline === "preventive" ? 20 : data.timeline === "year" ? 13 : data.timeline === "soon" ? 5 : 1,
    budget: data.reserve === "comfortable" ? 20 : data.reserve === "partial" ? 12 : data.reserve === "limited" ? 5 : 0,
    documentation: (data.knowsCoverage ? 8 : 0) + (files.contract ? 5 : 0) + (files.quote ? 3 : 0),
  };

  const score = Math.max(0, Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0)));
  const planningNeed = calculatePlanningNeed(data);
  const recommendations: string[] = [];

  if (data.coverage !== "supplementary") recommendations.push("Vérifier si une complémentaire dentaire correspond à vos besoins et à votre horizon de soins.");
  if (!data.knowsCoverage) recommendations.push("Demander le tableau des prestations, les plafonds et les délais d’attente de votre couverture actuelle.");
  if (data.prevention === "irregular" || data.prevention === "never") recommendations.push("Planifier un rythme de prévention régulier afin de détecter les besoins suffisamment tôt.");
  if (data.timeline === "soon" || data.timeline === "ongoing") recommendations.push("Contrôler immédiatement les exclusions : un traitement conseillé ou commencé peut ne pas être couvert.");
  if (data.needs.includes("orthodontics") && (data.profile === "child" || data.profile === "family")) recommendations.push("Pour l’orthodontie, comparer l’âge limite d’entrée, le délai d’attente et le plafond total par enfant.");
  if (data.needs.includes("implants") || data.needs.includes("prosthetics")) recommendations.push("Pour les traitements importants, comparer le taux remboursé et le plafond annuel, pas seulement la prime.");
  if (!files.contract && data.coverage === "supplementary") recommendations.push("Ajouter votre contrat lors d’une prochaine session pour préparer une analyse détaillée des garanties.");
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
