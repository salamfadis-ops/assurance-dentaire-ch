import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import {
  needCatalog,
  objectiveLabels,
  profileLabels,
  type AssessmentData,
  type AssessmentResult,
  type TimelineKey,
} from "@/lib/dental-assessment";
import type { AssessmentDocuments } from "@/lib/documents";
import { contactPreferenceLabels } from "@/lib/lead";
import type { ValidatedLead } from "@/lib/lead-validation";

type PdfLike = InstanceType<typeof jsPDF>;
type Rgb = readonly [number, number, number];

export type ProspectReportIdentity = {
  firstName?: string;
  lastName?: string;
  reference?: string;
  generatedAt?: string;
};

const A4 = { width: 210, height: 297 };
const colors = {
  navy: [8, 30, 44] as const,
  green: [23, 102, 84] as const,
  mint: [225, 241, 235] as const,
  gold: [197, 151, 73] as const,
  ink: [18, 45, 51] as const,
  muted: [82, 101, 112] as const,
  line: [220, 230, 226] as const,
  paper: [247, 249, 247] as const,
  coralPaper: [254, 245, 239] as const,
};

const timelineLabels: Record<Exclude<TimelineKey, "">, string> = {
  preventive: "Demarche preventive",
  year: "Dans les 12 mois",
  soon: "Dans les 3 mois",
  ongoing: "Traitement conseille ou en cours",
};

function pdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE");
}

