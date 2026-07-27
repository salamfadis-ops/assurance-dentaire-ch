import {
  BlobAccessError,
  BlobContentTypeNotAllowedError,
  BlobFileTooLargeError,
  BlobServiceNotAvailable,
  BlobServiceRateLimited,
  BlobStoreNotFoundError,
  BlobStoreSuspendedError,
  head,
  issueSignedToken,
  presignUrl,
} from "@vercel/blob";
import { NextResponse } from "next/server";
import { getDocumentStorageConfiguration } from "@/lib/document-storage";
import {
  DEFAULT_DOCUMENT_MAX_FILES,
  documentPathname,
  getDocumentMaxSizeBytes,
  isValidPdfFilename,
  isValidUploadSessionId,
  type DocumentCategory,
} from "@/lib/documents";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type UploadAuthorization = {
  action: "authorize";
  sessionId: string;
  category: DocumentCategory;
  filename: string;
  pathname: string;
  contentType: string;
  size: number;
};

type UploadReport = {
  action: "report";
  requestId: string;
  sessionId: string;
  result: "success" | "failed";
  providerStatus?: number;
  providerCode?: string;
  message?: string;
  pathname?: string;
  url?: string;
  downloadUrl?: string;
  size?: number;
  contentType?: string;
};

type UploadSession = {
  count: number;
  resetAt: number;
  pending: Set<string>;
};

const uploadSessions = new Map<string, UploadSession>();

class UploadValidationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 422,
  ) {
    super(message);
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, maxLength = 200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function safeProviderCode(value: unknown) {
  const code = text(value, 80).replace(/[^a-zA-Z0-9_.-]/g, "_");
  return code || "unknown_error";
}

function safeProviderMessage(value: unknown) {
  return text(value, 300)
    .replace(/vercel_blob_[a-zA-Z0-9_=-]+/g, "[secret-redacted]")
    .replace(/eyJ[a-zA-Z0-9_.-]+/g, "[token-redacted]");
}

function isValidBlobUrl(value: string, sessionId: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname.endsWith(".blob.vercel-storage.com")
      && url.pathname.startsWith(`/leads/${sessionId}/`);
  } catch {
    return false;
  }
}

function parseAuthorization(value: unknown): UploadAuthorization {
  const source = record(value);
  const sessionId = text(source.sessionId, 80);
  const category = text(source.category, 20) as DocumentCategory;
  const filename = text(source.filename, 121);
  const pathname = text(source.pathname, 500);
  const contentType = text(source.contentType, 100).toLowerCase();
  const size = Number(source.size);

  if (source.action !== "authorize") throw new UploadValidationError("UPLOAD_ACTION_INVALID", "Action d’upload invalide.", 400);
  if (!isValidUploadSessionId(sessionId)) throw new UploadValidationError("UPLOAD_SESSION_INVALID", "Session d’upload invalide.");
  if (category !== "contract" && category !== "quote") throw new UploadValidationError("UPLOAD_CATEGORY_INVALID", "Catégorie de document invalide.");
  if (!isValidPdfFilename(filename)) throw new UploadValidationError("UPLOAD_FILENAME_INVALID", "Le nom du fichier PDF est invalide.");
  if (contentType !== "application/pdf") throw new UploadValidationError("UPLOAD_CONTENT_TYPE_INVALID", "Le Content-Type doit être application/pdf.", 415);
  if (!Number.isInteger(size) || size <= 0) throw new UploadValidationError("UPLOAD_FILE_EMPTY", "Le fichier PDF est vide ou sa taille est invalide.");
  if (size > getDocumentMaxSizeBytes()) throw new UploadValidationError("UPLOAD_FILE_TOO_LARGE", "Le fichier PDF dépasse la taille maximale de 10 Mo.", 413);

  const expectedPath = documentPathname(sessionId, category, filename);
  if (pathname !== expectedPath) throw new UploadValidationError("UPLOAD_PATH_INVALID", "Chemin d’upload invalide.");

  return { action: "authorize", sessionId, category, filename, pathname, contentType, size };
}

