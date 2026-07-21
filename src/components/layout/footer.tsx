import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ToothIcon } from "@/components/ui/icons";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#f8faf9] py-12">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1fr_auto_auto] md:gap-16">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#176654] text-white"><ToothIcon className="h-5 w-5" /></span>
              <span className="font-extrabold tracking-tight text-[#102d28]">assurance-dentaire<span className="text-[#f36f38]">.ch</span></span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-slate-500">Une plateforme suisse d’information et d’orientation proposée par VYDA SA.</p>
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#102d28]">Navigation</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><a href="#comprendre" className="hover:text-[#176654]">Comprendre</a></li>
              <li><a href="#fonctionnement" className="hover:text-[#176654]">Fonctionnement</a></li>
              <li><a href="#faq" className="hover:text-[#176654]">Questions fréquentes</a></li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#102d28]">Informations</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><Link href="/mentions-legales" className="hover:text-[#176654]">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-[#176654]">Confidentialité</Link></li>
              <li><a href="mailto:contact@assurance-dentaire.ch" className="hover:text-[#176654]">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} VYDA SA. Tous droits réservés.</p>
          <p className="max-w-2xl sm:text-right">Les informations présentées sont générales et ne remplacent ni les conditions contractuelles d’un assureur ni un conseil juridique.</p>
        </div>
      </Container>
    </footer>
  );
}