function pdfCurrency(value: number) {
  return `CHF ${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
}

function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-CH", { dateStyle: "long" }).format(date);
}

function shortReference(value?: string) {
  const compact = value?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return compact ? `VYDA-${compact.slice(0, 12)}` : `VYDA-${Date.now().toString(36).toUpperCase()}`;
}

function wrapped(doc: PdfLike, text: string, x: number, y: number, width: number, lineHeight = 5.2) {
  const lines = doc.splitTextToSize(pdfText(text), width) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function watermark(doc: PdfLike) {
  doc.setTextColor(237, 242, 239);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(54);
  doc.text("VYDA", 105, 168, { align: "center", angle: 35 });
}

function pageHeader(doc: PdfLike, kicker: string, title: string) {
  watermark(doc);
  doc.setFillColor(...colors.navy);
  doc.rect(0, 0, A4.width, 43, "F");
  doc.setFillColor(...colors.gold);
  doc.rect(0, 43, A4.width, 1.5, "F");
  doc.setTextColor(191, 226, 214);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(pdfText(kicker.toUpperCase()), 18, 14);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(pdfText(title), 18, 29);
}

function addPage(doc: PdfLike, kicker: string, title: string) {
  doc.addPage();
  pageHeader(doc, kicker, title);
}

function sectionTitle(doc: PdfLike, title: string, y: number, subtitle?: string) {
  doc.setTextColor(...colors.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(pdfText(title), 18, y);
  if (!subtitle) return y + 9;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.muted);
  doc.setFontSize(9);
  return wrapped(doc, subtitle, 18, y + 8, 174, 5.1) + 3;
}

function card(doc: PdfLike, x: number, y: number, width: number, height: number, fill: Rgb = colors.paper) {
  doc.setLineWidth(0.25);
  doc.setFillColor(...fill);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x, y, width, height, 4, 4, "FD");
}

function labelValue(doc: PdfLike, label: string, value: string, x: number, y: number, width: number) {
  doc.setTextColor(...colors.muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(pdfText(label.toUpperCase()), x, y);
  doc.setTextColor(...colors.ink);
  doc.setFontSize(10);
  return wrapped(doc, value, x, y + 7, width, 5.2);
}

function bulletList(doc: PdfLike, items: string[], x: number, y: number, width: number, maximum = 6) {
  let cursor = y;
  items.slice(0, maximum).forEach((item) => {
    doc.setFillColor(...colors.green);
    doc.circle(x + 2, cursor - 1.4, 1.25, "F");
    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.3);
    cursor = wrapped(doc, item, x + 7, cursor, width - 7, 5.2) + 4;
  });
  return cursor;
}

function scoreDetails(doc: PdfLike, result: AssessmentResult, startY: number) {
  const breakdown = [
    ["Couverture", result.breakdown.coverage, 24],
    ["Prevention", result.breakdown.prevention, 20],
    ["Anticipation", result.breakdown.anticipation, 20],
    ["Budget", result.breakdown.budget, 20],
    ["Documentation", result.breakdown.documentation, 16],
  ] as const;
  let y = startY;
  breakdown.forEach(([label, value, maximum]) => {
    doc.setTextColor(...colors.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, 18, y);
    doc.text(`${value}/${maximum}`, 192, y, { align: "right" });
    doc.setFillColor(226, 233, 230);
    doc.roundedRect(18, y + 4, 174, 4, 2, 2, "F");
    doc.setFillColor(...colors.green);
    doc.roundedRect(18, y + 4, 174 * (value / maximum), 4, 2, 2, "F");
    y += 13;
  });
  return y;
}

function strengthsFor(data: AssessmentData, documents: AssessmentDocuments) {
  const strengths: string[] = [];
  if (data.dentalParticipation === "yes") strengths.push("Une participation dentaire ou orthodontique est declaree dans la couverture actuelle.");
  if (data.ambulatoryCoverage === "yes") strengths.push("Une assurance complementaire ambulatoire est deja identifiee.");
  if (data.prevention === "twice" || data.prevention === "yearly") strengths.push("Un rythme de prevention regulier est declare.");
  if (data.reserve === "comfortable" || data.reserve === "partial") strengths.push("Une capacite de financement au moins partielle est declaree.");
  if (data.timeline === "preventive") strengths.push("La demarche est engagee avant qu'un traitement soit annonce.");
  if (data.hasQuote && data.quoteAmount > 0) strengths.push(`Un devis d'environ ${pdfCurrency(data.quoteAmount)} donne une base concrete a l'analyse.`);
  if (documents.contracts.length) strengths.push(`${documents.contracts.length} document(s) de couverture ont ete transmis pour verification.`);
  if (documents.quotes.length) strengths.push(`${documents.quotes.length} devis ont ete transmis avec le bilan.`);
  return strengths;
}

function executiveSummary(data: AssessmentData, result: AssessmentResult) {
  const objective = data.objective ? objectiveLabels[data.objective].toLowerCase() : "clarifier votre protection";
  return `Votre score atteint ${result.score}/100. ${result.summary} Votre objectif est de ${objective}. Les prochaines vérifications doivent confirmer les prestations réellement applicables avant toute décision.`;
}

function checksFor(data: AssessmentData) {
  const checks: string[] = [];
  const hasExistingCoverage = data.coverage === "supplementary" || data.ambulatoryCoverage === "yes" || data.dentalParticipation === "yes";
  if (hasExistingCoverage || data.ambulatoryCoverage === "unknown") {
    checks.push("Plafond annuel ou plafond total applicable aux soins vises.");
    checks.push("Taux de remboursement, franchise et quote-part restant a charge.");
    checks.push("Garanties dentaires ou orthodontiques deja presentes dans la complementaire ambulatoire.");
  }
  if (data.timeline === "soon" || data.timeline === "ongoing" || data.objective === "anticipate_treatment") {
    checks.push("Exclusions concernant les traitements conseilles, planifies ou deja commences.");
    checks.push("Delais d'attente avant l'ouverture effective des prestations.");
  }
  if (data.profile === "child" || data.profile === "unborn" || data.needs.includes("orthodontics")) {
    checks.push("Age limite d'admission, questionnaire medical et controle dentaire eventuel.");
    checks.push("Conditions specifiques et plafond total pour l'orthodontie.");
  }
  if (data.needs.includes("implants") || data.needs.includes("prosthetics")) {
    checks.push("Limites par acte, par annee et par categorie de prothese ou d'implant.");
  }
  if (data.objective === "compare" || data.ambulatoryCoverage === "no") {
    checks.push("Conditions d'admission, exclusions et date de prise d'effet avant toute souscription.");
  }
  return [...new Set(checks)];
}

function actionPlanFor(data: AssessmentData, result: AssessmentResult, documents: AssessmentDocuments) {
  const immediate: string[] = [];
  const verify: string[] = [];
  const plan: string[] = [];

  if (data.timeline === "soon" || data.timeline === "ongoing") immediate.push("Faire examiner la situation avant d'engager de nouveaux frais, sans presumer d'une prise en charge.");
  if (data.hasQuote) immediate.push("Rassembler le devis detaille et identifier les actes, dates et montants.");
  if (data.verifyGuarantees && !documents.contracts.length) immediate.push("Transmettre la police et le tableau de prestations a VYDA.");
  if (!immediate.length) immediate.push("Conserver les documents actuels et la reference de ce bilan pour le prochain echange.");

  verify.push(...checksFor(data).slice(0, 4));
  if (!verify.length) verify.push("Relire les conditions generales et particulieres applicables au contrat.");

  if (data.reserve === "limited" || data.reserve === "none") plan.push("Construire progressivement une reserve pour les montants non couverts.");
  if (data.prevention === "irregular" || data.prevention === "never") plan.push("Planifier des controles preventifs reguliers avec le professionnel de sante.");
  plan.push(...result.recommendations.filter((item) => !verify.includes(item)).slice(0, 2));
  return { immediate, verify, plan };
}

function addFooters(doc: PdfLike, reference: string, generatedAt: string) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    const cover = page === 1;
    doc.setLineWidth(0.25);
    const footerLine: Rgb = cover ? [72, 97, 107] : colors.line;
    doc.setDrawColor(footerLine[0], footerLine[1], footerLine[2]);
    doc.line(18, 278, 192, 278);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    const footerText: Rgb = cover ? [205, 218, 220] : colors.muted;
    doc.setTextColor(footerText[0], footerText[1], footerText[2]);
    doc.text("VYDA SA · contact@vyda.ch · +41 79 480 99 10 · vyda.ch", 18, 284);
    doc.text(pdfText(`Genere le ${formatDate(generatedAt)} · Ref. ${reference}`), 18, 290);
    doc.text(`Page ${page} / ${pages}`, 192, 290, { align: "right" });
  }
}

async function qrDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#081E2C", light: "#FFFFFF" },
  });
}

export async function createProspectReport(
  data: AssessmentData,
  result: AssessmentResult,
  documents: AssessmentDocuments,
  identity: ProspectReportIdentity = {},
) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const generatedAt = identity.generatedAt || new Date().toISOString();
  const reference = shortReference(identity.reference);
  const fullName = [identity.firstName, identity.lastName].filter(Boolean).join(" ") || "Destinataire du bilan";
  const strengths = strengthsFor(data, documents);
  const checks = checksFor(data);
  const actionPlan = actionPlanFor(data, result, documents);
  const documentCount = documents.contracts.length + documents.quotes.length;

  // Page 1 — couverture
  doc.setFillColor(...colors.navy);
  doc.rect(0, 0, A4.width, A4.height, "F");
  doc.setFillColor(...colors.green);
  doc.rect(0, 0, 12, A4.height, "F");
  doc.setFillColor(...colors.gold);
  doc.rect(12, 0, 2, A4.height, "F");
  doc.setTextColor(195, 229, 217);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("VYDA SA", 24, 26);
  doc.setFontSize(8);
  doc.text("ASSURANCE-DENTAIRE.CH", 24, 35);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(30);
  const coverTitle = doc.splitTextToSize("Rapport personnalise de protection dentaire", 150) as string[];
  doc.text(coverTitle, 24, 86);
  doc.setFillColor(...colors.gold);
  doc.rect(24, 121, 46, 1.5, "F");
  doc.setTextColor(216, 228, 229);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(pdfText(fullName), 24, 147);
  doc.setFontSize(9);
  doc.text(pdfText(`Date : ${formatDate(generatedAt)}`), 24, 161);
  doc.text(`Reference : ${reference}`, 24, 170);
  card(doc, 24, 194, 162, 48, [14, 43, 56]);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Prepare par VYDA SA - Meyrin, Geneve", 34, 211);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(194, 211, 214);
  doc.setFontSize(10);
  doc.text("Cabinet independant en prevoyance et assurances", 34, 226);

  // Page 2 — résumé exécutif
  addPage(doc, "Lecture rapide", "Resume executif");
  doc.setDrawColor(...colors.green);
  doc.setLineWidth(5);
  doc.circle(52, 89, 28, "S");
  doc.setTextColor(...colors.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(35);
  doc.text(String(result.score), 52, 87, { align: "center" });
  doc.setFontSize(9);
  doc.text("/ 100", 52, 98, { align: "center" });
  doc.setFontSize(19);
  doc.text(pdfText(result.label), 92, 71);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.muted);
  doc.setFontSize(10);
  wrapped(doc, executiveSummary(data, result), 92, 82, 98, 5.7);
  card(doc, 92, 109, 98, 24, colors.mint);
  labelValue(doc, "Points a verifier", `${checks.length} point${checks.length > 1 ? "s" : ""} prioritaire${checks.length > 1 ? "s" : ""}`, 101, 119, 80);
  let y = sectionTitle(doc, "Principaux points forts", 153, "Uniquement a partir des informations declarees.");
  y = bulletList(doc, strengths.length ? strengths : ["Aucun point fort contractuel ne peut etre confirme sans document."], 20, y, 170, 4);
  y = sectionTitle(doc, "Detail du score", Math.max(y + 3, 205));
  scoreDetails(doc, result, y);

  // Page 3 — situation
  addPage(doc, "Donnees declarees", "Situation personnelle");
  let sy = sectionTitle(doc, "Profil et objectif", 59, "Les donnees ci-dessous n'ont pas ete verifiees aupres d'un assureur.");
  const columns = [
    ["Profil", data.profile ? profileLabels[data.profile] : "Non renseigne"],
    ["Canton", data.canton || "Non renseigne"],
    ["Age / naissance", data.profile === "child" ? `${data.childAge || "Non renseigne"} ans` : data.profile === "unborn" ? data.expectedBirthDate || "Non renseignee" : "Adulte"],
    ["Objectif principal", data.objective ? objectiveLabels[data.objective] : "Non renseigne"],
  ];
  columns.forEach(([label, value], index) => {
    const x = index % 2 === 0 ? 18 : 107;
    const y = sy + Math.floor(index / 2) * 31;
    card(doc, x, y, 85, 25);
    labelValue(doc, label, value, x + 8, y + 9, 70);
  });
  sy += 69;
  sy = sectionTitle(doc, "Couverture et garanties", sy);
  const situationLines = [
    `Couverture dentaire declaree : ${data.coverage || "non renseignee"}`,
    `Complementaire ambulatoire : ${data.ambulatoryCoverage || "non renseignee"}`,
    `Participation dentaire / orthodontie : ${data.dentalParticipation || "non renseignee"}`,
    `Analyse du contrat souhaitee : ${data.verifyGuarantees ? "oui" : "non"}`,
    `Devis deja recu : ${data.hasQuote ? "oui" : "non"}`,
    data.hasQuote && data.quoteAmount ? `Montant approximatif du devis : ${pdfCurrency(data.quoteAmount)}` : "Montant du devis : non renseigne",
    `Horizon des soins : ${data.timeline ? timelineLabels[data.timeline] : "non renseigne"}`,
    `Documents transmis : ${documentCount}`,
  ];
  sy = bulletList(doc, situationLines, 20, sy, 170, 8);
  sectionTitle(doc, "Besoins selectionnes", sy + 3);
  bulletList(doc, data.needs.map((need) => needCatalog[need].label), 20, sy + 15, 170, 6);

  // Page 4 — points forts
  addPage(doc, "Elements favorables", "Points forts issus de vos reponses");
  let fy = sectionTitle(doc, "Ce qui soutient votre preparation", 59, "Ces elements ne constituent pas des garanties d'assurance.");
  const strengthItems = strengths.length ? strengths : ["Aucun element favorable ne peut etre confirme sur la seule base des reponses actuelles."];
  strengthItems.slice(0, 5).forEach((item, index) => {
    card(doc, 18, fy, 174, 27, index % 2 === 0 ? colors.paper : colors.mint);
    doc.setFillColor(...colors.green);
    doc.circle(30, fy + 13.5, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(String(index + 1), 30, fy + 16, { align: "center" });
    doc.setTextColor(...colors.ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);
    wrapped(doc, item, 40, fy + 11, 142, 5.1);
    fy += 32;
  });
  card(doc, 18, 244, 174, 23, colors.coralPaper);
  doc.setTextColor(119, 69, 42);
  doc.setFontSize(8.8);
  wrapped(doc, "Important : seule la lecture des documents contractuels permet de confirmer une prestation, un plafond ou un remboursement.", 26, 254, 158, 5.1);

  // Page 5 — points à vérifier
  addPage(doc, "Controle contractuel", "Points a verifier");
  let cy = sectionTitle(doc, "Verification ciblee", 59, "Les points affiches sont selectionnes selon le profil, les besoins et l'horizon declares.");
  const relevantChecks = checks.length ? checks : ["Conditions generales et particulieres de la couverture en vigueur."];
  relevantChecks.slice(0, 6).forEach((item, index) => {
    card(doc, 18, cy, 174, 22);
    doc.setTextColor(...colors.gold);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(String(index + 1).padStart(2, "0"), 28, cy + 13.5);
    doc.setTextColor(...colors.ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.1);
    wrapped(doc, item, 43, cy + 9.5, 139, 4.8);
    cy += 25;
  });
  card(doc, 18, 239, 174, 28, colors.mint);
  doc.setTextColor(...colors.green);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  wrapped(doc, "VYDA peut rapprocher ces points de votre police, de votre attestation et du tableau de prestations.", 26, 251, 158, 5);

  // Page 6 — plan d’action
  addPage(doc, "Prochaines etapes", "Plan d'action prudent");
  let ay = 61;
  const levels = [
    ["Priorite immediate", actionPlan.immediate, colors.coralPaper, [132, 68, 35] as const],
    ["A verifier", actionPlan.verify, colors.paper, colors.green],
    ["A prevoir", actionPlan.plan, colors.mint, colors.ink],
  ] as const;
  levels.forEach(([title, items, fill, accent]) => {
    const height = 59;
    card(doc, 18, ay, 174, height, fill);
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.roundedRect(18, ay, 5, height, 3, 3, "F");
    doc.setTextColor(...colors.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, 31, ay + 13);
    bulletList(doc, items, 31, ay + 25, 150, 3);
    ay += 65;
  });
  card(doc, 18, 256, 174, 12, [241, 244, 243]);
  doc.setTextColor(...colors.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.text("Aucune acceptation, economie ou prise en charge n'est promise par ce plan.", 105, 264, { align: "center" });

  // Page 7 — contact et disclaimer
  addPage(doc, "Votre interlocuteur", "Contact VYDA");
  card(doc, 18, 57, 174, 61, colors.navy);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("VYDA SA", 30, 76);
  doc.setFontSize(10);
  doc.text("Cabinet independant en prevoyance et assurances", 30, 88);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(199, 215, 217);
  doc.text("Meyrin - Geneve", 30, 98);
  doc.text("+41 79 480 99 10  ·  contact@vyda.ch  ·  vyda.ch", 30, 108);

  const siteQr = await qrDataUrl("https://vyda.ch");
  doc.addImage(siteQr, "PNG", 26, 131, 42, 42);
  doc.setTextColor(...colors.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Decouvrir VYDA", 47, 180, { align: "center" });

  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL?.trim();
  if (calendlyUrl) {
    const calendlyQr = await qrDataUrl(calendlyUrl);
    doc.addImage(calendlyQr, "PNG", 83, 131, 42, 42);
    doc.text("Choisir un creneau", 104, 180, { align: "center" });
  }

  card(doc, calendlyUrl ? 140 : 83, 131, calendlyUrl ? 52 : 109, 49, colors.mint);
  doc.setTextColor(...colors.green);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  wrapped(doc, "Un conseiller VYDA peut verifier vos garanties existantes et vous aider a comparer les solutions adaptees a votre situation.", calendlyUrl ? 148 : 92, 145, calendlyUrl ? 36 : 91, 5.3);

  card(doc, 18, 196, 174, 58, colors.coralPaper);
  doc.setTextColor(117, 66, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Cadre de cette analyse", 28, 210);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.6);
  wrapped(
    doc,
    "Ce rapport repose sur les informations declarees par l'utilisateur et constitue une premiere analyse indicative. Il ne remplace pas l'examen des conditions generales, des attestations d'assurance, des exclusions et des decisions d'admission de l'assureur.",
    28,
    221,
    154,
    5.2,
  );

  addFooters(doc, reference, generatedAt);
  return new Uint8Array(doc.output("arraybuffer"));
}

export function createAdvisorReport(lead: ValidatedLead) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const reference = shortReference(lead.requestId);
  pageHeader(doc, "Document interne", "Synthese conseiller VYDA");
  doc.setTextColor(...colors.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(pdfText(`${lead.contact.lastName} ${lead.contact.firstName}`), 18, 62);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.muted);
  doc.setFontSize(9);
  let y = 74;
  [
    `Telephone : ${lead.contact.phone}`,
    `E-mail : ${lead.contact.email || "Non renseigne"}`,
    `Canton : ${lead.contact.canton || "Non renseigne"}`,
    `Parcours : ${lead.journey}`,
    `Preference : ${contactPreferenceLabels[lead.contact.preference]}`,
    `Calendly : ${lead.calendlyStatus}`,
    `Consentement : ${lead.consent.timestamp}`,
  ].forEach((line) => { doc.text(pdfText(line), 18, y); y += 7; });

  if (lead.score && lead.answers) {
    const result: AssessmentResult = {
      score: lead.score.global,
      breakdown: lead.score.breakdown,
      level: lead.score.global >= 72 ? "solid" : lead.score.global >= 42 ? "partial" : "fragile",
      label: lead.score.global >= 72 ? "Protection solide" : lead.score.global >= 42 ? "Protection a renforcer" : "Protection fragile",
      summary: "Synthese calculee a partir des reponses du prospect.",
      planningNeed: lead.answers.customBudget || lead.answers.quoteAmount,
      recommendations: lead.priorities,
    };
    y = scoreDetails(doc, result, y + 5);
  }

  y = sectionTitle(doc, "Risques identifies", y + 1);
  bulletList(doc, lead.risks.length ? lead.risks : ["Aucun risque automatique identifie."], 20, y, 170, 5);

  addPage(doc, "Document interne", "Reponses et points a clarifier");
  y = sectionTitle(doc, "Reponses principales", 59);
  const answerLines = lead.answers ? [
    `Profil : ${lead.answers.profile}`,
    `Ambulatoire : ${lead.answers.ambulatoryCoverage}`,
    `Participation dentaire : ${lead.answers.dentalParticipation}`,
    `Verification demandee : ${lead.answers.verifyGuarantees ? "oui" : "non"}`,
    `Objectif : ${lead.answers.objective ? objectiveLabels[lead.answers.objective] : "non renseigne"}`,
    `Devis : ${lead.answers.hasQuote ? "oui" : "non"}${lead.answers.quoteAmount ? ` - ${pdfCurrency(lead.answers.quoteAmount)}` : ""}`,
    `Besoins : ${lead.answers.needs.map((need) => needCatalog[need].label).join(", ")}`,
    `Prevention : ${lead.answers.prevention}`,
    `Reserve : ${lead.answers.reserve}`,
    `Horizon : ${lead.answers.timeline}`,
  ] : ["Aucun questionnaire complet pour ce parcours."];
  y = bulletList(doc, answerLines, 20, y, 170, 10);
  y = sectionTitle(doc, "Documents disponibles", y + 3);
  y = bulletList(doc, lead.documents.length ? lead.documents.map((item) => `${item.category} - ${item.name}`) : ["Aucun document transmis"], 20, y, 170, 5);
  y = sectionTitle(doc, "Source du lead", y + 3);
  bulletList(doc, [
    `Source : ${lead.attribution.source || "Direct"}`,
    `Campagne : ${lead.attribution.campaign || "Non renseignee"}`,
    `Mot-cle : ${lead.attribution.term || "Non renseigne"}`,
    `Page d'entree : ${lead.attribution.entryPage || "Non renseignee"}`,
  ], 20, y, 170, 4);
  addFooters(doc, reference, lead.createdAt);
  return new Uint8Array(doc.output("arraybuffer"));
}

export const createDentalReport = createProspectReport;
