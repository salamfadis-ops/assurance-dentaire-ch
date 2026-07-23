"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { CalendlyLink } from "@/components/calendly-link";
import { ArrowRightIcon, CheckIcon, ShieldIcon } from "@/components/ui/icons";
import { collectAttribution, type ContactPreference, type LeadPayload } from "@/lib/lead";
import { formatInternationalPhone, isValidSwissFrenchPhone, type SupportedDialCode } from "@/lib/phone";

type Status = "idle" | "loading" | "success" | "error";

export function LeadForm() {
  const [dialCode, setDialCode] = useState<SupportedDialCode>("+41");
  const [data, setData] = useState({ firstName: "", lastName: "", phone: "", email: "", preference: "asap" as ContactPreference, consent: false, website: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [submittedPayload, setSubmittedPayload] = useState<LeadPayload | null>(null);
  const submittingRef = useRef(false);

  function update<K extends keyof typeof data>(field: K, value: (typeof data)[K]) {
    setData((current) => ({ ...current, [field]: value }));
    setError("");
    if (status === "error") setStatus("idle");
  }

  function buildPayload(journey: LeadPayload["journey"], calendlyStatus: LeadPayload["calendlyStatus"]): LeadPayload {
    return {
      requestId: crypto.randomUUID(),
      journey,
      contact: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: formatInternationalPhone(dialCode, data.phone),
        email: data.email.trim(),
        canton: "",
        preference: data.preference,
      },
      attribution: collectAttribution(),
      calendlyStatus,
      consent: { accepted: data.consent, timestamp: new Date().toISOString(), purpose: "insurance_contact_and_analysis" },
      website: data.website,
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading" || submittingRef.current) return;
    const phone = formatInternationalPhone(dialCode, data.phone);
    if (!data.firstName.trim() || !data.lastName.trim() || !/^\S+@\S+\.\S+$/.test(data.email) || !isValidSwissFrenchPhone(phone) || !data.consent) {
      setError("Complétez vos coordonnées et acceptez le consentement pour continuer.");
      return;
    }
    submittingRef.current = true;
    setStatus("loading");
    const payload = buildPayload("rappel", process.env.NEXT_PUBLIC_CALENDLY_URL ? "offered" : "not_configured");
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("submission_failed");
      setSubmittedPayload(payload);
      setStatus("success");
      window.gtag?.("event", "generate_lead", { lead_type: "callback" });
      const conversionTarget = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_TARGET;
      if (conversionTarget) window.gtag?.("event", "conversion", { send_to: conversionTarget });
    } catch {
      submittingRef.current = false;
      setStatus("error");
      setError("La demande n’a pas pu être envoyée. Réessayez ou contactez VYDA.");
    }
  }

  function registerCalendlyOpen() {
    if (!submittedPayload) return;
    const payload = { ...submittedPayload, requestId: crypto.randomUUID(), journey: "calendly" as const, calendlyStatus: "opened" as const };
    void fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true });
  }

  if (status === "success") {
    return (
      <div className="form-card flex min-h-[34rem] flex-col items-center justify-center text-center" role="status" aria-live="polite">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#176654] text-white"><CheckIcon className="h-7 w-7" /></span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#19715e]">Demande envoyée</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#102d28]">Merci {data.firstName}.</h2>
        <p className="mt-3 max-w-md leading-7 text-slate-600">Un conseiller VYDA vous recontacte sans engagement.</p>
        <CalendlyLink contact={submittedPayload?.contact} onOpen={registerCalendlyOpen} className="mt-7" />
        <Link href="/bilan" className="primary-button mt-5">Continuer vers le bilan complet <ArrowRightIcon className="h-4 w-4" /></Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="form-card" noValidate>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#19715e]">Rappel personnel</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#102d28]">Être rappelé gratuitement</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">Un conseiller VYDA vous recontacte sans engagement.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Prénom<input required autoComplete="given-name" value={data.firstName} onChange={(event) => update("firstName", event.target.value)} className="form-control" /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Nom<input required autoComplete="family-name" value={data.lastName} onChange={(event) => update("lastName", event.target.value)} className="form-control" /></label>
      </div>
      <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">Téléphone obligatoire<span className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-[#176654] focus-within:ring-3 focus-within:ring-[#176654]/10"><select aria-label="Indicatif téléphonique" value={dialCode} onChange={(event) => setDialCode(event.target.value as SupportedDialCode)} className="border-r border-slate-200 bg-slate-50 px-2 text-xs font-bold outline-none"><option value="+41">CH +41</option><option value="+33">FR +33</option></select><input required type="tel" autoComplete="tel-national" inputMode="tel" value={data.phone} onChange={(event) => update("phone", event.target.value)} placeholder={dialCode === "+41" ? "79 123 45 67" : "6 12 34 56 78"} className="min-h-12 min-w-0 flex-1 px-3 font-normal outline-none" /></span></label>
      <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">E-mail<input required type="email" autoComplete="email" inputMode="email" value={data.email} onChange={(event) => update("email", event.target.value)} className="form-control" /></label>
      <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">Préférence de contact<select value={data.preference} onChange={(event) => update("preference", event.target.value as ContactPreference)} className="form-control"><option value="asap">Dès que possible</option><option value="morning">Matin</option><option value="afternoon">Après-midi</option><option value="evening">Soirée</option></select></label>
      <label className="absolute -left-[9999px]" aria-hidden="true">Votre site<input tabIndex={-1} autoComplete="off" value={data.website} onChange={(event) => update("website", event.target.value)} /></label>
      <label className="mt-5 flex items-start gap-3 rounded-2xl bg-[#f6f8f6] p-4 text-xs leading-5 text-slate-600"><input required type="checkbox" checked={data.consent} onChange={(event) => update("consent", event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#176654]" /><span>J’accepte que VYDA SA utilise ces informations pour traiter ma demande et me recontacter. <Link href="/confidentialite" className="font-semibold text-[#176654] underline underline-offset-2">Confidentialité</Link></span></label>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{error} {status === "error" && <a href="mailto:contact@vyda.ch" className="underline">Écrire à VYDA</a>}</p>}
      <button type="submit" disabled={status === "loading"} className="primary-button mt-5 w-full disabled:cursor-wait disabled:opacity-60">{status === "loading" ? "Envoi sécurisé…" : "Demander mon rappel"}<ArrowRightIcon className="h-4 w-4" /></button>
      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-600"><ShieldIcon className="h-4 w-4" /> Données utilisées uniquement pour votre demande</p>
    </form>
  );
}
