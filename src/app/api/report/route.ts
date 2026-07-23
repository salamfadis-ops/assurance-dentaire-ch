import { NextResponse } from "next/server";
import { createProspectReport } from "@/lib/dental-report";
import { calculateAssessment, type AssessmentData } from "@/lib/dental-assessment";
import type { AssessmentDocuments } from "@/lib/documents";

export const runtime = "nodejs";

type ReportPayload = {
  data?: AssessmentData;
  documents?: AssessmentDocuments;
};

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 50_000) return NextResponse.json({ error: "Requête trop volumineuse" }, { status: 413 });

  let payload: ReportPayload;
  try {
    payload = (await request.json()) as ReportPayload;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!payload.data || !payload.documents || !payload.data.profile || !payload.data.canton || !payload.data.needs?.length) {
    return NextResponse.json({ error: "Données incomplètes" }, { status: 422 });
  }

  try {
    const result = calculateAssessment(payload.data, payload.documents);
    const pdf = createProspectReport(payload.data, result, payload.documents);
    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=bilan-protection-dentaire.pdf",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Génération impossible" }, { status: 500 });
  }
}
