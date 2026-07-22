import { jsPDF } from "jspdf";
import type { AssessmentData, AssessmentResult, TimelineKey } from "@/lib/dental-assessment";
import { needCatalog, profileLabels } from "@/lib/dental-assessment";

type PdfLike = InstanceType<typeof jsPDF>;
export type ReportFiles = { contract: boolean; quote: boolean };

function pdfText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘]/g, "'").replace(/[–—]/g, "-");
}

function formatPdfCurrency(value: number) {
  return `CHF ${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, "'")}`;
}

function addWrappedText(doc: PdfLike, text: string, x: number, y: number, maxWidth: number, lineHeight = 6) {
  const lines = doc.splitTextToSize(pdfText(text), maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addFooter(doc: PdfLike, page: number) {
  doc.setDrawColor(223, 230, 227);
  doc.line(18, 282, 192, 282);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("assurance-dentaire.ch - Un service VYDA SA", 18, 288);
  doc.text(`Page ${page}`, 192, 288, { align: "right" });
}

export function createDentalReport(data: AssessmentData, result: AssessmentResult, files: ReportFiles) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const green = [23, 102, 84] as const;
  const dark = [16, 45, 40] as const;
  const muted = [82, 97, 115] as const;

  doc.setFillColor(...green);
  doc.rect(0, 0, 210, 47, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ASSURANCE-DENTAIRE.CH", 18, 17);
  doc.setFontSize(24);
  doc.text("Bilan Protection Dentaire", 18, 31);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(pdfText(`Rapport personnel - ${new Intl.DateTimeFormat("fr-CH", { dateStyle: "long" }).format(new Date())}`), 18, 39);

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(52);
  doc.text(String(result.score), 22, 79);
  doc.setFontSize(13);
  doc.text("/ 100", 48, 78);
  doc.setFontSize(18);
  doc.text(pdfText(result.label), 78, 67);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  addWrappedText(doc, result.summary, 78, 75, 110, 5.5);

  doc.setFillColor(243, 247, 244);
  doc.roundedRect(18, 94, 174, 37, 4, 4, "F");
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Votre situation", 25, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(pdfText(`Profil : ${data.profile ? profileLabels[data.profile] : "Non renseigne"}`), 25, 114);
  const timelineLabels: Record<Exclude<TimelineKey, "">, string> = { preventive: "Demarche preventive", year: "Dans les 12 mois", soon: "Dans les 3 mois", ongoing: "Traitement en cours" };
  const timelineLabel = data.timeline ? timelineLabels[data.timeline] : "Non renseigne";
  doc.text(`Canton : ${data.canton}  |  Horizon : ${timelineLabel}`, 25, 121);
  doc.text(`Besoin de planification : ${formatPdfCurrency(result.planningNeed)}`, 110, 114);
  doc.text(`Documents ajoutes : ${(files.contract ? 1 : 0) + (files.quote ? 1 : 0)}`, 110, 121);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Besoins identifies", 18, 148);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let y = 158;
  data.needs.forEach((need) => {
    doc.setFillColor(227, 241, 236);
    doc.circle(21, y - 1.3, 1.5, "F");
    doc.setTextColor(...dark);
    doc.text(pdfText(needCatalog[need].label), 27, y);
    y += 8;
  });

  y = Math.max(y + 7, 182);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Actions recommandees", 18, y);
  y += 11;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  result.recommendations.slice(0, 5).forEach((recommendation, index) => {
    doc.setTextColor(...green);
    doc.setFont("helvetica", "bold");
    doc.text(String(index + 1).padStart(2, "0"), 18, y);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, recommendation, 29, y, 158, 5.2) + 4;
  });

  addFooter(doc, 1);
  doc.addPage();
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Detail du score", 18, 25);
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.text("Le score est un outil indicatif de preparation, pas une recommandation d'assurance.", 18, 34);

  const breakdownItems = [
    ["Couverture", result.breakdown.coverage, 24],
    ["Prevention", result.breakdown.prevention, 20],
    ["Anticipation", result.breakdown.anticipation, 20],
    ["Budget", result.breakdown.budget, 20],
    ["Documentation", result.breakdown.documentation, 16],
  ] as const;
  y = 52;
  breakdownItems.forEach(([label, value, maximum]) => {
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.text(label, 18, y);
    doc.text(`${value}/${maximum}`, 192, y, { align: "right" });
    doc.setFillColor(231, 237, 234);
    doc.roundedRect(18, y + 4, 174, 4, 2, 2, "F");
    doc.setFillColor(...green);
    doc.roundedRect(18, y + 4, 174 * (value / maximum), 4, 2, 2, "F");
    y += 27;
  });

  doc.setFillColor(255, 244, 239);
  doc.roundedRect(18, 201, 174, 46, 4, 4, "F");
  doc.setTextColor(120, 60, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("A retenir", 25, 214);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  addWrappedText(doc, "Les montants affiches sont des valeurs de planification modifiables, pas des devis. Les garanties, exclusions et conditions contractuelles de l'assureur font toujours foi.", 25, 224, 156, 5.5);
  addFooter(doc, 2);

  return new Uint8Array(doc.output("arraybuffer"));
}
