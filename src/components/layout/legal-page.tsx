import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ArrowRightIcon } from "@/components/ui/icons";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f8faf9] py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#176654]"><ArrowRightIcon className="h-4 w-4 rotate-180" /> Retour à l’accueil</Link>
            <p className="eyebrow mt-10">Informations</p>
            <h1 className="section-title mt-4">{title}</h1>
            <p className="section-intro mt-5">{intro}</p>
            <div className="mt-10 space-y-8 rounded-3xl border border-slate-200 bg-white p-7 leading-7 text-slate-600 shadow-sm sm:p-10 [&_a]:font-semibold [&_a]:text-[#176654] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#102d28] [&_p]:mt-2 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
              {children}
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
