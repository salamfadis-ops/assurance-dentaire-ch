import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ToothIcon } from "@/components/ui/icons";
import { VydaMark } from "@/components/vyda-mark";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#071c19] py-14 text-white">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1fr_auto_auto] md:gap-16">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] text-[#b9f1dd]"><ToothIcon className="h-5 w-5" /></span>
              <span className="font-extrabold tracking-tight text-white">assurance-dentaire<span className="text-[#f5a278]">.ch</span></span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-[#89a29b]">Une plateforme suisse d’information et d’analyse proposée par VYDA SA. Nous ne sommes ni une caisse-maladie ni un assureur.</p>
            <div className="mt-6"><VydaMark inverse /></div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Navigation</h2>
            <ul className="mt-4 space-y-3 text-sm text-[#89a29b]">
              <li><Link href="/bilan" className="hover:text-white">Bilan gratuit</Link></li>
              <li><Link href="/#methode" className="hover:text-white">La méthode</Link></li>
              <li><Link href="/#fonctionnement" className="hover:text-white">Le parcours</Link></li>
              <li><Link href="/#faq" className="hover:text-white">Questions fréquentes</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">VYDA SA</h2>
            <ul className="mt-4 space-y-3 text-sm text-[#89a29b]">
              <li>Meyrin, Genève</li>
              <li>Cabinet de courtage indépendant</li>
              <li>Conseiller enregistré FINMA</li>
              <li><a href="mailto:contact@vyda.ch" className="hover:text-white">contact@vyda.ch</a></li>
              <li><a href="tel:+41794809910" className="hover:text-white">+41 79 480 99 10</a></li>
              <li><a href="https://vyda.ch" target="_blank" rel="noreferrer" className="hover:text-white">vyda.ch</a></li>
              <li><Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white">Confidentialité</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.08] pt-6 text-xs leading-5 text-[#6f8d85] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} VYDA SA. Tous droits réservés.</p>
          <p className="max-w-2xl sm:text-right">Les informations sont générales. Les conditions contractuelles de l’assureur font foi avant toute souscription.</p>
        </div>
      </Container>
    </footer>
  );
}
