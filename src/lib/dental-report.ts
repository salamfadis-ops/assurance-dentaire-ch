import { jsPDF } from "jspdf";
import { needCatalog, profileLabels, type AssessmentData, type AssessmentResult, type TimelineKey } from "@/lib/dental-assessment";
import type { AssessmentDocuments } from "@/lib/documents";
import { contactPreferenceLabels } from "@/lib/lead";
import type { ValidatedLead } from "@/lib/lead-validation";

type PdfLike = InstanceType<typeof jsPDF>;

function pdfText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘]/g, "'").replace(/[–—]/g, "-");
}

function pdfCurrency(value: number) {
  return `CHF ${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
}

function wrapped(doc: PdfLike, text: string, x: number, y: number, width: number, lineHeight = 5.4) {
  const lines = doc.splitTextToSize(pdfText(text), width) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function footer(doc: PdfLike, page: number, label: string) {
  doc.setDrawColor(223, 230, 227);
  doc.line(18, 282, 192, 282);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`assurance-dentaire.ch - ${label} - VYDA SA`, 18, 288);
  doc.text(`Page ${page}`, 192, 288, { align: "right" });
}

function heading(doc: PdfLike, title: string, subtitle: string) {
  doc.setFillColor(23, 102, 84);
  doc.rect(0, 0, 210, 46, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("VYDA SA | ASSURANCE-DENTAIRE.CH", 18, 15);
  doc.setFontSize(22);
  doc.text(pdfText(title), 18, 29);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(pdfText(subtitle), 18, 38);
}

function scoreDetails(doc: PdfLike, result: AssessmentResult, startY = 58) {
  const dark = [16, 45, 40] as const;
  const breakdown = [
    ["Couverture", result.breakdown.coverage, 24],
    ["Prevention", result.breakdown.prevention, 20],
    ["Anticipation", result.breakdown.anticipation, 20],
    ["Budget", result.breakdown.budget, 20],
    ["Documentation", result.breakdown.documentation, 16],
  ] as const;
  let y = startY;
  breakdown.forEach(([label, value, maximum]) => {
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(label, 18, y);
    doc.text(`${value}/${maximum}`, 192, y, { align: "right" });
    doc.setFillColor(231, 237, 234);
    doc.roundedRect(18, y + 4, 174, 4, 2, 2, "F");
    doc.setFillColor(23, 102, 84);
    doc.roundedRect(18, y + 4, 174 * (value / maximum), 4, 2, 2, "F");
    y += 22;
  });
  return y;
}

export function createProspectReport(data: AssessmentData, result: AssessmentResult, documents: AssessmentDocuments) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const dark = [16, 45, 40] as const;
  const muted = [82, 97, 115] as const;
  const documentCount = documents.contracts.length + documents.quotes.length;
  heading(doc, "Bilan Protection Dentaire", `Rapport prospect - ${new Intl.DateTimeFormat("fr-CH", { dateStyle: "long" }).format(new Date())}`);

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(48);
  doc.text(String(result.score), 20, 78);
  doc.setFontSize(12);
  doc.text("/ 100", 46, 77);
  doc.setFontSize(17);
  doc.text(pdfText(result.label), 77, 66);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...muted);
  wrapped(doc, result.summary, 77, 74, 112);

  doc.setFillColor(243, 247, 244);
  doc.roundedRect(18, 93, 174, 39, 4, 4, "F");
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Votre situation", 25, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  const timelineLabels: Record<Exclude<TimelineKey, "">, string> = { preventive: "Demarche preventive", year: "Dans les 12 mois", soon: "Dans les 3 mois", ongoing: "Traitement en cours" };
  doc.text(pdfText(`Profil : ${data.profile ? profileLabels[data.profile] : "Non renseigne"}`), 25, 115);
  doc.text(pdfText(`Canton : ${data.canton} | Horizon : ${data.timeline ? timelineLabels[data.timeline] : "Non renseigne"}`), 25, 123);
  doc.text(pdfText(`Planification : ${pdfCurrency(result.planningNeed)} | Documents : ${documentCount}`), 108, 115);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Points forts", 18, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const strengths = [
    result.breakdown.prevention >= 16 ? "Un rythme de prevention regulier est declare." : "Le bilan identifie clairement le rythme de prevention.",
    data.needs.length ? `${data.needs.length} besoin(s) ont ete priorises.` : "Les priorites restent a preciser.",
    documentCount ? "Des documents ont ete transmis pour verification." : "Aucun document n'est necessaire pour lire ce rapport.",
  ];
  let y = 160;
  strengths.forEach((item) => { doc.setFillColor(227, 241, 236); doc.circle(21, y - 1.2, 1.5, "F"); doc.setTextColor(...muted); y = wrapped(doc, item, 27, y, 160) + 4; });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.setFontSize(14);
  doc.text("Points a verifier", 18, y + 4);
  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  result.recommendations.slice(0, 5).forEach((recommendation, index) => { doc.setTextColor(23, 102, 84); doc.setFont("helvetica", "bold"); doc.text(String(index + 1).padStart(2, "0"), 18, y); doc.setTextColor(...muted); doc.setFont("helvetica", "normal"); y = wrapped(doc, recommendation, 29, y, 158, 5.1) + 3; });
  footer(doc, 1, "Rapport prospect");

  doc.addPage();
  heading(doc, "Detail du score", "Cinq dimensions de preparation");
  y = scoreDetails(doc, result, 62);
  doc.setFillColor(255, 244, 239);
  doc.roundedRect(18, y + 4, 174, 50, 4, 4, "F");
  doc.setTextColor(120, 60, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Disclaimer", 25, y + 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  wrapped(doc, "Ce bilan est un outil indicatif de preparation. Il ne constitue ni une offre d'assurance, ni un diagnostic, ni une garantie de remboursement. Les conditions contractuelles de l'assureur font foi.", 25, y + 27, 156, 5.3);
  footer(doc, 2, "Rapport prospect");
  return new Uint8Array(doc.output("arraybuffer"));
}

export function createAdvisorReport(lead: ValidatedLead) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const dark = [16, 45, 40] as const;
  const muted = [82, 97, 115] as const;
  heading(doc, "Synthese conseiller", `Interne VYDA - ${lead.createdAt}`);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(pdfText(`${lead.contact.lastName} ${lead.contact.firstName}`), 18, 63);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...muted);
  let y = 74;
  const contactLines = [
    `Telephone : ${lead.contact.phone}`,
    `E-mail : ${lead.contact.email || "Non renseigne"}`,
    `Canton : ${lead.contact.canton || "Non renseigne"}`,
    `Parcours : ${lead.journey}`,
    `Preference : ${contactPreferenceLabels[lead.contact.preference]}`,
    `Calendly : ${lead.calendlyStatus}`,
    `Consentement : ${lead.consent.timestamp}`,
  ];
  contactLines.forEach((line) => { doc.text(pdfText(line), 18, y); y += 7; });

  if (lead.score && lead.answers) {
    const result: AssessmentResult = {
      score: lead.score.global,
      breakdown: lead.score.breakdown,
      level: lead.score.global >= 72 ? "solid" : lead.score.global >= 42 ? "partial" : "fragile",
      label: lead.score.global >= 72 ? "Protection solide" : lead.score.global >= 42 ? "Protection a renforcer" : "Protection fragile",
      summary: "Synthese calculee a partir des reponses du prospect.",
      planningNeed: lead.answers.customBudget,
      recommendations: lead.priorities,
    };
    y = scoreDetails(doc, result, y + 6);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...dark);
  doc.text("Risques identifies", 18, y + 3);
  y += 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  (lead.risks.length ? lead.risks : ["Aucun risque automatique identifie"]).slice(0, 6).forEach((risk) => { doc.setTextColor(...muted); y = wrapped(doc, `- ${risk}`, 18, y, 172, 5.1) + 3; });
  footer(doc, 1, "Document interne");

  doc.addPage();
  heading(doc, "Reponses et points a clarifier", "Document interne - ne pas transmettre sans controle");
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Reponses principales", 18, 61);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y = 72;
  const answerLines = lead.answers ? [
    `Profil : ${lead.answers.profile}`,
    `Ambulatoire : ${lead.answers.ambulatoryCoverage}`,
    `Participation dentaire : ${lead.answers.dentalParticipation}`,
    `Verification demandee : ${lead.answers.verifyGuarantees ? "oui" : "non"}`,
    `Besoins : ${lead.answers.needs.map((need) => needCatalog[need].label).join(", ")}`,
    `Prevention : ${lead.answers.prevention}`,
    `Reserve : ${lead.answers.reserve}`,
    `Horizon : ${lead.answers.timeline}`,
    `Soins frontaliers : ${lead.answers.crossBorderCare}`,
  ] : ["Aucun questionnaire complet pour ce parcours."];
  answerLines.forEach((line) => { doc.setTextColor(...muted); y = wrapped(doc, line, 18, y, 174, 5.2) + 3; });
  y += 4;
  doc.setFont("helvetica", "bold"); doc.setTextColor(...dark); doc.setFontSize(13); doc.text("Documents disponibles", 18, y); y += 10;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  (lead.documents.length ? lead.documents.map((item) => `${item.category} - ${item.name}`) : ["Aucun document transmis"]).forEach((line) => { doc.setTextColor(...muted); y = wrapped(doc, line, 18, y, 174, 5.2) + 3; });
  y += 4;
  doc.setFont("helvetica", "bold"); doc.setTextColor(...dark); doc.setFontSize(13); doc.text("Source du lead", 18, y); y += 10;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...muted);
  [`Source : ${lead.attribution.source || "Direct"}`, `Campagne : ${lead.attribution.campaign || "Non renseignee"}`, `Mot-cle : ${lead.attribution.term || "Non renseigne"}`, `Page d'entree : ${lead.attribution.entryPage || "Non renseignee"}`].forEach((line) => { y = wrapped(doc, line, 18, y, 174, 5.2) + 3; });
  footer(doc, 2, "Document interne");
  return new Uint8Array(doc.output("arraybuffer"));
}

export const createDentalReport = createProspectReport;
