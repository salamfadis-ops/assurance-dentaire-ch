"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { FileDropzone } from "@/components/assessment/file-dropzone";
import { ArrowRightIcon, CheckIcon, ShieldIcon, SparklesIcon, ToothIcon } from "@/components/ui/icons";
import {
  calculateAssessment,
  calculatePlanningNeed,
  formatCurrency,
  initialAssessment,
  needCatalog,
  profileLabels,
  type AssessmentData,
  type AssessmentFiles,
  type NeedKey,
} from "@/lib/dental-assessment";

const STORAGE_KEY = "vyda-dental-assessment-v1";
const cantons = ["AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"];
const stepNames = ["Profil", "Situation", "Besoins", "Calculateur", "Couverture", "Préparation", "Documents", "Résultat"];
const ResultScreen = dynamic(() => import("@/components/assessment/result-screen").then((module) => module.ResultScreen), {
  loading: () => <main className="flex min-h-screen items-center justify-center bg-[#071c19]"><p className="font-bold text-[#b9f1dd]">Préparation de votre résultat…</p></main>,
});

type OptionButtonProps = {
  active: boolean;
  children: ReactNode;
  description?: string;
  onClick: () => void;
};

function OptionButton({ active, children, description, onClick }: OptionButtonProps) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`group w-full cursor-pointer rounded-2xl border p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(16,45,40,.08)] active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176654] ${active ? "border-[#176654] bg-[#edf6f2] shadow-[0_0_0_1px_#176654]" : "border-slate-200 bg-white hover:border-emerald-700/40 hover:bg-[#fbfdfc]"}`}>
      <span className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${active ? "border-[#176654] bg-[#176654] text-white" : "border-slate-300 bg-white"}`}>{active && <CheckIcon className="h-3 w-3" />}</span>
        <span>
          <span className={`block text-sm font-bold ${active ? "text-[#125444]" : "text-[#102d28]"}`}>{children}</span>
          {description && <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>}
        </span>
      </span>
    </button>
  );
}

export function AssessmentWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<AssessmentData>(initialAssessment);
  const [files, setFiles] = useState<AssessmentFiles>({ contract: null, quote: null });
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateAssessment> | null>(null);

  const progress = (step / 8) * 100;
  const timeRemaining = step <= 4 ? "moins de 2 minutes" : step <= 7 ? "moins d’1 minute" : "quelques secondes";
  const planningNeed = useMemo(() => calculatePlanningNeed(data), [data]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.sessionStorage.getItem(STORAGE_KEY);
        if (!saved) {
          setHydrated(true);
          return;
        }
        const parsed = JSON.parse(saved) as { data?: Partial<AssessmentData>; step?: number };
        if (parsed.data) setData((current) => ({ ...current, ...parsed.data, profile: parsed.data?.profile || current.profile, consent: false }));
        if (parsed.step && parsed.step >= 1 && parsed.step <= 8) setStep(parsed.step);
        setRestored(true);
        setHydrated(true);
      } catch {
        window.sessionStorage.removeItem(STORAGE_KEY);
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ data: { ...data, consent: false }, step }));
  }, [data, hydrated, step]);

  function update<K extends keyof AssessmentData>(field: K, value: AssessmentData[K]) {
    setData((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function toggleNeed(need: NeedKey) {
    update("needs", data.needs.includes(need) ? data.needs.filter((item) => item !== need) : [...data.needs, need]);
  }

  function stepIsValid(currentStep: number) {
    if (currentStep === 1) return Boolean(data.profile);
    if (currentStep === 2) return Boolean(data.canton && data.ageGroup);
    if (currentStep === 3) return data.needs.length > 0;
    if (currentStep === 4) return (data.customBudget || planningNeed) > 0;
    if (currentStep === 5) return Boolean(data.coverage);
    if (currentStep === 6) return Boolean(data.prevention && data.reserve && data.timeline);
    return true;
  }

  function next() {
    if (validating) return;
    if (!stepIsValid(step)) {
      setError("Choisissez une réponse pour continuer.");
      return;
    }
    setValidating(true);
    window.setTimeout(() => {
      setStep((current) => Math.min(8, current + 1));
      setValidating(false);
      setError("");
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }, 260);
  }

  function previous() {
    setStep((current) => Math.max(1, current - 1));
    setError("");
  }

  function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 8) {
      next();
      return;
    }
    const computed = calculateAssessment(data, files);
    setResult(computed);
    window.gtag?.("event", "assessment_complete", { dental_protection_score: computed.score });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function restart() {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setData(initialAssessment);
    setFiles({ contract: null, quote: null });
    setStep(1);
    setResult(null);
    setError("");
  }

  if (result) return <ResultScreen data={data} files={files} result={result} onRestart={restart} />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071c19] text-white">
      <div className="premium-noise pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -left-52 top-28 h-[30rem] w-[30rem] rounded-full bg-[#176654]/20 blur-[120px]" />
      <header className="relative border-b border-white/[0.08] bg-[#071c19]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-[#b9f1dd]"><ToothIcon className="h-5 w-5" /></span>
            <span><span className="block text-base font-extrabold leading-none tracking-tight text-white">assurance-dentaire<span className="text-[#f5a278]">.ch</span></span><span className="mt-1 block text-[0.56rem] font-bold uppercase tracking-[0.18em] text-[#78978f]">Par VYDA SA</span></span>
          </Link>
          <Link href="/" className="text-xs font-bold text-[#8da9a1] transition hover:text-white">Quitter</Link>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-7 sm:px-8 sm:py-10 lg:grid-cols-[16rem_1fr] lg:gap-14 lg:py-14">
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#b9f1dd]">Bilan Protection Dentaire</p>
            <ol className="mt-7 space-y-1">
              {stepNames.map((name, index) => {
                const number = index + 1;
                return (
                  <li key={name} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${number === step ? "bg-white/[0.08] text-white shadow-sm" : number < step ? "text-[#b9f1dd]" : "text-[#78978f]"}`}>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${number < step ? "bg-[#b9f1dd] text-[#08241f]" : number === step ? "border border-[#b9f1dd]/25 bg-[#b9f1dd]/10 text-[#b9f1dd]" : "border border-white/10 bg-white/[0.04]"}`}>{number < step ? <CheckIcon className="h-3.5 w-3.5" /> : number}</span>
                    {name}
                  </li>
                );
              })}
            </ol>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-xs leading-5 text-[#89a29b]"><ShieldIcon className="mb-3 h-5 w-5 text-[#b9f1dd]" />Vos réponses sont sauvegardées uniquement dans cette session sur votre appareil.</div>
          </div>
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 sm:p-5">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#b9f1dd]">Étape {step} sur 8</p>
              <p className="mt-1 text-sm font-semibold text-[#8da9a1]">{stepNames[step - 1]}</p>
              <p className="mt-1 text-xs font-bold text-[#b9f1dd]">Temps restant : {timeRemaining}</p>
            </div>
            <span className="rounded-full bg-[#b9f1dd] px-3 py-1.5 text-sm font-extrabold text-[#08241f]">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/10 p-0.5 shadow-inner" aria-label={`Progression ${Math.round(progress)} %`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <div className="h-full rounded-full bg-gradient-to-r from-[#b9f1dd] via-[#b9f1dd] to-[#f5a278] shadow-[0_0_18px_rgba(185,241,221,.3)] transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          {restored && <p className="mt-3 text-right text-xs font-semibold text-slate-400">Progression restaurée</p>}

          <form onSubmit={finish} className="mt-5">
            <div className="relative min-h-[29rem] overflow-hidden rounded-[2rem] border border-white/70 bg-[#fbfcfa] p-6 text-[#102d28] shadow-[0_35px_100px_rgba(0,0,0,0.28)] sm:rounded-[2.5rem] sm:p-9 lg:p-12">
                {validating && <div className="step-validation absolute inset-0 z-20 flex items-center justify-center bg-[#fbfcfa]/95"><span className="flex items-center gap-3 rounded-full bg-[#176654] px-5 py-3 text-sm font-extrabold text-white shadow-xl"><CheckIcon className="h-5 w-5" /> Réponse validée</span></div>}
                <div key={step} className="assessment-step-enter">
                  {step === 1 && (
                    <div>
                      <p className="assessment-kicker">Commençons simplement</p>
                      <h1 className="assessment-title">Pour qui réalisez-vous ce bilan ?</h1>
                      <p className="assessment-intro">Le score s’adapte à la personne concernée.</p>
                      <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        {([
                          ["adult", "Pour moi", "Un adulte"],
                          ["child", "Pour un enfant", "Préparer ses besoins futurs"],
                          ["family", "Pour ma famille", "Plusieurs personnes à protéger"],
                        ] as const).map(([value, label, description]) => <OptionButton key={value} active={data.profile === value} onClick={() => update("profile", value)} description={description}>{label}</OptionButton>)}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <p className="assessment-kicker">Votre situation</p>
                      <h1 className="assessment-title">Quelques repères pour personnaliser le bilan.</h1>
                      <p className="assessment-intro">Deux repères pour personnaliser l’analyse.</p>
                      <div className="mt-8 grid gap-5 sm:grid-cols-2">
                        <label className="assessment-label">Canton de résidence<select value={data.canton} onChange={(event) => update("canton", event.target.value)} className="form-control"><option value="">Choisir</option>{cantons.map((canton) => <option key={canton}>{canton}</option>)}</select></label>
                        <label className="assessment-label">Tranche d’âge<select value={data.ageGroup} onChange={(event) => update("ageGroup", event.target.value)} className="form-control"><option value="">Choisir</option><option>0–6 ans</option><option>7–12 ans</option><option>13–17 ans</option><option>18–34 ans</option><option>35–54 ans</option><option>55 ans et plus</option><option>Plusieurs tranches d’âge</option></select></label>
                      </div>
                      {data.profile === "family" && <label className="assessment-label mt-5">Nombre de personnes concernées<div className="mt-2 flex items-center gap-4"><input type="range" min="2" max="6" value={data.householdSize} onChange={(event) => update("householdSize", Number(event.target.value))} className="accent-[#176654]" /><span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-[#edf6f2] font-bold text-[#176654]">{data.householdSize}</span></div></label>}
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <p className="assessment-kicker">Vos priorités</p>
                      <h1 className="assessment-title">Quels besoins souhaitez-vous anticiper ?</h1>
                      <p className="assessment-intro">Sélectionnez toutes vos priorités.</p>
                      <div className="mt-7 grid gap-3 sm:grid-cols-2">
                        {(Object.keys(needCatalog) as NeedKey[]).map((need) => <OptionButton key={need} active={data.needs.includes(need)} onClick={() => toggleNeed(need)} description={needCatalog[need].description}>{needCatalog[need].label}</OptionButton>)}
                      </div>
                      {data.needs.length > 0 && <div className="assessment-step-enter mt-6 flex items-center justify-between rounded-2xl bg-[#102d28] p-4 text-white"><span className="text-sm font-semibold">Montant de planification indicatif</span><strong>{formatCurrency(planningNeed)}</strong></div>}
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <p className="assessment-kicker">Calculateur de besoins</p>
                      <h1 className="assessment-title">Quel montant souhaitez-vous pouvoir absorber ?</h1>
                      <p className="assessment-intro">Ajustez cette base de planification selon votre situation.</p>
                      <div className="mt-8 rounded-3xl bg-[#f3f7f4] p-6 sm:p-8">
                        <p className="text-sm font-semibold text-slate-500">Besoin de planification</p>
                        <p key={data.customBudget || planningNeed} className="assessment-value-pulse mt-2 font-display text-4xl font-semibold tracking-tight text-[#102d28] sm:text-5xl">{formatCurrency(data.customBudget || planningNeed)}</p>
                        <input aria-label="Montant de planification" type="range" min="250" max="30000" step="250" value={data.customBudget || Math.min(30000, Math.max(250, planningNeed))} onChange={(event) => update("customBudget", Number(event.target.value))} className="mt-8 w-full accent-[#176654]" />
                        <div className="mt-2 flex justify-between text-xs font-semibold text-slate-400"><span>CHF 250</span><span>CHF 30’000</span></div>
                      </div>
                      <div className="mt-5 grid gap-2 sm:grid-cols-2">{data.needs.map((need) => <div key={need} className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600"><CheckIcon className="h-4 w-4 text-[#176654]" />{needCatalog[need].label}</div>)}</div>
                    </div>
                  )}

                  {step === 5 && (
                    <div>
                      <p className="assessment-kicker">Votre couverture</p>
                      <h1 className="assessment-title">Comment êtes-vous couvert aujourd’hui ?</h1>
                      <p className="assessment-intro">Indiquez uniquement votre couverture actuelle.</p>
                      <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        {([
                          ["supplementary", "J’ai une complémentaire dentaire", "Une garantie spécifique est déjà en place"],
                          ["basic", "Assurance de base uniquement", "Aucune complémentaire identifiée"],
                          ["none", "Aucune couverture", "Les soins sont financés directement"],
                          ["unknown", "Je ne sais pas", "Mes garanties ne sont pas claires"],
                        ] as const).map(([value, label, description]) => <OptionButton key={value} active={data.coverage === value} onClick={() => update("coverage", value)} description={description}>{label}</OptionButton>)}
                      </div>
                      {data.coverage === "supplementary" && <label className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f3f7f4] p-4 text-sm leading-6 text-slate-600"><input type="checkbox" checked={data.knowsCoverage} onChange={(event) => update("knowsCoverage", event.target.checked)} className="mt-1 h-4 w-4 accent-[#176654]" /><span>Je connais mon taux de remboursement, mon plafond annuel et mon délai d’attente.</span></label>}
                    </div>
                  )}

                  {step === 6 && (
                    <div>
                      <p className="assessment-kicker">Votre préparation</p>
                      <h1 className="assessment-title">Trois repères pour mesurer votre protection.</h1>
                      <div className="mt-7 grid gap-6">
                        <label className="assessment-label">À quelle fréquence consultez-vous pour la prévention ?<select value={data.prevention} onChange={(event) => update("prevention", event.target.value as AssessmentData["prevention"])} className="form-control"><option value="">Choisir</option><option value="twice">Deux fois par an</option><option value="yearly">Une fois par an</option><option value="irregular">Irrégulièrement</option><option value="never">Jamais ou presque</option></select></label>
                        <label className="assessment-label">Votre réserve actuelle pourrait-elle absorber ce besoin ?<select value={data.reserve} onChange={(event) => update("reserve", event.target.value as AssessmentData["reserve"])} className="form-control"><option value="">Choisir</option><option value="comfortable">Oui, confortablement</option><option value="partial">En partie</option><option value="limited">Très difficilement</option><option value="none">Non</option></select></label>
                        <label className="assessment-label">Quand pensez-vous avoir besoin de soins ?<select value={data.timeline} onChange={(event) => update("timeline", event.target.value as AssessmentData["timeline"])} className="form-control"><option value="">Choisir</option><option value="preventive">Aucun soin prévu, démarche préventive</option><option value="year">Dans les 12 prochains mois</option><option value="soon">Dans les 3 prochains mois</option><option value="ongoing">Traitement conseillé ou déjà commencé</option></select></label>
                      </div>
                    </div>
                  )}

                  {step === 7 && (
                    <div>
                      <p className="assessment-kicker">Documents</p>
                      <h1 className="assessment-title">Préparez une future analyse détaillée.</h1>
                      <p className="assessment-intro">Facultatif. Les PDF restent sur votre appareil.</p>
                      <div className="mt-8 grid gap-4">
                        <FileDropzone id="contract-upload" label="Ajouter mon contrat d’assurance" description="Conditions, tableau des prestations ou police d’assurance" file={files.contract} onChange={(contract) => setFiles((current) => ({ ...current, contract }))} />
                        <FileDropzone id="quote-upload" label="Ajouter un devis de dentiste" description="Devis ou plan de traitement à conserver avec le bilan" file={files.quote} onChange={(quote) => setFiles((current) => ({ ...current, quote }))} />
                      </div>
                      <div className="mt-5 flex gap-3 rounded-2xl bg-[#fff4ef] p-4 text-xs leading-5 text-[#783c22]"><ShieldIcon className="h-5 w-5 shrink-0" /><p>Par sécurité, le navigateur ne peut pas restaurer ces fichiers après un rechargement. Leurs noms figurent uniquement dans le rapport de cette session.</p></div>
                    </div>
                  )}

                  {step === 8 && (
                    <div>
                      <p className="assessment-kicker">Dernière étape</p>
                      <h1 className="assessment-title">Votre Score Protection Dentaire est prêt.</h1>
                      <p className="assessment-intro">Vérifiez, puis découvrez votre score.</p>
                      <div className="mt-8 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-[#f8faf9] p-5"><span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-500">Profil</span><strong className="mt-2 block text-lg text-[#102d28]">{data.profile ? profileLabels[data.profile] : "—"}</strong></div>
                        <div className="rounded-2xl border border-slate-200 bg-[#f8faf9] p-5"><span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-500">Priorités</span><strong className="mt-2 block text-lg text-[#102d28]">{data.needs.length} besoin{data.needs.length > 1 ? "s" : ""}</strong></div>
                        <div className="rounded-2xl border border-slate-200 bg-[#f8faf9] p-5"><span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-500">Planification</span><strong className="mt-2 block text-lg text-[#102d28]">{formatCurrency(planningNeed)}</strong></div>
                      </div>
                      <div className="mt-6 flex gap-3 rounded-2xl bg-[#e9f4ef] p-4 text-sm leading-6 text-[#29423d]"><ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#176654]" /><p>Le score explique votre niveau de préparation. Il ne constitue ni un diagnostic, ni une offre d’assurance.</p></div>
                    </div>
                  )}
                </div>
            </div>

            {error && <p className="assessment-step-enter mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700" role="alert">{error}</p>}
            <div className="sticky bottom-0 z-30 -mx-5 mt-5 flex items-center justify-between gap-3 border-t border-white/10 bg-[#071c19]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
              <button type="button" onClick={previous} disabled={step === 1} className="min-h-12 rounded-full border border-white/15 bg-white/[0.05] px-5 text-sm font-bold text-[#a9beb8] transition hover:bg-white/[0.1] hover:text-white disabled:invisible">Retour</button>
              {step < 8 ? <button type="button" onClick={next} disabled={validating} className="premium-button min-h-12 min-w-36 px-6 text-sm disabled:opacity-70">Continuer <ArrowRightIcon className="h-4 w-4" /></button> : <button type="submit" className="premium-button min-h-12 min-w-48 px-6 text-sm">Calculer mon score<SparklesIcon className="h-4 w-4" /></button>}
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-[#78978f]"><ShieldIcon className="h-4 w-4" /> Confidentiel · Sans engagement · Résultat immédiat</p>
          </form>
        </section>
      </div>
    </main>
  );
}
