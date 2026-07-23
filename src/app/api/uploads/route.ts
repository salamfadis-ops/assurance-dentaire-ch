import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { DEFAULT_DOCUMENT_MAX_FILES, documentPathname, getDocumentMaxSizeBytes, isDocumentStorageConfigured, isValidUploadSessionId, secureFilename, type DocumentCategory } from "@/lib/documents";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const issuedTokens = new Map<string, { count: number; resetAt: number }>();

function parseClientPayload(value: string | null) {
  if (!value) throw new Error("Contexte d’upload manquant");
  const parsed = JSON.parse(value) as { sessionId?: string; category?: DocumentCategory; filename?: string };
  if (!parsed.sessionId || !isValidUploadSessionId(parsed.sessionId)) throw new Error("Session d’upload invalide");
  if (parsed.category !== "contract" && parsed.category !== "quote") throw new Error("Catégorie invalide");
  if (!parsed.filename) throw new Error("Nom de fichier manquant");
  return { sessionId: parsed.sessionId, category: parsed.category, filename: secureFilename(parsed.filename) };
}

function registerUpload(sessionId: string) {
  const now = Date.now();
  const current = issuedTokens.get(sessionId);
  if (!current || current.resetAt <= now) {
    issuedTokens.set(sessionId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return;
  }
  if (current.count >= DEFAULT_DOCUMENT_MAX_FILES) throw new Error("Maximum de 5 fichiers atteint");
  current.count += 1;
}

export async function GET() {
  return NextResponse.json({
    configured: isDocumentStorageConfigured(),
    maxFiles: DEFAULT_DOCUMENT_MAX_FILES,
    maxSizeBytes: getDocumentMaxSizeBytes(),
    acceptedTypes: ["application/pdf"],
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isDocumentStorageConfigured()) {
    return NextResponse.json({ error: "L’envoi sécurisé des documents sera disponible après configuration du stockage." }, { status: 503 });
  }

  const limit = rateLimit(`upload:${clientKey(request)}`, 12, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Trop de tentatives d’upload" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }

  let body: HandleUploadBody;
  try {
    body = await request.json() as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const context = parseClientPayload(clientPayload);
        const expectedPath = documentPathname(context.sessionId, context.category, context.filename);
        if (pathname !== expectedPath) throw new Error("Chemin d’upload invalide");
        registerUpload(context.sessionId);
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: getDocumentMaxSizeBytes(),
          addRandomSuffix: true,
          allowOverwrite: false,
          cacheControlMaxAge: 60,
          tokenPayload: JSON.stringify({ sessionId: context.sessionId, category: context.category }),
        };
      },
      onUploadCompleted: async () => {
        // Aucun contenu ni nom de fichier n’est journalisé.
      },
    });
    return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Upload refusé" }, { status: 400 });
  }
}
