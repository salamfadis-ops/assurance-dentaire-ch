"use client";

import { ChangeEvent, useRef, useState } from "react";
import { CheckIcon } from "@/components/ui/icons";

type FileDropzoneProps = {
  id: string;
  label: string;
  description: string;
  file: File | null;
  onChange: (file: File | null) => void;
};

export function FileDropzone({ id, label, description, file, onChange }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError("");
    if (!selected) return;
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Choisissez un fichier PDF.");
      event.target.value = "";
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("Le fichier doit peser moins de 10 Mo.");
      event.target.value = "";
      return;
    }
    onChange(selected);
  }

  if (file) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#176654] shadow-sm"><CheckIcon className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#102d28]">{file.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} Mo · PDF ajouté à cette session</p>
          </div>
          <button type="button" onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ""; }} className="text-xs font-bold text-slate-500 underline underline-offset-2">Retirer</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="group block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white p-5 transition hover:border-[#176654] hover:bg-emerald-50/40">
        <span className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf6f2] text-[#176654] transition group-hover:bg-[#176654] group-hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <span>
            <span className="block text-sm font-bold text-[#102d28]">{label}</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
            <span className="mt-2 block text-xs font-bold text-[#176654]">Choisir un PDF · 10 Mo max.</span>
          </span>
        </span>
      </label>
      <input ref={inputRef} id={id} type="file" accept="application/pdf,.pdf" onChange={selectFile} className="sr-only" />
      {error && <p className="mt-2 text-xs font-semibold text-red-700" role="alert">{error}</p>}
    </div>
  );
}
