import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Assurance Dentaire Suisse",
    short_name: "Assurance Dentaire",
    description: "Comprendre et comparer les assurances dentaires en Suisse.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f7f4",
    theme_color: "#176654",
    lang: "fr-CH",
  };
}
