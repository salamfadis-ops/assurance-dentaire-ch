"use client";

import { upload } from "@vercel/blob/client";
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
  storageConfigured: boolean;
  remainingSlots: number;
  onChange: (documents: StoredDocument[]) => void;
};

export function FileDropzone({ id, label, description, category, documents, uploadSessionId, storageConfigured, remainingSlots, onChange }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setError("");
    if (!selected.length) return;
    const validationError = validatePdfSelection(selected, remainingSlots);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }
    if (!storageConfigured) {
      setError("L’envoi sécurisé des documents sera disponible après configuration du stockage.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const uploaded: StoredDocument[] = [];
      for (const file of selected) {
        const pathname = documentPathname(uploadSessionId, category, file.name);
        const blob = await upload(pathname, file, {
          access: "private",
          handleUploadUrl: "/api/uploads",
          clientPayload: JSON.stringify({ sessionId: uploadSessionId, category, filename: file.name }),
        });
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
    } catch {
      setError("L’envoi a échoué. Aucun document n’est présenté comme transmis. Réessayez.");
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

      <label htmlFor={id} aria-disabled={!storageConfigured || uploading || remainingSlots <= 0} className={`group block rounded-2xl border border-dashed p-5 transition ${storageConfigured && !uploading && remainingSlots > 0 ? "cursor-pointer border-slate-300 bg-white hover:border-[#176654] hover:bg-emerald-50/40" : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70"}`}>
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
      <input ref={inputRef} id={id} type="file" accept="application/pdf" multiple disabled={!storageConfigured || uploading || remainingSlots <= 0} onChange={selectFiles} className="sr-only" />
      {!storageConfigured && <p className="rounded-xl bg-[#fff4ef] p-3 text-xs font-semibold leading-5 text-[#783c22]">L’envoi sécurisé des documents sera disponible après configuration du stockage.</p>}
      {error && <p className="text-xs font-semibold text-red-700" role="alert">{error}</p>}
    </div>
  );
}
