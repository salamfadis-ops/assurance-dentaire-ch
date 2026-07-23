export type Insurer = {
  name: string;
  logoSrc?: string;
  logoAlt: string;
};

// Les logos ne sont renseignés qu'après validation d'une source officielle et d'un droit d'utilisation.
export const insurers: Insurer[] = [
  { name: "Helsana", logoAlt: "Logo Helsana" },
  { name: "Groupe Mutuel", logoAlt: "Logo Groupe Mutuel" },
  { name: "Assura", logoAlt: "Logo Assura" },
  { name: "SWICA", logoAlt: "Logo SWICA" },
  { name: "CSS", logoAlt: "Logo CSS" },
  { name: "Concordia", logoAlt: "Logo Concordia" },
  { name: "Sanitas", logoAlt: "Logo Sanitas" },
  { name: "Visana", logoAlt: "Logo Visana" },
];
