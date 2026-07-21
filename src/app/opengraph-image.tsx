import { ImageResponse } from "next/og";

export const alt = "Assurance dentaire en Suisse — VYDA SA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ alignItems: "center", background: "#f3f7f4", color: "#102d28", display: "flex", height: "100%", justifyContent: "center", padding: "76px", width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: "1040px", width: "100%" }}>
        <div style={{ alignItems: "center", display: "flex", fontSize: 25, fontWeight: 700, letterSpacing: "-0.03em" }}>
          <span style={{ alignItems: "center", background: "#176654", borderRadius: 14, color: "white", display: "flex", fontSize: 17, height: 48, justifyContent: "center", marginRight: 16, width: 48 }}>AD</span>
          assurance-dentaire<span style={{ color: "#f36f38" }}>.ch</span>
        </div>
        <div style={{ display: "flex", fontFamily: "Georgia", fontSize: 76, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1.05, marginTop: 70 }}>
          L’assurance dentaire suisse, enfin plus claire.
        </div>
        <div style={{ color: "#526173", display: "flex", fontSize: 30, lineHeight: 1.4, marginTop: 36 }}>
          Analyse personnalisée · Gratuite · Sans engagement
        </div>
        <div style={{ color: "#176654", display: "flex", fontSize: 20, fontWeight: 700, marginTop: 56 }}>Un service proposé par VYDA SA</div>
      </div>
    </div>,
    size,
  );
}
