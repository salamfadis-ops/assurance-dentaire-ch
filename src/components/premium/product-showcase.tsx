"use client";

import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import { useState } from "react";
import { ArrowRightIcon, CheckIcon, DocumentIcon, ShieldIcon, SparklesIcon } from "@/components/ui/icons";

const ease = [0.22, 1, 0.36, 1] as const;

export function ProtectionVisual() {
  const reduceMotion = useReducedMotion();
  const circumference = 2 * Math.PI * 74;

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="relative mx-auto aspect-[0.92] w-full max-w-[34rem] lg:max-w-none" aria-label="Aperçu du Score Protection Dentaire">
        <div className="absolute inset-[8%] rounded-full bg-[#d8ffef]/15 blur-3xl" />
        <m.div
          initial={reduceMotion ? false : { opacity: 0, y: 24, rotateX: 5 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.9, ease }}
          className="absolute inset-x-[4%] bottom-[2%] top-[4%] overflow-hidden rounded-[2rem] border border-white/15 bg-[#0d2b27]/90 p-5 shadow-[0_40px_100px_rgba(2,16,14,0.5)] backdrop-blur-xl sm:rounded-[2.5rem] sm:p-7"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#bcf5df]/10 text-[#bcf5df]"><ShieldIcon className="h-5 w-5" /></span>
              <div><p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#9ab8b0]">Bilan personnel</p><p className="mt-0.5 text-sm font-semibold text-white">Protection dentaire</p></div>
            </div>
            <span className="rounded-full border border-[#bcf5df]/20 bg-[#bcf5df]/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#bcf5df]">Analyse active</span>
          </div>

          <div className="grid h-[calc(100%-4.2rem)] place-items-center">
            <div className="relative h-56 w-56 sm:h-64 sm:w-64">
              <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden="true">
                <defs>
                  <linearGradient id="premium-score" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#bcf5df" />
                    <stop offset="1" stopColor="#f5a278" />
                  </linearGradient>
                </defs>
                <circle cx="90" cy="90" r="74" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="7" />
                <m.circle
                  cx="90" cy="90" r="74" fill="none" stroke="url(#premium-score)" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference * 0.21 }}
                  transition={{ duration: reduceMotion ? 0 : 1.6, delay: 0.35, ease }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <m.strong initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65, duration: 0.65, ease }} className="font-display text-6xl font-semibold tracking-[-0.07em] text-white sm:text-7xl">79</m.strong>
                <span className="mt-1 text-[0.66rem] font-bold uppercase tracking-[0.22em] text-[#9ab8b0]">Score protection</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-2 sm:bottom-7 sm:left-7 sm:right-7">
            {[["Budget", "Maîtrisé"], ["Contrat", "À clarifier"], ["Prévention", "Solide"]].map(([label, value], index) => (
              <m.div key={label} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + index * 0.1 }} className="rounded-xl border border-white/10 bg-white/[0.055] p-2.5 sm:p-3">
                <span className="block text-[0.57rem] font-bold uppercase tracking-[0.15em] text-[#78978f]">{label}</span>
                <span className="mt-1 block truncate text-[0.65rem] font-semibold text-white sm:text-xs">{value}</span>
              </m.div>
            ))}
          </div>
        </m.div>

        <m.div initial={reduceMotion ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, y: [0, -5, 0] }} transition={{ opacity: { delay: 1 }, x: { delay: 1 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }} className="absolute right-0 top-[22%] hidden items-center gap-2 rounded-2xl border border-white/15 bg-white/95 px-3.5 py-3 text-xs font-bold text-[#12332d] shadow-2xl sm:flex">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#e1f6ee] text-[#176654]"><CheckIcon className="h-4 w-4" /></span> Rapport prêt
        </m.div>
        <m.div initial={reduceMotion ? false : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0, y: [0, 5, 0] }} transition={{ opacity: { delay: 1.15 }, x: { delay: 1.15 }, y: { duration: 5.6, repeat: Infinity, ease: "easeInOut" } }} className="absolute -left-2 bottom-[24%] hidden items-center gap-2 rounded-2xl border border-white/15 bg-[#f7a57d] px-3.5 py-3 text-xs font-bold text-[#32150c] shadow-2xl sm:flex">
          <SparklesIcon className="h-4 w-4" /> 5 priorités détectées
        </m.div>
      </div>
    </LazyMotion>
  );
}

const journey = [
  {
    id: "01",
    eyebrow: "Votre situation",
    title: "8 réponses, jamais de jargon.",
    description: "Le parcours s’adapte à un adulte, un enfant ou toute la famille.",
    metric: "≈ 2 min",
    label: "pour compléter le bilan",
  },
  {
    id: "02",
    eyebrow: "Votre lecture",
    title: "Un score qui explique ses raisons.",
    description: "Cinq dimensions visibles, chacune reliée à une action.",
    metric: "5 axes",
    label: "analysés avec transparence",
  },
  {
    id: "03",
    eyebrow: "Votre plan",
    title: "Un rapport que vous pouvez utiliser.",
    description: "Votre PDF rassemble besoins, vigilances et prochaines actions.",
    metric: "1 PDF",
    label: "personnel et immédiatement disponible",
  },
] as const;

export function JourneyTimeline() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const item = journey[active];

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="relative">
          <div className="absolute bottom-7 left-[1.45rem] top-7 w-px bg-white/10" />
          <div className="grid gap-2">
            {journey.map((step, index) => (
              <button key={step.id} type="button" onClick={() => setActive(index)} aria-pressed={active === index} className={`relative grid grid-cols-[3rem_1fr] gap-4 rounded-2xl p-3 text-left transition duration-300 ${active === index ? "bg-white/[0.07]" : "hover:bg-white/[0.035]"}`}>
                <span className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border text-xs font-bold transition ${active === index ? "border-[#b9f1dd] bg-[#b9f1dd] text-[#09231f] shadow-[0_0_0_7px_rgba(185,241,221,.08)]" : "border-white/15 bg-[#0b2521] text-[#8da9a1]"}`}>{step.id}</span>
                <span className="py-1"><span className={`block text-sm font-bold ${active === index ? "text-white" : "text-[#9db3ad]"}`}>{step.eyebrow}</span><span className="mt-1 block text-xs leading-5 text-[#9db3ad]">{step.title}</span></span>
              </button>
            ))}
          </div>
        </div>

        <m.div key={item.id} initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="relative min-h-[23rem] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-7 sm:p-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#b9f1dd]/[0.07] blur-2xl" />
          <p className="relative text-[0.67rem] font-bold uppercase tracking-[0.22em] text-[#b9f1dd]">{item.eyebrow}</p>
          <h3 className="relative mt-4 max-w-lg font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-4xl">{item.title}</h3>
          <p className="relative mt-5 max-w-xl text-base leading-7 text-[#a8bdb7]">{item.description}</p>
          <div className="relative mt-9 flex items-end gap-4 border-t border-white/10 pt-7">
            <span className="font-display text-4xl font-semibold tracking-[-0.05em] text-[#f4a078]">{item.metric}</span>
            <span className="max-w-[12rem] pb-1 text-xs font-semibold leading-5 text-[#89a29b]">{item.label}</span>
          </div>
          <a href="/bilan" className="relative mt-8 inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-[#b9f1dd]">Commencer maintenant <ArrowRightIcon className="h-4 w-4" /></a>
          <DocumentIcon className="absolute bottom-7 right-7 h-16 w-16 text-white/[0.035] sm:h-24 sm:w-24" />
        </m.div>
      </div>
    </LazyMotion>
  );
}
