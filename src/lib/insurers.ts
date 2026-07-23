export type Insurer = {
  name: string;
  logoSrc?: string;
  logoAlt: string;
  authorizationStatus: "authorized" | "to_confirm";
};

// Les logos ne sont renseignés qu'après validation d'une source officielle et d'un droit d'utilisation.
export const insurers: Insurer[] = [
  { name: "Helsana", logoAlt: "Logo officiel Helsana", authorizationStatus: "to_confirm" },
  { name: "CSS", logoAlt: "Logo officiel CSS", authorizationStatus: "to_confirm" },
  { name: "Groupe Mutuel", logoAlt: "Logo officiel Groupe Mutuel", authorizationStatus: "to_confirm" },
  { name: "SWICA", logoAlt: "Logo officiel SWICA", authorizationStatus: "to_confirm" },
  { name: "CONCORDIA", logoAlt: "Logo officiel CONCORDIA", authorizationStatus: "to_confirm" },
  { name: "Sanitas", logoAlt: "Logo officiel Sanitas", authorizationStatus: "to_confirm" },
  { name: "Visana", logoAlt: "Logo officiel Visana", authorizationStatus: "to_confirm" },
  { name: "Assura", logoAlt: "Logo officiel Assura", authorizationStatus: "to_confirm" },
];

export const authorizedInsurers = insurers.filter(
  (insurer): insurer is Insurer & { logoSrc: string } =>
    insurer.authorizationStatus === "authorized" && Boolean(insurer.logoSrc),
);
