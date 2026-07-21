import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/confidentialite" } };

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" intro="Comment VYDA SA traite les informations transmises par les utilisateurs de cette plateforme.">
      <section><h2>Responsable du traitement</h2><p>VYDA SA est responsable du traitement des données personnelles collectées via assurance-dentaire.ch. Toute question peut être adressée à <a href="mailto:contact@assurance-dentaire.ch">contact@assurance-dentaire.ch</a>.</p></section>
      <section><h2>Données concernées</h2><p>Lorsque vous préparez une demande, vous pouvez renseigner votre profil, canton, besoin, prénom, adresse e-mail et numéro de téléphone. Le formulaire actuel ouvre votre messagerie avec un message prérempli : aucune donnée n’est enregistrée dans une base de données du site.</p></section>
      <section><h2>Finalité</h2><p>Les informations envoyées par e-mail sont utilisées uniquement pour comprendre votre demande, vous recontacter et vous proposer une orientation adaptée.</p></section>
      <section><h2>Conservation et droits</h2><p>Les données transmises sont conservées uniquement pendant la durée nécessaire au traitement de la demande et aux obligations légales applicables. Vous pouvez demander l’accès, la rectification ou la suppression de vos données par e-mail.</p></section>
      <section><h2>Services techniques</h2><p>Le site peut générer des journaux techniques nécessaires à sa sécurité et à son fonctionnement. Aucun outil publicitaire ou cookie de suivi n’est intégré dans cette première version.</p></section>
      <section><h2>Mise à jour</h2><p>Dernière mise à jour : juillet 2026.</p></section>
    </LegalPage>
  );
}
