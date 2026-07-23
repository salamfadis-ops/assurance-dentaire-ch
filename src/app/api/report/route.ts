import { NextResponse } from "next/server";
import { createProspectReport, type ProspectReportIdentity } from "@/lib/dental-report";
import { calculateAssessment, type AssessmentData } from "@/lib/dental-assessment";
import type { AssessmentDocuments } from "@/lib/documents";

export const runtime = "nodejs";

type ReportPayload = {
  data?: AssessmentData;
  documents?: AssessmentDocuments;
  identity?: ProspectReportIdentity;
};

function cleanIdentity(identity?: ProspectReportIdentity): ProspectReportIdentity {
  return {
    firstName: String(identity?.firstName ?? "").trim().slice(0, 80),
    lastName: String(identity?.lastName ?? "").trim().slice(0, 80),
    reference: String(identity?.reference ?? "").trim().slice(0, 80),
  };
}

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
    const pdf = await createProspectReport(payload.data, result, payload.documents, cleanIdentity(payload.identity));
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
