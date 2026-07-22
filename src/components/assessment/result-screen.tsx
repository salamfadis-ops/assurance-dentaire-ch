"use client";

import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, CheckIcon, ShieldIcon, SparklesIcon } from "@/components/ui/icons";
import type { AssessmentData, AssessmentFiles, AssessmentResult } from "@/lib/dental-assessment";
import { formatCurrency } from "@/lib/dental-assessment";

type ResultScreenProps = {
  data: AssessmentData;
  files: AssessmentFiles;
  result: AssessmentResult;
  deliveryStatus: "success" | "error";
  onRestart: () => void;
};

const categoryLabels = {
  coverage: "Couverture",
  prevention: "Prévention",
  anticipation: "Anticipation",
  budget: "Budget",
  documentation: "Documentation",
};

const categoryMaximums = { coverage: 24, prevention: 20, anticipation: 20, budget: 20, documentation: 16 };

export function ResultScreen({ data, files, result, deliveryStatus, onRestart }: ResultScreenProps) {
  const reduceMotion = useReducedMotion();
  const [downloading, setDownloading] = useState(false);
  const circumference = 2 * Math.PI * 67;
  const scoreColor = result.level === "solid" ? "#176654" : result.level === "partial" ? "#d97706" : "#dc5b39";

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
    <LazyMotion features={domAnimation} strict><m.main initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#f3f7f4] pb-20">
      <div className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="text-sm font-extrabold tracking-tight text-[#102d28]">assurance-dentaire<span className="text-[#f36f38]">.ch</span></Link>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#176654]">Bilan terminé</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pt-10 sm:px-8 sm:pt-14">
        <div className="grid items-center gap-10 rounded-[2rem] bg-[#102d28] p-6 text-white shadow-[0_28px_80px_rgba(16,45,40,0.18)] sm:p-10 lg:grid-cols-[0.68fr_1.32fr] lg:p-12">
          <div className="relative mx-auto h-52 w-52">
            <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="80" cy="80" r="67" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="12" />
              <m.circle cx="80" cy="80" r="67" fill="none" stroke={scoreColor} strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference * (1 - result.score / 100) }} transition={{ duration: reduceMotion ? 0 : 1.1, ease: "easeOut" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <m.span initial={reduceMotion ? false : { scale: 0.75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35 }} className="text-5xl font-bold">{result.score}</m.span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">sur 100</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Votre Score Protection Dentaire</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{result.label}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{result.summary}</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold"><SparklesIcon className="h-4 w-4 text-[#f49467]" /> Besoin de planification : {formatCurrency(result.planningNeed)}</div>
          </div>
        </div>

        {deliveryStatus === "error" && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Votre résultat est disponible, mais vos coordonnées n’ont pas pu être transmises. Téléchargez le rapport et contactez <a href="mailto:contact@assurance-dentaire.ch" className="font-bold underline">VYDA SA</a>.</div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#19715e]">Priorités personnalisées</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#102d28]">Vos prochaines actions</h2>
            <ol className="mt-6 space-y-4">
              {result.recommendations.slice(0, 5).map((recommendation, index) => (
                <m.li key={recommendation} initial={reduceMotion ? false : { opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl bg-[#f8faf9] p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e3f1ec] text-xs font-bold text-[#176654]">{index + 1}</span>
                  <p className="text-sm leading-6 text-slate-600">{recommendation}</p>
                </m.li>
              ))}
            </ol>
          </section>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold text-[#102d28]">Détail du score</h2>
              <div className="mt-6 space-y-5">
                {(Object.keys(result.breakdown) as Array<keyof typeof result.breakdown>).map((key) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm"><span className="font-semibold text-slate-600">{categoryLabels[key]}</span><span className="font-bold text-[#102d28]">{result.breakdown[key]}/{categoryMaximums[key]}</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><m.div initial={{ width: 0 }} animate={{ width: `${(result.breakdown[key] / categoryMaximums[key]) * 100}%` }} transition={{ duration: reduceMotion ? 0 : 0.7 }} className="h-full rounded-full bg-[#176654]" /></div>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-[1.75rem] bg-[#176654] p-6 text-white sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><ShieldIcon className="h-5 w-5" /></div>
              <h2 className="mt-5 text-xl font-bold">Votre rapport personnel</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-50/80">Conservez votre score, vos priorités et le détail de votre préparation au format PDF.</p>
              <button type="button" onClick={downloadReport} disabled={downloading} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[#176654] transition hover:-translate-y-0.5 disabled:opacity-60">
                {downloading ? "Création du PDF…" : "Télécharger mon rapport PDF"}
                {!downloading && <ArrowRightIcon className="h-4 w-4 rotate-90" />}
              </button>
            </section>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-500">
          <div className="flex gap-3"><CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#176654]" /><p><strong className="text-slate-700">Méthode transparente :</strong> ce score mesure votre niveau de préparation selon vos réponses. Il ne constitue ni une offre d’assurance, ni un diagnostic, ni une garantie de remboursement.</p></div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button type="button" onClick={onRestart} className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-white">Recommencer le bilan</button>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-[#176654]">Retour à l’accueil <ArrowRightIcon className="h-4 w-4" /></Link>
        </div>
      </div>
    </m.main></LazyMotion>
  );
}
