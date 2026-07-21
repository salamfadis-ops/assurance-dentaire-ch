"use client";

import { FormEvent, useState } from "react";
import { ArrowRightIcon, CheckIcon, ShieldIcon } from "@/components/ui/icons";

type FormData = {
  profile: string;
  canton: string;
  need: string;
  firstName: string;
  email: string;
  phone: string;
};

const initialData: FormData = {
  profile: "",
  canton: "",
  need: "",
  firstName: "",
  email: "",
  phone: "",
};

const cantons = ["AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"];

export function LeadForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(initialData);
  const [sent, setSent] = useState(false);

  const update = (field: keyof FormData, value: string) => setData((current) => ({ ...current, [field]: value }));

  function next() {
    if (step === 1 && data.profile) setStep(2);
    if (step === 2 && data.canton && data.need) setStep(3);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(`Demande d’orientation dentaire — ${data.firstName}`);
    const body = encodeURIComponent([
      "Bonjour,",
      "",
      "Je souhaite recevoir une orientation concernant une assurance dentaire.",
      "",
      `Profil : ${data.profile}`,
      `Canton : ${data.canton}`,
      `Besoin : ${data.need}`,
      `Prénom : ${data.firstName}`,
      `E-mail : ${data.email}`,
      `Téléphone : ${data.phone || "Non renseigné"}`,
      "",
      "Merci de me recontacter.",
    ].join("\n"));
    setSent(true);
    window.location.href = `mailto:contact@assurance-dentaire.ch?subject=${subject}&body=${body}`;
  }

  if (sent) {
    return (
      <div className="rounded-[1.75rem] border border-white/80 bg-white p-7 shadow-[0_28px_80px_rgba(16,45,40,0.16)] sm:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e3f1ec] text-[#176654]"><CheckIcon className="h-7 w-7" /></div>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-[#102d28]">Votre demande est prête</h2>
        <p className="mt-3 leading-7 text-slate-600">Votre messagerie s’est ouverte avec un message prérempli. Envoyez-le pour transmettre votre demande à VYDA SA.</p>
        <button type="button" onClick={() => setSent(false)} className="mt-6 text-sm font-bold text-[#176654] underline underline-offset-4">Revenir au formulaire</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[1.75rem] border border-white/80 bg-white p-6 shadow-[0_28px_80px_rgba(16,45,40,0.16)] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#19715e]">Orientation gratuite</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#102d28]">Quel est votre besoin ?</h2>
        </div>
        <span className="rounded-full bg-[#f3f7f4] px-3 py-1.5 text-xs font-bold text-slate-500">Étape {step}/3</span>
      </div>
      <div className="mt-5 flex gap-2" aria-hidden="true">
        {[1, 2, 3].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-[#176654]" : "bg-slate-100"}`} />)}
      </div>

      {step === 1 && (
        <fieldset className="mt-7">
          <legend className="text-sm font-bold text-slate-700">Pour qui cherchez-vous une couverture ?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {["Pour un enfant", "Pour un adulte", "Pour ma famille", "Je ne sais pas encore"].map((option) => (
              <button key={option} type="button" onClick={() => update("profile", option)} className={`rounded-2xl border p-4 text-left text-sm font-semibold transition ${data.profile === option ? "border-[#176654] bg-[#edf6f2] text-[#125444] ring-1 ring-[#176654]" : "border-slate-200 text-slate-700 hover:border-emerald-700/40 hover:bg-slate-50"}`}>
                {option}
              </button>
            ))}
          </div>
          <button type="button" disabled={!data.profile} onClick={next} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#176654] px-5 font-bold text-white transition hover:bg-[#0f5747] disabled:cursor-not-allowed disabled:opacity-40">
            Continuer <ArrowRightIcon className="h-4 w-4" />
          </button>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="mt-7 grid gap-5">
          <legend className="sr-only">Votre situation</legend>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Votre canton
            <select required value={data.canton} onChange={(event) => update("canton", event.target.value)} className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 font-normal text-slate-700 outline-none transition focus:border-[#176654] focus:ring-2 focus:ring-emerald-100">
              <option value="">Sélectionner</option>
              {cantons.map((canton) => <option key={canton}>{canton}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Votre priorité
            <select required value={data.need} onChange={(event) => update("need", event.target.value)} className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 font-normal text-slate-700 outline-none transition focus:border-[#176654] focus:ring-2 focus:ring-emerald-100">
              <option value="">Sélectionner</option>
              <option>Orthodontie</option>
              <option>Contrôles et soins courants</option>
              <option>Couverture la plus complète</option>
              <option>Comprendre mes options</option>
            </select>
          </label>
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <button type="button" onClick={() => setStep(1)} className="min-h-12 rounded-full border border-slate-200 px-5 font-bold text-slate-600">Retour</button>
            <button type="button" disabled={!data.canton || !data.need} onClick={next} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#176654] px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Continuer <ArrowRightIcon className="h-4 w-4" /></button>
          </div>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="mt-7 grid gap-4">
          <legend className="sr-only">Vos coordonnées</legend>
          <label className="grid gap-2 text-sm font-bold text-slate-700">Prénom<input required autoComplete="given-name" value={data.firstName} onChange={(event) => update("firstName", event.target.value)} className="min-h-12 rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-[#176654] focus:ring-2 focus:ring-emerald-100" /></label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">E-mail<input required type="email" autoComplete="email" value={data.email} onChange={(event) => update("email", event.target.value)} className="min-h-12 rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-[#176654] focus:ring-2 focus:ring-emerald-100" /></label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">Téléphone <span className="font-normal text-slate-400">(facultatif)</span><input type="tel" autoComplete="tel" value={data.phone} onChange={(event) => update("phone", event.target.value)} className="min-h-12 rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-[#176654] focus:ring-2 focus:ring-emerald-100" /></label>
          <label className="flex items-start gap-3 text-xs leading-5 text-slate-500"><input required type="checkbox" className="mt-1 h-4 w-4 rounded accent-[#176654]" />J’accepte que VYDA SA utilise ces informations pour répondre à ma demande, conformément à la politique de confidentialité.</label>
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <button type="button" onClick={() => setStep(2)} className="min-h-12 rounded-full border border-slate-200 px-5 font-bold text-slate-600">Retour</button>
            <button type="submit" className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#176654] px-5 font-bold text-white">Préparer ma demande <ArrowRightIcon className="h-4 w-4" /></button>
          </div>
        </fieldset>
      )}

      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-400"><ShieldIcon className="h-4 w-4" /> Vos informations restent confidentielles.</p>
    </form>
  );
}