function parseReport(value: unknown): UploadReport {
  const source = record(value);
  const requestId = text(source.requestId, 36);
  const sessionId = text(source.sessionId, 80);
  const result = source.result;

  if (source.action !== "report") throw new UploadValidationError("UPLOAD_ACTION_INVALID", "Action de rapport invalide.", 400);
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) throw new UploadValidationError("UPLOAD_REQUEST_INVALID", "Référence d’upload invalide.");
  if (!isValidUploadSessionId(sessionId)) throw new UploadValidationError("UPLOAD_SESSION_INVALID", "Session d’upload invalide.");
  if (result !== "success" && result !== "failed") throw new UploadValidationError("UPLOAD_RESULT_INVALID", "Résultat d’upload invalide.");

  const report: UploadReport = {
    action: "report",
    requestId,
    sessionId,
    result,
    providerStatus: Number.isInteger(source.providerStatus) ? Number(source.providerStatus) : undefined,
    providerCode: safeProviderCode(source.providerCode),
    message: safeProviderMessage(source.message),
    pathname: text(source.pathname, 500) || undefined,
    url: text(source.url, 800) || undefined,
    downloadUrl: text(source.downloadUrl, 800) || undefined,
    size: Number.isInteger(source.size) ? Number(source.size) : undefined,
    contentType: text(source.contentType, 100).toLowerCase() || undefined,
  };

  if (result === "success") {
    if (!report.pathname?.startsWith(`leads/${sessionId}/`)) throw new UploadValidationError("UPLOAD_PATH_INVALID", "La clé retournée par Vercel Blob est invalide.");
    if (!report.url || !isValidBlobUrl(report.url, sessionId)) throw new UploadValidationError("UPLOAD_PROVIDER_RESPONSE_INVALID", "La réponse Vercel Blob ne contient pas une URL valide pour cette session.");
    if (!report.size || report.size <= 0 || report.size > getDocumentMaxSizeBytes()) throw new UploadValidationError("UPLOAD_SIZE_INVALID", "La taille retournée par Vercel Blob est invalide.");
    if (report.contentType !== "application/pdf") throw new UploadValidationError("UPLOAD_CONTENT_TYPE_INVALID", "Le type retourné par Vercel Blob est invalide.");
  }

  return report;
}

function reserveUpload(sessionId: string, requestId: string) {
  const now = Date.now();
  let session = uploadSessions.get(sessionId);
  if (!session || session.resetAt <= now) {
    session = { count: 0, resetAt: now + 60 * 60 * 1000, pending: new Set<string>() };
    uploadSessions.set(sessionId, session);
  }
  if (session.count >= DEFAULT_DOCUMENT_MAX_FILES) {
    throw new UploadValidationError("UPLOAD_MAX_FILES_REACHED", "Maximum de 5 fichiers atteint.");
  }
  session.count += 1;
  session.pending.add(requestId);
}

function settleUpload(sessionId: string, requestId: string, succeeded: boolean) {
  const session = uploadSessions.get(sessionId);
  if (!session?.pending.has(requestId)) return;
  session.pending.delete(requestId);
  if (!succeeded) session.count = Math.max(0, session.count - 1);
}

function providerError(error: unknown) {
  const message = safeProviderMessage(error instanceof Error ? error.message : "Échec inconnu de Vercel Blob.");
  if (error instanceof BlobAccessError) return { code: "forbidden", status: 502, message };
  if (error instanceof BlobContentTypeNotAllowedError) return { code: "content_type_not_allowed", status: 415, message };
  if (error instanceof BlobFileTooLargeError) return { code: "file_too_large", status: 413, message };
  if (error instanceof BlobStoreNotFoundError) return { code: "store_not_found", status: 424, message };
  if (error instanceof BlobStoreSuspendedError) return { code: "store_suspended", status: 424, message };
  if (error instanceof BlobServiceNotAvailable) return { code: "service_unavailable", status: 503, message };
  if (error instanceof BlobServiceRateLimited) return { code: "rate_limited", status: 429, message };
  if (message.includes("OIDC") && message.includes("environment")) return { code: "oidc_environment_not_allowed", status: 424, message };
  if (message.includes("No blob credentials") || message.includes("No read-write token")) return { code: "credentials_missing", status: 503, message };
  return { code: error instanceof Error ? error.constructor.name : "unknown_error", status: 502, message };
}

