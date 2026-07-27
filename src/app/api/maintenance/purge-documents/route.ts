import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isDocumentStorageConfigured } from "@/lib/document-storage";
import { getDocumentRetentionDays } from "@/lib/documents";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!isDocumentStorageConfigured()) return NextResponse.json({ deleted: 0, configured: false });

  const threshold = Date.now() - getDocumentRetentionDays() * 24 * 60 * 60 * 1000;
  let cursor: string | undefined;
  let deleted = 0;

  do {
    const page = await list({ prefix: "leads/", cursor, limit: 1000 });
    const expired = page.blobs.filter((blob) => new Date(blob.uploadedAt).getTime() < threshold);
    if (expired.length) {
      await del(expired.map((blob) => blob.url));
      deleted += expired.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return NextResponse.json({ deleted, configured: true });
}
