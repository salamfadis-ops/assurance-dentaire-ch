"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, ShieldIcon } from "@/components/ui/icons";
import { formatInternationalPhone, isValidSwissFrenchPhone, type SupportedDialCode } from "@/lib/phone";

type FormData = {
  profile: string;
  need: string;
  canton: string;
  firstName: string;
  email: string;
  phone: string;
  consent: boolean;
  website: string;
};

type Attribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  landingPage?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const initialData: FormData = {
  profile: "",
  need: "",
  canton: "",
  firstName: "",
  email: "",
  phone: "",
  consent: false,
  website: "",
};

const cantons = ["AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"];
const profiles = ["Un enfant", "Un adulte", "Toute la famille"];
const needs = ["Orthodontie", "Soins courants", "Couverture complète", "Je souhaite être conseillé"];

export function LeadForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(initialData);
  const [dialCode, setDialCode] = useState<SupportedDialCode>("+41");
  const attributionRef = useRef<Attribution>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    attributionRef.current = {
      source: params.get("utm_source") ?? undefined,
      medium: params.get("utm_medium") ?? undefined,
      campaign: params.get("utm_campaign") ?? undefined,
      term: params.get("utm_term") ?? undefined,
      landingPage: window.location.href,
    };
  }, []);

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setData((current) => ({ ...current, [field]: value }));
    setError("");
  };

  function continueToContact() {
    if (!data.profile || !data.need || !data.canton) {
      setError("Complétez les trois réponses pour continuer.");
      return;
    }
    setStep(2);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const phone = formatInternationalPhone(dialCode, data.phone);
    if (!data.firstName || !data.email || !isValidSwissFrenchPhone(phone) || !data.consent) {
      setError("Renseignez votre prénom, votre e-mail, un numéro suisse ou français valide et votre consentement.");
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, phone, attribution: attributionRef.current }),
      });

      if (!response.ok) throw new Error("submission_failed");

      setStatus("success");
      window.gtag?.("event", "generate_lead", {
        lead_type: data.profile,
        lead_need: data.need,
        lead_canton: data.canton,
      });
      const conversionTarget = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_TARGET;
      if (conversionTarget) {
        window.gtag?.("event", "conversion", { send_to: conversionTarget });
      }
    } catch {
      setStatus("error");
      setError("La demande n’a pas pu être envoyée. Réessayez ou contactez-nous directement par e-mail.");
    }
  }

  if (status === "success") {
    return (
      <div className="form-card" role="status" aria-live="polite">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e3f1ec] text-[#176654]"><CheckIcon className="h-7 w-7" /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#19715e]">Demande envoyée</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#102d28]">Merci {data.firstName}, nous avons bien reçu votre demande.</h2>
        <p className="mt-3 leading-7 text-slate-600">Un conseiller VYDA examinera votre situation et vous répondra personnellement.</p>
        <div className="mt-6 rounded-2xl bg-[#f3f7f4] p-4 text-sm leading-6 text-[#29423d]">
          <strong>Prochaine étape :</strong> surveillez votre boîte e-mail et vos courriers indésirables.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="form-card" noValidate>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#19715e]">Analyse gratuite</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#102d28]">Recevez vos pistes personnalisées</h2>
        </div>
        <span className="shrink-0 rounded-full bg-[#f3f7f4] px-3 py-1.5 text-xs font-bold text-slate-500">{step}/2</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">60 secondes suffisent. Aucun engagement.</p>
      <div className="mt-5 flex gap-2" aria-hidden="true">
        {[1, 2].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full transition-colors ${item <= step ? "bg-[#176654]" : "bg-slate-100"}`} />)}
      </div>

      {step === 1 && (
        <fieldset className="mt-6 grid gap-5">
          <legend className="sr-only">Votre besoin d’assurance dentaire</legend>
          <div>
            <p className="text-sm font-bold text-slate-700">Qui souhaitez-vous assurer ?</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {profiles.map((option) => (
                <button key={option} type="button" aria-pressed={data.profile === option} onClick={() => update("profile", option)} className={`min-h-14 rounded-xl border px-2 py-2 text-center text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176654] sm:text-sm ${data.profile === option ? "border-[#176654] bg-[#edf6f2] text-[#125444] ring-1 ring-[#176654]" : "border-slate-200 text-slate-600 hover:border-emerald-700/40 hover:bg-slate-50"}`}>
                  {option}
                </button>
              ))}
            </div>
          </div>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Quel est votre besoin principal ?
            <select required value={data.need} onChange={(event) => update("need", event.target.value)} className="form-control">
              <option value="">Choisir une réponse</option>
              {needs.map((need) => <option key={need}>{need}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Dans quel canton résidez-vous ?
            <select required value={data.canton} onChange={(event) => update("canton", event.target.value)} className="form-control">
              <option value="">Choisir un canton</option>
              {cantons.map((canton) => <option key={canton}>{canton}</option>)}
            </select>
          </label>
          {error && <p className="text-sm font-semibold text-red-700" role="alert">{error}</p>}
          <button type="button" onClick={continueToContact} className="primary-button w-full">
            Voir mes options <ArrowRightIcon className="h-4 w-4" />
          </button>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="mt-6 grid gap-4">
          <legend className="sr-only">Vos coordonnées</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700">Prénom<input required autoComplete="given-name" value={data.firstName} onChange={(event) => update("firstName", event.target.value)} className="form-control" /></label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">Téléphone
              <span className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-[#176654] focus-within:ring-3 focus-within:ring-[#176654]/10"><select aria-label="Indicatif téléphonique" value={dialCode} onChange={(event) => setDialCode(event.target.value as SupportedDialCode)} className="border-r border-slate-200 bg-slate-50 px-2 text-xs font-bold outline-none"><option value="+41">CH +41</option><option value="+33">FR +33</option></select><input required type="tel" autoComplete="tel-national" inputMode="tel" value={data.phone} onChange={(event) => update("phone", event.target.value)} placeholder={dialCode === "+41" ? "79 123 45 67" : "6 12 34 56 78"} className="min-h-12 min-w-0 flex-1 px-3 font-normal outline-none" /></span>
              <span className="text-xs font-medium leading-5 text-slate-500">Votre conseiller VYDA vous rappelle personnellement. Aucune vente automatique.</span>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-bold text-slate-700">E-mail<input required type="email" autoComplete="email" inputMode="email" value={data.email} onChange={(event) => update("email", event.target.value)} className="form-control" /></label>
          <label className="absolute -left-[9999px]" aria-hidden="true">Votre site<input tabIndex={-1} autoComplete="off" value={data.website} onChange={(event) => update("website", event.target.value)} /></label>
          <label className="flex items-start gap-3 text-xs leading-5 text-slate-500">
            <input required type="checkbox" checked={data.consent} onChange={(event) => update("consent", event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#176654]" />
            <span>J’accepte d’être recontacté par VYDA SA au sujet de ma demande. <Link href="/confidentialite" className="font-semibold text-[#176654] underline underline-offset-2">Confidentialité</Link></span>
          </label>
          {error && <p className="text-sm font-semibold text-red-700" role="alert">{error} {status === "error" && <a href="mailto:contact@assurance-dentaire.ch" className="underline">Écrire à VYDA</a>}</p>}
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <button type="button" onClick={() => { setStep(1); setError(""); }} className="min-h-12 rounded-full border border-slate-200 px-5 font-bold text-slate-600 transition hover:bg-slate-50">Retour</button>
            <button type="submit" disabled={status === "loading"} className="primary-button disabled:cursor-wait disabled:opacity-60">
              {status === "loading" ? "Envoi…" : "Recevoir mon analyse"}
              {status !== "loading" && <ArrowRightIcon className="h-4 w-4" />}
            </button>
          </div>
        </fieldset>
      )}

      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-400"><ShieldIcon className="h-4 w-4" /> Données confidentielles · Aucun démarchage abusif</p>
    </form>
  );
}
