"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/container";
import { ArrowRightIcon, MenuIcon, ToothIcon, XIcon } from "@/components/ui/icons";

const navigation = [
  ["La méthode", "/#methode"],
  ["Le parcours", "/#fonctionnement"],
  ["Comprendre", "/#comprendre"],
  ["Questions", "/#faq"],
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#071c19]/95 text-white backdrop-blur-xl">
      <Container className="flex h-20 items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-[#b9f1dd] transition group-hover:bg-white/[0.12]"><ToothIcon className="h-5 w-5" /></span>
          <span>
            <span className="block text-[1.02rem] font-extrabold leading-none tracking-[-0.03em] text-white">assurance-dentaire<span className="text-[#f5a278]">.ch</span></span>
            <span className="mt-1 block text-[0.56rem] font-bold uppercase tracking-[0.18em] text-[#78978f]">Par VYDA SA</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
          {navigation.map(([label, href]) => <a key={href} href={href} className="text-xs font-bold text-[#9db3ad] transition hover:text-white">{label}</a>)}
        </nav>

        <Link href="/bilan" className="group hidden items-center gap-2 rounded-full bg-[#b9f1dd] px-5 py-2.5 text-xs font-extrabold text-[#08241f] shadow-[0_10px_30px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 hover:bg-[#cef8e8] sm:inline-flex">Obtenir mon score <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" /></Link>
        <button type="button" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open} aria-controls="navigation-mobile" onClick={() => setOpen((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white sm:hidden">
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </Container>
      {open && (
        <nav id="navigation-mobile" className="border-t border-white/10 bg-[#071c19] px-5 py-5 sm:hidden" aria-label="Navigation mobile">
          <div className="grid gap-1">
            {navigation.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-semibold text-[#b3c7c1] hover:bg-white/[0.06] hover:text-white">{label}</a>)}
            <Link href="/bilan" onClick={() => setOpen(false)} className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#b9f1dd] px-5 py-3 font-bold text-[#08241f]">Obtenir mon score <ArrowRightIcon className="h-4 w-4" /></Link>
          </div>
        </nav>
      )}
    </header>
  );
}
