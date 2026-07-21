import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://assurance-dentaire.ch";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Assurance Dentaire Suisse | VYDA SA",
    template: "%s | assurance-dentaire.ch",
  },
  description:
    "Comprenez et comparez les assurances dentaires en Suisse. Orientation personnalisée, gratuite et sans engagement.",
  applicationName: "assurance-dentaire.ch",
  authors: [{ name: "VYDA SA" }],
  creator: "VYDA SA",
  publisher: "VYDA SA",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_CH",
    url: siteUrl,
    siteName: "assurance-dentaire.ch",
    title: "Assurance dentaire en Suisse, enfin claire",
    description:
      "Recevez une orientation personnalisée pour trouver une couverture dentaire adaptée à votre famille.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Assurance dentaire en Suisse, enfin claire",
    description: "Une orientation personnalisée, gratuite et sans engagement.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#176654",
  colorScheme: "light",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VYDA SA",
  url: siteUrl,
  brand: { "@type": "Brand", name: "assurance-dentaire.ch" },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "contact@assurance-dentaire.ch",
    availableLanguage: ["French"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr-CH" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
