import { NextResponse } from "next/server";
import { createDentalReport, type ReportFiles } from "@/lib/dental-report";
import type { AssessmentData, AssessmentResult } from "@/lib/dental-assessment";

export const runtime = "nodejs";

type ReportPayload = {
  data?: AssessmentData;
  result?: AssessmentResult;
  files?: ReportFiles;
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

  if (!payload.data || !payload.result || !payload.files || !payload.data.firstName || payload.result.score < 0 || payload.result.score > 100) {
    return NextResponse.json({ error: "Données incomplètes" }, { status: 422 });
  }

  try {
    const pdf = createDentalReport(payload.data, payload.result, payload.files);
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
