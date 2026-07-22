"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/container";
import { ArrowRightIcon, MenuIcon, ToothIcon, XIcon } from "@/components/ui/icons";

const navigation = [
  ["Bilan gratuit", "/bilan"],
  ["Comprendre", "#comprendre"],
  ["Comment ça marche", "#fonctionnement"],
  ["Couvertures", "#couvertures"],
  ["FAQ", "#faq"],
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <Container className="flex h-[4.75rem] items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Assurance Dentaire — accueil">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#176654] text-white shadow-sm"><ToothIcon className="h-5 w-5" /></span>
          <span>
            <span className="block text-[1.02rem] font-extrabold leading-none tracking-[-0.025em] text-[#102d28]">assurance-dentaire<span className="text-[#f36f38]">.ch</span></span>
            <span className="mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.16em] text-slate-400">Un service VYDA SA</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
          {navigation.map(([label, href]) => (
            <a key={href} href={href} className="text-sm font-semibold text-slate-600 transition hover:text-[#176654]">{label}</a>
          ))}
        </nav>

        <Link href="/bilan" className="hidden items-center gap-2 rounded-full bg-[#176654] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0f5747] sm:inline-flex">Faire mon bilan <ArrowRightIcon className="h-4 w-4" /></Link>
        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="navigation-mobile"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#102d28] sm:hidden"
        >
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </Container>
      {open && (
        <nav id="navigation-mobile" className="border-t border-slate-100 bg-white px-5 py-5 sm:hidden" aria-label="Navigation mobile">
          <div className="grid gap-1">
            {navigation.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-semibold text-slate-700 hover:bg-slate-50">{label}</a>
            ))}
            <Link href="/bilan" onClick={() => setOpen(false)} className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#176654] px-5 py-3 font-bold text-white">Faire mon bilan <ArrowRightIcon className="h-4 w-4" /></Link>
          </div>
        </nav>
      )}
    </header>
  );
}
