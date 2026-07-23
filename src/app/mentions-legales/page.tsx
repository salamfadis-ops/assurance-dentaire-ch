import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Mentions légales", alternates: { canonical: "/mentions-legales" } };

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" intro="Informations relatives à l’éditeur et à l’utilisation du site assurance-dentaire.ch.">
      <section><h2>Éditeur</h2><p>assurance-dentaire.ch est une plateforme éditée par VYDA SA, cabinet de courtage indépendant basé à Meyrin, Genève.</p><p>Contact : <a href="mailto:contact@vyda.ch">contact@vyda.ch</a> · <a href="tel:+41794809910">+41 79 480 99 10</a> · <a href="https://vyda.ch" target="_blank" rel="noreferrer">vyda.ch</a></p></section>
      <section><h2>Nature du service</h2><p>Le site fournit des informations générales et une mise en relation pour l’orientation en matière d’assurance dentaire. Il ne constitue pas un assureur et ne remplace pas les conditions contractuelles des prestataires concernés.</p></section>
      <section><h2>Responsabilité</h2><p>VYDA SA veille à la qualité des informations publiées, sans garantir leur exhaustivité ni leur adéquation à chaque situation individuelle. Avant toute souscription, les conditions générales et particulières du contrat font foi.</p></section>
      <section><h2>Propriété intellectuelle</h2><p>Les contenus, éléments graphiques et signes distinctifs présents sur ce site sont protégés. Toute reproduction non autorisée est interdite.</p></section>
    </LegalPage>
  );
}