export async function GET() {
  const storage = getDocumentStorageConfiguration();
  return NextResponse.json({
    configured: storage.configured,
    authMode: storage.mode,
    credentialSignals: storage.signals,
    missing: storage.missing,
    required: ["BLOB_READ_WRITE_TOKEN", "BLOB_STORE_ID + identité OIDC Vercel"],
    maxFiles: DEFAULT_DOCUMENT_MAX_FILES,
    maxSizeBytes: getDocumentMaxSizeBytes(),
    acceptedTypes: ["application/pdf"],
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const limit = rateLimit(`upload:${clientKey(request)}`, 20, 10 * 60 * 1000);
  if (!limit.allowed) {
    console.warn("upload_validation_failed", { requestId, code: "UPLOAD_RATE_LIMITED" });
    return NextResponse.json(
      { ok: false, code: "UPLOAD_RATE_LIMITED", error: "Trop de tentatives d’upload." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    console.warn("upload_validation_failed", { requestId, code: "UPLOAD_JSON_INVALID" });
    return NextResponse.json({ ok: false, code: "UPLOAD_JSON_INVALID", error: "Requête d’upload invalide." }, { status: 400 });
  }

  if (record(body).action === "report") {
    try {
      const report = parseReport(body);
      if (report.result === "success") {
        const storage = getDocumentStorageConfiguration();
        if (!storage.configured) throw new UploadValidationError("BLOB_STORAGE_NOT_CONFIGURED", "Le stockage Vercel Blob n’est pas configuré.", 503);
        console.info("blob_read_started", {
          operation: "post_put_verification",
          requestId: report.requestId,
          pathname: report.pathname,
          expectedSize: report.size,
          providerUrl: report.url,
        });
        try {
          // La réponse brute du PUT présigné peut exposer le pathname demandé
          // alors que l'URL contient la clé physique suffixée. L'URL fournisseur
          // est donc la source de vérité pour retrouver l'objet réellement écrit.
          const storedBlob = await head(report.url!, {
            ...storage.auth,
            abortSignal: AbortSignal.timeout(10_000),
          });
          if (!storedBlob.pathname.startsWith(`leads/${report.sessionId}/`) || storedBlob.url !== report.url || storedBlob.size !== report.size || storedBlob.contentType !== "application/pdf") {
            throw new UploadValidationError("BLOB_METADATA_MISMATCH", "Les métadonnées du blob stocké ne correspondent pas au retour du PUT.", 502);
          }
          settleUpload(report.sessionId, report.requestId, true);
          console.info("blob_upload_success", {
            requestId: report.requestId,
            providerStatus: report.providerStatus,
            providerCode: report.providerCode,
            pathname: storedBlob.pathname,
            size: storedBlob.size,
            url: storedBlob.url,
            downloadUrl: storedBlob.downloadUrl,
          });
          return NextResponse.json({
            ok: true,
            blob: {
              pathname: storedBlob.pathname,
              url: storedBlob.url,
              downloadUrl: storedBlob.downloadUrl,
              size: storedBlob.size,
              contentType: storedBlob.contentType,
            },
          });
        } catch (error) {
          settleUpload(report.sessionId, report.requestId, false);
          const provider = error instanceof UploadValidationError
            ? { code: error.code, status: error.status, message: error.message }
            : providerError(error);
          console.error("blob_upload_failed", {
            operation: "post_put_verification",
            requestId: report.requestId,
            pathname: report.pathname,
            providerCode: provider.code,
            message: provider.message,
          });
          return NextResponse.json({
            ok: false,
            code: "BLOB_VERIFICATION_FAILED",
            providerCode: provider.code,
            error: provider.message || "Le fichier n’a pas été retrouvé après le PUT.",
          }, { status: provider.status });
        }
      }
      settleUpload(report.sessionId, report.requestId, false);
      console.error("blob_upload_failed", {
        requestId: report.requestId,
        providerStatus: report.providerStatus,
        providerCode: report.providerCode,
        message: report.message,
      });
      return NextResponse.json({
        ok: false,
        code: "BLOB_UPLOAD_FAILED",
        providerCode: report.providerCode,
        error: report.message || "Vercel Blob a refusé le fichier.",
      }, { status: 502 });
    } catch (error) {
      const validation = error instanceof UploadValidationError
        ? error
        : new UploadValidationError("UPLOAD_REPORT_INVALID", "Rapport d’upload invalide.", 400);
      console.warn("upload_validation_failed", { requestId, code: validation.code, message: validation.message });
      return NextResponse.json({ ok: false, code: validation.code, error: validation.message }, { status: validation.status });
    }
  }

  console.info("upload_started", { requestId });

  let upload: UploadAuthorization;
  try {
    upload = parseAuthorization(body);
    reserveUpload(upload.sessionId, requestId);
  } catch (error) {
    const validation = error instanceof UploadValidationError
      ? error
      : new UploadValidationError("UPLOAD_VALIDATION_FAILED", "Le fichier ne respecte pas les règles d’upload.");
    console.warn("upload_validation_failed", { requestId, code: validation.code, message: validation.message });
    return NextResponse.json({ ok: false, code: validation.code, error: validation.message }, { status: validation.status });
  }

  const storage = getDocumentStorageConfiguration();
  if (!storage.configured) {
    settleUpload(upload.sessionId, requestId, false);
    console.error("blob_upload_failed", {
      requestId,
      providerCode: "credentials_missing",
      missing: storage.missing,
      credentialSignals: storage.signals,
    });
    return NextResponse.json({
      ok: false,
      code: "BLOB_STORAGE_NOT_CONFIGURED",
      providerCode: "credentials_missing",
      error: "Le stockage Vercel Blob n’est pas configuré.",
      required: ["BLOB_READ_WRITE_TOKEN", "BLOB_STORE_ID + identité OIDC Vercel"],
      missing: storage.missing,
    }, { status: 503 });
  }

  console.info("blob_upload_started", {
    requestId,
    authMode: storage.mode,
    sessionId: upload.sessionId,
    category: upload.category,
    size: upload.size,
    contentType: upload.contentType,
    credentialSignals: storage.signals,
  });

  try {
    const validUntil = Date.now() + 10 * 60 * 1000;
    const signedToken = await issueSignedToken({
      ...storage.auth,
      pathname: upload.pathname,
      operations: ["put"],
      validUntil,
      allowedContentTypes: ["application/pdf"],
      maximumSizeInBytes: getDocumentMaxSizeBytes(),
      abortSignal: AbortSignal.timeout(10_000),
    });
    const { presignedUrl } = await presignUrl(signedToken, {
      access: "private",
      operation: "put",
      pathname: upload.pathname,
      validUntil,
      allowedContentTypes: ["application/pdf"],
      maximumSizeInBytes: getDocumentMaxSizeBytes(),
      // Le chemin contient déjà un UUID de session : aucun suffixe aléatoire
      // supplémentaire n'est nécessaire et la clé retournée reste déterministe.
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 60,
    });

    return NextResponse.json({
      ok: true,
      requestId,
      uploadUrl: presignedUrl,
      authMode: storage.mode,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    settleUpload(upload.sessionId, requestId, false);
    const provider = providerError(error);
    console.error("blob_upload_failed", {
      requestId,
      authMode: storage.mode,
      providerCode: provider.code,
      message: provider.message,
    });
    return NextResponse.json({
      ok: false,
      code: "BLOB_AUTHORIZATION_FAILED",
      providerCode: provider.code,
      error: provider.message || "Vercel Blob n’a pas pu autoriser l’upload.",
    }, { status: provider.status });
  }
}
