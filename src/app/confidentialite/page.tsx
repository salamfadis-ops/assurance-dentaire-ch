import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/confidentialite" } };

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" intro="Comment VYDA SA traite les informations transmises par les utilisateurs de cette plateforme.">
      <section><h2>Responsable du traitement</h2><p>VYDA SA est responsable du traitement des données personnelles collectées via assurance-dentaire.ch. Toute question peut être adressée à <a href="mailto:contact@assurance-dentaire.ch">contact@assurance-dentaire.ch</a>.</p></section>
      <section><h2>Données concernées</h2><p>Lorsque vous envoyez une demande, vous pouvez renseigner votre profil, canton, besoin, prénom, adresse e-mail et numéro de téléphone. Des paramètres d’attribution publicitaire peuvent aussi être transmis afin de mesurer l’origine de la demande.</p></section>
      <section><h2>Finalité</h2><p>Les informations envoyées par e-mail sont utilisées uniquement pour comprendre votre demande, vous recontacter et vous proposer une orientation adaptée.</p></section>
      <section><h2>Conservation et droits</h2><p>Les données transmises sont conservées uniquement pendant la durée nécessaire au traitement de la demande et aux obligations légales applicables. Vous pouvez demander l’accès, la rectification ou la suppression de vos données par e-mail.</p></section>
      <section><h2>Services techniques</h2><p>Le site peut transmettre votre demande à un prestataire d’envoi d’e-mails ou à un outil de gestion commerciale configuré par VYDA SA. Il peut aussi générer des journaux techniques nécessaires à sa sécurité et à son fonctionnement.</p></section>
      <section><h2>Mesure des conversions</h2><p>Lorsque le suivi Google Ads est activé, aucun outil de mesure n’est chargé avant votre consentement. Vous pouvez refuser cette mesure depuis le bandeau affiché sur le site sans perdre l’accès au service.</p></section>
      <section><h2>Mise à jour</h2><p>Dernière mise à jour : juillet 2026.</p></section>
    </LegalPage>
  );
}
