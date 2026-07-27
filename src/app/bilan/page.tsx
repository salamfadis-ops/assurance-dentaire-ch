import type { Metadata } from "next";
import { AssessmentWizard } from "@/components/assessment/assessment-wizard";
import { isDocumentStorageConfigured } from "@/lib/document-storage";

export const metadata: Metadata = {
  title: "Bilan Protection Dentaire gratuit",
  description: "Évaluez votre protection dentaire en 8 étapes et recevez immédiatement votre score et votre rapport personnalisé.",
  alternates: { canonical: "/bilan" },
};

export default function BilanPage() {
  return <AssessmentWizard storageConfigured={isDocumentStorageConfigured()} />;
}
