import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { isDocumentStorageConfigured } from "@/lib/document-storage";
import { getDocumentRetentionDays } from "@/lib/documents";

export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/confidentialite" } };

export default function ConfidentialitePage() {
  const storageConfigured = isDocumentStorageConfigured();
  const retentionDays = getDocumentRetentionDays();
  return (
    <LegalPage title="Politique de confidentialité" intro="Comment VYDA SA traite les informations transmises par les utilisateurs de cette plateforme.">
      <section><h2>Responsable du traitement</h2><p>VYDA SA est responsable du traitement des données personnelles collectées via assurance-dentaire.ch. Toute question peut être adressée à <a href="mailto:contact@vyda.ch">contact@vyda.ch</a> ou au <a href="tel:+41794809910">+41 79 480 99 10</a>.</p></section>
      <section><h2>Données concernées</h2><p>Lorsque vous envoyez une demande, nous collectons les coordonnées fournies, votre préférence de contact, les réponses du bilan, le score et ses sous-scores, les priorités identifiées, les métadonnées des documents choisis, la source UTM, le referrer, la page d’entrée et la preuve de consentement.</p></section>
      <section><h2>Bilan et documents</h2><p>La progression du bilan est conservée temporairement dans le stockage de session du navigateur. {storageConfigured ? `Les PDF que vous choisissez de transmettre sont envoyés dans un stockage privé. Ils ne disposent d’aucune URL publique permanente et sont supprimés automatiquement après ${retentionDays} jours, sauf obligation légale contraire.` : "L’envoi sécurisé de documents n’est pas encore activé sur cette version. Aucun document n’est présenté comme transmis."}</p></section>
      <section><h2>Finalité et consentement</h2><p>Les données sont utilisées pour produire le bilan demandé, comprendre votre situation, transmettre votre demande à un conseiller VYDA et organiser le suivi choisi. L’envoi exige un consentement explicite, horodaté et lié à cette finalité.</p></section>
      <section><h2>Conservation, suppression et droits</h2><p>La durée de conservation opérationnelle est configurable. Les données sont ensuite supprimées ou anonymisées, sous réserve des obligations légales. Vous pouvez demander l’accès, la rectification, la limitation ou la suppression de vos données à <a href="mailto:contact@vyda.ch">contact@vyda.ch</a>.</p></section>
      <section><h2>Services techniques et sécurité</h2><p>Le site peut utiliser un prestataire d’envoi d’e-mails, un webhook métier, Calendly et un stockage privé configuré par VYDA SA. Les journaux techniques sont limités aux identifiants de requête et au type de parcours ; ils n’incluent ni coordonnées, ni réponses du bilan, ni données médicales.</p></section>
      <section><h2>Mesure des conversions</h2><p>Lorsque le suivi Google Ads est activé, aucun outil de mesure n’est chargé avant votre consentement. Vous pouvez refuser cette mesure depuis le bandeau affiché sur le site sans perdre l’accès au service.</p></section>
      <section><h2>Mise à jour</h2><p>Dernière mise à jour : juillet 2026.</p></section>
    </LegalPage>
  );
}
