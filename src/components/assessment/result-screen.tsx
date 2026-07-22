"use client";

import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRightIcon, CheckIcon, DocumentIcon, ShieldIcon, SparklesIcon, ToothIcon } from "@/components/ui/icons";
import type { AssessmentData, AssessmentFiles, AssessmentResult } from "@/lib/dental-assessment";
import { formatCurrency, needCatalog, profileLabels } from "@/lib/dental-assessment";
import { formatInternationalPhone, isValidSwissFrenchPhone, type SupportedDialCode } from "@/lib/phone";

type ResultScreenProps = {
  data: AssessmentData;
  files: AssessmentFiles;
  result: AssessmentResult;
  onRestart: () => void;
};

type LeadStatus = "idle" | "loading" | "success" | "error";

const categoryLabels = { coverage: "Couverture", prevention: "Prévention", anticipation: "Anticipation", budget: "Budget", documentation: "Documentation" };
const categoryMaximums = { coverage: 24, prevention: 20, anticipation: 20, budget: 20, documentation: 16 };
const socialProof = ["Conseiller indépendant", "FINMA", "Réponse sous 24h", "Sans engagement"];
const ease = [0.22, 1, 0.36, 1] as const;

export function ResultScreen({ data, files, result, onRestart }: ResultScreenProps) {
  const reduceMotion = useReducedMotion();
  const [downloading, setDownloading] = useState(false);
  const [dialCode, setDialCode] = useState<SupportedDialCode>("+41");
  const [contact, setContact] = useState({ firstName: "", email: "", phone: "", consent: false });
  const [leadStatus, setLeadStatus] = useState<LeadStatus>("idle");
  const [leadError, setLeadError] = useState("");
  const circumference = 2 * Math.PI * 78;
  const scoreColor = result.level === "solid" ? "#b9f1dd" : result.level === "partial" ? "#f5b47d" : "#fa8f72";

  const completedData: AssessmentData = {
    ...data,
    firstName: contact.firstName,
    email: contact.email,
    phone: formatInternationalPhone(dialCode, contact.phone),
    consent: contact.consent,
  };

  function updateContact<K extends keyof typeof contact>(field: K, value: (typeof contact)[K]) {
    setContact((current) => ({ ...current, [field]: value }));
    setLeadError("");
    if (leadStatus !== "idle") setLeadStatus("idle");
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phone = formatInternationalPhone(dialCode, contact.phone);

    if (!contact.firstName.trim() || !/^\S+@\S+\.\S+$/.test(contact.email) || !isValidSwissFrenchPhone(phone) || !contact.consent) {
      setLeadError("Renseignez votre prénom, un e-mail valide, un numéro suisse ou français valide et votre consentement.");
      return;
    }

    setLeadStatus("loading");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: data.profile ? profileLabels[data.profile] : "",
          need: data.needs.map((need) => needCatalog[need].label).join(", "),
          canton: data.canton,
          firstName: contact.firstName.trim(),
          email: contact.email.trim(),
          phone,
          consent: contact.consent,
          website: "",
          assessment: { score: result.score, planningNeed: result.planningNeed, coverage: data.coverage },
          attribution: { landingPage: window.location.href, source: new URLSearchParams(window.location.search).get("utm_source") ?? "" },
        }),
      });
      if (!response.ok) throw new Error("lead_failed");
      setLeadStatus("success");
      window.gtag?.("event", "generate_lead", { lead_type: data.profile, dental_protection_score: result.score });
      const conversionTarget = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_TARGET;
      if (conversionTarget) window.gtag?.("event", "conversion", { send_to: conversionTarget });
    } catch {
      setLeadStatus("error");
      setLeadError("La demande n’a pas pu être transmise. Réessayez ou contactez directement VYDA SA.");
    }
  }

  async function downloadReport() {
    setDownloading(true);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: completedData, result, files: { contract: Boolean(files.contract), quote: Boolean(files.quote) } }),
      });
      if (!response.ok) throw new Error("report_failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `bilan-protection-dentaire-${contact.firstName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "vyda"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      window.gtag?.("event", "file_download", { file_name: "bilan-protection-dentaire.pdf" });
    } catch {
      window.alert("Le rapport n’a pas pu être généré. Réessayez dans un instant.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.main initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#071c19] text-white">
        <div className="premium-noise pointer-events-none fixed inset-0 opacity-25" />
        <header className="relative border-b border-white/[0.08] bg-[#071c19]/85 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-[#b9f1dd]"><ToothIcon className="h-5 w-5" /></span><span className="text-sm font-extrabold tracking-tight">assurance-dentaire<span className="text-[#f5a278]">.ch</span></span></Link>
            <span className="flex items-center gap-2 rounded-full border border-[#b9f1dd]/15 bg-[#b9f1dd]/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#b9f1dd]"><CheckIcon className="h-3.5 w-3.5" /> Bilan terminé</span>
          </div>
        </header>

        <section className="relative overflow-hidden pb-16 pt-10 sm:pb-24 sm:pt-16">
          <div className="absolute left-1/4 top-0 h-[30rem] w-[30rem] rounded-full bg-[#176654]/20 blur-[130px]" />
          <div className="absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#e8784c]/15 blur-[120px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
            <div className="relative mx-auto h-64 w-64 sm:h-80 sm:w-80">
              <div className="absolute inset-[15%] rounded-full bg-white/[0.035] blur-xl" />
              <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="90" cy="90" r="78" fill="none" stroke="rgba(255,255,255,.075)" strokeWidth="6" />
                <m.circle cx="90" cy="90" r="78" fill="none" stroke={scoreColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference * (1 - result.score / 100) }} transition={{ duration: reduceMotion ? 0 : 1.6, delay: 0.25, ease }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><m.span initial={reduceMotion ? false : { scale: 0.68, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.55, duration: 0.7, ease }} className="font-display text-7xl font-semibold tracking-[-0.075em] sm:text-8xl">{result.score}</m.span><span className="mt-1 text-[0.67rem] font-bold uppercase tracking-[0.23em] text-[#8da9a1]">sur 100</span></div>
              <m.span initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1, ease }} className="absolute right-0 top-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5a278] text-[#32180f] shadow-xl"><SparklesIcon className="h-5 w-5" /></m.span>
            </div>

            <div>
              <p className="text-[0.67rem] font-bold uppercase tracking-[0.23em] text-[#b9f1dd]">Votre Score Protection Dentaire</p>
              <m.h1 initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7, ease }} className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-7xl">{result.label}</m.h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#a9beb8]">{result.summary}</p>
              <div className="mt-8 flex flex-wrap gap-3"><span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-[#d5e3df]">Planification <strong className="ml-1 text-white">{formatCurrency(result.planningNeed)}</strong></span><span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-[#d5e3df]">{result.recommendations.length} actions prioritaires</span></div>
            </div>
          </div>
        </section>

        <section className="relative rounded-t-[2.5rem] bg-[#f3f6f2] pb-20 pt-8 text-[#102d28] sm:rounded-t-[3.5rem] sm:pb-28 sm:pt-12">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <m.section id="recevoir-analyse" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.65, ease }} className="mx-auto mb-8 max-w-5xl overflow-hidden rounded-[2rem] border border-[#dce6e1] bg-white shadow-[0_24px_70px_rgba(8,35,30,.1)] sm:mb-10">
              <div className="border-b border-[#e4ebe7] bg-[#f8faf8] px-5 py-4 sm:px-8">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{socialProof.map((item) => <span key={item} className="flex items-center gap-2 text-xs font-bold text-[#405850]"><CheckIcon className="h-4 w-4 shrink-0 text-[#176654]" />{item}</span>)}</div>
              </div>
              <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.78fr_1.22fr] lg:p-10">
                <div>
                  <p className="text-[0.67rem] font-bold uppercase tracking-[0.2em] text-[#176654]">Votre analyse personnelle</p>
                  <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">Recevez votre analyse personnalisée et soyez rappelé par un conseiller.</h2>
                  <p className="mt-4 text-sm leading-6 text-[#61736e]">Un conseiller VYDA reprend votre score avec vous et répond à vos questions.</p>
                </div>

                {leadStatus === "success" ? (
                  <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl bg-[#e8f5ef] p-7 text-center" role="status"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#176654] text-white"><CheckIcon className="h-7 w-7" /></span><h3 className="mt-5 text-2xl font-bold">Votre demande est bien enregistrée.</h3><p className="mt-2 max-w-md text-sm leading-6 text-[#526a64]">Votre conseiller VYDA vous recontactera personnellement sous 24 heures ouvrées.</p></div>
                ) : (
                  <form onSubmit={submitLead} className="grid gap-4" noValidate>
                    <div className="grid gap-4 sm:grid-cols-2"><label className="assessment-label">Prénom<input required autoComplete="given-name" value={contact.firstName} onChange={(event) => updateContact("firstName", event.target.value)} className="form-control" /></label><label className="assessment-label">E-mail<input required type="email" inputMode="email" autoComplete="email" value={contact.email} onChange={(event) => updateContact("email", event.target.value)} className="form-control" /></label></div>
                    <label className="assessment-label">Téléphone mobile
                      <span className="flex overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-[#176654] focus-within:ring-3 focus-within:ring-[#176654]/10">
                        <select aria-label="Indicatif téléphonique" value={dialCode} onChange={(event) => { setDialCode(event.target.value as SupportedDialCode); setLeadError(""); }} className="min-h-12 border-r border-slate-200 bg-[#f5f7f5] px-3 text-sm font-bold text-[#29423d] outline-none"><option value="+41">CH +41</option><option value="+33">FR +33</option></select>
                        <input required type="tel" inputMode="tel" autoComplete="tel-national" aria-describedby="phone-reassurance" value={contact.phone} onChange={(event) => updateContact("phone", event.target.value)} placeholder={dialCode === "+41" ? "79 123 45 67" : "6 12 34 56 78"} className="min-h-12 min-w-0 flex-1 px-4 text-base font-normal text-slate-700 outline-none" />
                      </span>
                      <span id="phone-reassurance" className="flex items-start gap-2 text-xs font-medium leading-5 text-[#61736e]"><ShieldIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#176654]" />Votre conseiller VYDA vous rappelle personnellement. Aucune vente automatique.</span>
                    </label>
                    <label className="flex items-start gap-3 rounded-2xl bg-[#f6f8f6] p-4 text-xs leading-5 text-[#61736e]"><input required type="checkbox" checked={contact.consent} onChange={(event) => updateContact("consent", event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#176654]" /><span>J’accepte d’être recontacté par VYDA SA au sujet de mon bilan. <Link href="/confidentialite" target="_blank" className="font-bold text-[#176654] underline underline-offset-2">Confidentialité</Link></span></label>
                    {leadError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{leadError} {leadStatus === "error" && <a href="mailto:contact@assurance-dentaire.ch" className="underline">Contacter VYDA</a>}</p>}
                    <button type="submit" disabled={leadStatus === "loading"} className="premium-button min-h-14 w-full whitespace-nowrap px-4 text-[0.78rem] disabled:cursor-wait disabled:opacity-60 sm:px-6 sm:text-sm">{leadStatus === "loading" ? "Envoi sécurisé…" : "Recevoir mon analyse gratuite"}<ArrowRightIcon className="h-4 w-4 shrink-0" /></button>
                  </form>
                )}
              </div>
            </m.section>

            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
              <section className="rounded-[2rem] border border-[#dee7e2] bg-white p-6 shadow-[0_18px_55px_rgba(8,35,30,.06)] sm:p-9">
                <p className="text-[0.67rem] font-bold uppercase tracking-[0.2em] text-[#176654]">Votre plan d’action</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">Ce que vous devriez faire maintenant.</h2>
                <ol className="mt-7 space-y-3">{result.recommendations.slice(0, 5).map((recommendation, index) => <m.li key={recommendation} initial={reduceMotion ? false : { opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.07, ease }} className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-[#e5ece8] bg-[#f8faf8] p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-sm sm:p-5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dff1e9] text-xs font-bold text-[#176654]">0{index + 1}</span><p className="text-sm leading-6 text-[#5b6f69]">{recommendation}</p></m.li>)}</ol>
              </section>

              <div className="space-y-6">
                <section className="rounded-[2rem] border border-[#dee7e2] bg-white p-6 shadow-[0_18px_55px_rgba(8,35,30,.05)] sm:p-8">
                  <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold tracking-[-0.035em]">Détail du score</h2><span className="text-xs font-bold text-[#71847e]">5 dimensions</span></div>
                  <div className="mt-7 space-y-5">{(Object.keys(result.breakdown) as Array<keyof typeof result.breakdown>).map((key) => <div key={key}><div className="flex justify-between text-sm"><span className="font-semibold text-[#61736e]">{categoryLabels[key]}</span><span className="font-bold text-[#102d28]">{result.breakdown[key]}/{categoryMaximums[key]}</span></div><div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#e8eeeb]"><m.div initial={{ width: 0 }} animate={{ width: `${(result.breakdown[key] / categoryMaximums[key]) * 100}%` }} transition={{ duration: reduceMotion ? 0 : 0.9, delay: 0.2, ease }} className="h-full rounded-full bg-[#176654]" /></div></div>)}</div>
                </section>
                <section className="relative overflow-hidden rounded-[2rem] bg-[#176654] p-6 text-white shadow-[0_24px_65px_rgba(23,102,84,.2)] sm:p-8"><div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-[28px] border-white/[0.05]" /><div className="relative"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#b9f1dd]"><DocumentIcon className="h-5 w-5" /></span><h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.035em]">Votre rapport personnel</h2><p className="mt-3 text-sm leading-6 text-[#d1e5df]">Conservez votre score, vos priorités et le détail de votre préparation.</p><button type="button" onClick={downloadReport} disabled={downloading} className="group mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-[#176654] shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60">{downloading ? "Création du PDF…" : "Télécharger mon rapport"}{!downloading && <ArrowRightIcon className="h-4 w-4 rotate-90 transition group-hover:translate-y-0.5" />}</button></div></section>
              </div>
            </div>

            <div className="mt-7 flex gap-3 rounded-2xl border border-[#dfe7e3] bg-white p-5 text-sm leading-6 text-[#61736e]"><ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#176654]" /><p><strong className="text-[#102d28]">Méthode transparente :</strong> ce score mesure votre niveau de préparation selon vos réponses. Il ne constitue ni une offre d’assurance, ni un diagnostic, ni une garantie de remboursement.</p></div>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><button type="button" onClick={onRestart} className="rounded-full border border-[#cedbd5] px-6 py-3 text-sm font-bold text-[#61736e] transition hover:bg-white">Recommencer le bilan</button><Link href="/" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-[#176654]">Retour à l’accueil <ArrowRightIcon className="h-4 w-4" /></Link></div>
          </div>
        </section>
      </m.main>
    </LazyMotion>
  );
}
