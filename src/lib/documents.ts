export const DEFAULT_DOCUMENT_MAX_SIZE_MB = 10;
export const DEFAULT_DOCUMENT_MAX_FILES = 5;
export const DEFAULT_DOCUMENT_RETENTION_DAYS = 30;

export type DocumentCategory = "contract" | "quote";

export type StoredDocument = {
  category: DocumentCategory;
  name: string;
  pathname: string;
  url: string;
  downloadUrl: string;
  size: number;
  contentType: "application/pdf";
  uploadedAt: string;
};

export type AssessmentDocuments = {
  contracts: StoredDocument[];
  quotes: StoredDocument[];
};

export const emptyAssessmentDocuments: AssessmentDocuments = {
  contracts: [],
  quotes: [],
};

export function getDocumentMaxSizeBytes() {
  const configured = Number(process.env.DOCUMENT_MAX_SIZE_MB);
  const megabytes = Number.isFinite(configured) && configured > 0
    ? Math.min(configured, DEFAULT_DOCUMENT_MAX_SIZE_MB)
    : DEFAULT_DOCUMENT_MAX_SIZE_MB;
  return Math.round(megabytes * 1024 * 1024);
}

export function getDocumentRetentionDays() {
  const configured = Number(process.env.LEAD_DOCUMENT_RETENTION_DAYS);
  return Number.isFinite(configured) && configured > 0
    ? Math.max(1, Math.round(configured))
    : DEFAULT_DOCUMENT_RETENTION_DAYS;
}

export function secureFilename(filename: string) {
  const withoutExtension = filename.replace(/\.pdf$/i, "");
  const normalized = withoutExtension.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const safe = normalized.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^[.-]+|[.-]+$/g, "").slice(0, 80);
  return `${safe || "document"}.pdf`;
}

export function isValidPdfFilename(filename: string) {
  return filename.length > 0
    && filename.length <= 120
    && filename.toLowerCase().endsWith(".pdf")
    && !/[\\/\u0000-\u001f\u007f]/.test(filename);
}

export function documentPathname(sessionId: string, category: DocumentCategory, filename: string) {
  return `leads/${sessionId}/${category}/${secureFilename(filename)}`;
}

export function isValidUploadSessionId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isDocumentOwnedBySession(document: StoredDocument, sessionId: string) {
  return isValidUploadSessionId(sessionId)
    && document.pathname.startsWith(`leads/${sessionId}/`)
    && document.contentType === "application/pdf"
    && document.size > 0
    && document.size <= getDocumentMaxSizeBytes();
}

export function validatePdfSelection(files: Array<{ name: string; type: string; size: number }>, remainingSlots: number) {
  if (!files.length) return "Aucun fichier sélectionné.";
  if (files.length > remainingSlots) return `Vous pouvez encore ajouter ${remainingSlots} fichier${remainingSlots > 1 ? "s" : ""}.`;
  if (files.some((file) => !isValidPdfFilename(file.name))) return "Le nom du fichier PDF est invalide.";
  if (files.some((file) => file.type !== "application/pdf")) return "Seuls les fichiers PDF avec un type MIME valide sont acceptés.";
  if (files.some((file) => file.size <= 0)) return "Le fichier PDF est vide.";
  if (files.some((file) => file.size > DEFAULT_DOCUMENT_MAX_SIZE_MB * 1024 * 1024)) return `Chaque fichier doit peser au maximum ${DEFAULT_DOCUMENT_MAX_SIZE_MB} Mo.`;
  return "";
}
