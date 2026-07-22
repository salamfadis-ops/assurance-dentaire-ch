"use client";

import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, CheckIcon, DocumentIcon, ShieldIcon, SparklesIcon, ToothIcon } from "@/components/ui/icons";
import type { AssessmentData, AssessmentFiles, AssessmentResult } from "@/lib/dental-assessment";
import { formatCurrency } from "@/lib/dental-assessment";

type ResultScreenProps = {
  data: AssessmentData;
  files: AssessmentFiles;
  result: AssessmentResult;
  deliveryStatus: "success" | "error";
  onRestart: () => void;
};

const categoryLabels = { coverage: "Couverture", prevention: "Prévention", anticipation: "Anticipation", budget: "Budget", documentation: "Documentation" };
const categoryMaximums = { coverage: 24, prevention: 20, anticipation: 20, budget: 20, documentation: 16 };
const ease = [0.22, 1, 0.36, 1] as const;

export function ResultScreen({ data, files, result, deliveryStatus, onRestart }: ResultScreenProps) {
  const reduceMotion = useReducedMotion();
  const [downloading, setDownloading] = useState(false);
  const circumference = 2 * Math.PI * 78;
  const scoreColor = result.level === "solid" ? "#b9f1dd" : result.level === "partial" ? "#f5b47d" : "#fa8f72";

  async function downloadReport() {
    setDownloading(true);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, result, files: { contract: Boolean(files.contract), quote: Boolean(files.quote) } }),
      });
      if (!response.ok) throw new Error("report_failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `bilan-protection-dentaire-${data.firstName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "vyda"}.pdf`;
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
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
            <div className="relative mx-auto h-72 w-72 sm:h-80 sm:w-80">
              <div className="absolute inset-[15%] rounded-full bg-white/[0.035] blur-xl" />
              <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="90" cy="90" r="78" fill="none" stroke="rgba(255,255,255,.075)" strokeWidth="6" />
                <m.circle cx="90" cy="90" r="78" fill="none" stroke={scoreColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference * (1 - result.score / 100) }} transition={{ duration: reduceMotion ? 0 : 1.6, delay: 0.25, ease }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <m.span initial={reduceMotion ? false : { scale: 0.68, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.55, duration: 0.7, ease }} className="font-display text-7xl font-semibold tracking-[-0.075em] sm:text-8xl">{result.score}</m.span>
                <span className="mt-1 text-[0.67rem] font-bold uppercase tracking-[0.23em] text-[#8da9a1]">sur 100</span>
              </div>
              <m.span initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1, ease }} className="absolute right-0 top-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5a278] text-[#32180f] shadow-xl"><SparklesIcon className="h-5 w-5" /></m.span>
            </div>

            <div>
              <p className="text-[0.67rem] font-bold uppercase tracking-[0.23em] text-[#b9f1dd]">Votre Score Protection Dentaire</p>
              <m.h1 initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7, ease }} className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-7xl">{result.label}</m.h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#a9beb8]">{result.summary}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-[#d5e3df]">Planification <strong className="ml-1 text-white">{formatCurrency(result.planningNeed)}</strong></span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-[#d5e3df]">{result.recommendations.length} actions prioritaires</span>
              </div>
            </div>
          </div>
        </section>

        <section className="relative rounded-t-[2.5rem] bg-[#f3f6f2] pb-20 pt-8 text-[#102d28] sm:rounded-t-[3.5rem] sm:pb-28 sm:pt-12">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            {deliveryStatus === "error" && <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Votre résultat est disponible, mais vos coordonnées n’ont pas pu être transmises. Téléchargez le rapport et contactez <a href="mailto:contact@assurance-dentaire.ch" className="font-bold underline">VYDA SA</a>.</div>}

            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
              <section className="rounded-[2rem] border border-[#dee7e2] bg-white p-6 shadow-[0_18px_55px_rgba(8,35,30,.06)] sm:p-9">
                <p className="text-[0.67rem] font-bold uppercase tracking-[0.2em] text-[#176654]">Votre plan d’action</p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">Ce que vous devriez faire maintenant.</h2>
                <ol className="mt-7 space-y-3">
                  {result.recommendations.slice(0, 5).map((recommendation, index) => (
                    <m.li key={recommendation} initial={reduceMotion ? false : { opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.07, ease }} className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-[#e5ece8] bg-[#f8faf8] p-4 sm:p-5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dff1e9] text-xs font-bold text-[#176654]">0{index + 1}</span>
                      <p className="text-sm leading-6 text-[#5b6f69]">{recommendation}</p>
                    </m.li>
                  ))}
                </ol>
              </section>

              <div className="space-y-6">
                <section className="rounded-[2rem] border border-[#dee7e2] bg-white p-6 shadow-[0_18px_55px_rgba(8,35,30,.05)] sm:p-8">
                  <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold tracking-[-0.035em]">Détail du score</h2><span className="text-xs font-bold text-[#71847e]">5 dimensions</span></div>
                  <div className="mt-7 space-y-5">
                    {(Object.keys(result.breakdown) as Array<keyof typeof result.breakdown>).map((key) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm"><span className="font-semibold text-[#61736e]">{categoryLabels[key]}</span><span className="font-bold text-[#102d28]">{result.breakdown[key]}/{categoryMaximums[key]}</span></div>
                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#e8eeeb]"><m.div initial={{ width: 0 }} animate={{ width: `${(result.breakdown[key] / categoryMaximums[key]) * 100}%` }} transition={{ duration: reduceMotion ? 0 : 0.9, delay: 0.2, ease }} className="h-full rounded-full bg-[#176654]" /></div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="relative overflow-hidden rounded-[2rem] bg-[#176654] p-6 text-white shadow-[0_24px_65px_rgba(23,102,84,.2)] sm:p-8">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-[28px] border-white/[0.05]" />
                  <div className="relative"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#b9f1dd]"><DocumentIcon className="h-5 w-5" /></span><h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.035em]">Votre rapport personnel</h2><p className="mt-3 text-sm leading-6 text-[#d1e5df]">Conservez votre score, vos priorités et le détail de votre préparation.</p>
                    <button type="button" onClick={downloadReport} disabled={downloading} className="group mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-[#176654] shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60">{downloading ? "Création du PDF…" : "Télécharger mon rapport"}{!downloading && <ArrowRightIcon className="h-4 w-4 rotate-90 transition group-hover:translate-y-0.5" />}</button>
                  </div>
                </section>
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
