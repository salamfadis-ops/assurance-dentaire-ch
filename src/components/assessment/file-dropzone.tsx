"use client";

import { ChangeEvent, useRef, useState } from "react";
import { CheckIcon, LockIcon } from "@/components/ui/icons";
import { DEFAULT_DOCUMENT_MAX_SIZE_MB, documentPathname, validatePdfSelection, type DocumentCategory, type StoredDocument } from "@/lib/documents";

type FileDropzoneProps = {
  id: string;
  label: string;
  description: string;
  category: DocumentCategory;
  documents: StoredDocument[];
  uploadSessionId: string;
  remainingSlots: number;
  onChange: (documents: StoredDocument[]) => void;
};

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

async function responseJson(response: Response) {
  try {
    return record(await response.json());
  } catch {
    return {};
  }
}

function providerFailure(payload: JsonRecord, status: number) {
  const nested = record(payload.error);
  const code = String(payload.providerCode || payload.code || nested.code || `HTTP_${status}`).slice(0, 80);
  const message = typeof payload.error === "string"
    ? payload.error
    : typeof nested.message === "string"
      ? nested.message
      : "Vercel Blob a refusé le fichier.";
  return { code, message: message.slice(0, 300) };
}

async function reportUpload(input: {
  requestId: string;
  sessionId: string;
  result: "success" | "failed";
  providerStatus: number;
  providerCode: string;
  message?: string;
}) {
  const response = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "report", ...input }),
  });
  return { response, payload: await responseJson(response) };
}

async function uploadPdf(file: File, uploadSessionId: string, category: DocumentCategory) {
  const pathname = documentPathname(uploadSessionId, category, file.name);
  const authorizationResponse = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "authorize",
      sessionId: uploadSessionId,
      category,
      filename: file.name,
      pathname,
      contentType: file.type,
      size: file.size,
    }),
  });
  const authorization = await responseJson(authorizationResponse);
  if (!authorizationResponse.ok || typeof authorization.uploadUrl !== "string" || typeof authorization.requestId !== "string") {
    const failure = providerFailure(authorization, authorizationResponse.status);
    throw new Error(`${failure.message} (code : ${failure.code})`);
  }

  const providerResponse = await fetch(authorization.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    body: file,
  });
  const providerPayload = await responseJson(providerResponse);

  if (!providerResponse.ok) {
    const failure = providerFailure(providerPayload, providerResponse.status);
    try {
      const reported = await reportUpload({
        requestId: authorization.requestId,
        sessionId: uploadSessionId,
        result: "failed",
        providerStatus: providerResponse.status,
        providerCode: failure.code,
        message: failure.message,
      });
      const reportedFailure = providerFailure(reported.payload, reported.response.status);
      throw new Error(`${reportedFailure.message} (code fournisseur : ${reportedFailure.code})`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("code fournisseur")) throw error;
      throw new Error(`${failure.message} (code fournisseur : ${failure.code})`);
    }
  }

  const uploadedPathname = typeof providerPayload.pathname === "string" ? providerPayload.pathname : "";
  const uploadedUrl = typeof providerPayload.url === "string" ? providerPayload.url : "";
  if (!uploadedPathname.startsWith(`leads/${uploadSessionId}/${category}/`) || !uploadedUrl) {
    await reportUpload({
      requestId: authorization.requestId,
      sessionId: uploadSessionId,
      result: "failed",
      providerStatus: providerResponse.status,
      providerCode: "invalid_provider_response",
      message: "Réponse Vercel Blob incomplète.",
    }).catch(() => undefined);
    throw new Error("Réponse Vercel Blob incomplète (code fournisseur : invalid_provider_response)");
  }

  await reportUpload({
    requestId: authorization.requestId,
    sessionId: uploadSessionId,
    result: "success",
    providerStatus: providerResponse.status,
    providerCode: "ok",
  }).catch(() => undefined);

  return { pathname: uploadedPathname, url: uploadedUrl };
}

export function FileDropzone({ id, label, description, category, documents, uploadSessionId, remainingSlots, onChange }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setError("");
    if (!selected.length) return;
    const validationError = validatePdfSelection(selected, remainingSlots);
    if (validationError) {
      console.warn("upload_validation_failed", { code: "CLIENT_SELECTION_INVALID", message: validationError });
      setError(validationError);
      event.target.value = "";
      return;
    }
    setUploading(true);
    const uploaded: StoredDocument[] = [];
    try {
      for (const file of selected) {
        const blob = await uploadPdf(file, uploadSessionId, category);
        uploaded.push({
          category,
          name: file.name.slice(0, 120),
          pathname: blob.pathname,
          url: blob.url,
          size: file.size,
          contentType: "application/pdf",
          uploadedAt: new Date().toISOString(),
        });
      }
      onChange([...documents, ...uploaded]);
    } catch (uploadError) {
      if (uploaded.length > 0) onChange([...documents, ...uploaded]);
      setError(uploadError instanceof Error
        ? uploadError.message
        : "L’envoi a échoué. Aucun document n’est présenté comme transmis. Réessayez.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <div key={document.pathname} className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#176654] shadow-sm"><CheckIcon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#102d28]">{document.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{(document.size / 1024 / 1024).toFixed(1)} Mo · transmis dans un stockage privé</p>
            </div>
            <button type="button" onClick={() => onChange(documents.filter((item) => item.pathname !== document.pathname))} className="text-xs font-bold text-slate-500 underline underline-offset-2">Retirer du bilan</button>
          </div>
        </div>
      ))}

      <label htmlFor={id} aria-disabled={uploading || remainingSlots <= 0} className={`group block rounded-2xl border border-dashed p-5 transition ${!uploading && remainingSlots > 0 ? "cursor-pointer border-slate-300 bg-white hover:border-[#176654] hover:bg-emerald-50/40" : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70"}`}>
        <span className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf6f2] text-[#176654]">
            <LockIcon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-[#102d28]">{uploading ? "Envoi sécurisé en cours…" : label}</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
            <span className="mt-2 block text-xs font-bold text-[#176654]">PDF uniquement · {DEFAULT_DOCUMENT_MAX_SIZE_MB} Mo max. · {remainingSlots} emplacement{remainingSlots > 1 ? "s" : ""}</span>
          </span>
        </span>
      </label>
      <input ref={inputRef} id={id} type="file" accept="application/pdf" multiple disabled={uploading || remainingSlots <= 0} onChange={selectFiles} className="sr-only" />
      {error && <p className="text-xs font-semibold text-red-700" role="alert">{error}</p>}
    </div>
  );
}
