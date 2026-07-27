import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getDocumentStorageConfiguration } from "@/lib/document-storage";
import { getDocumentRetentionDays } from "@/lib/documents";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const storage = getDocumentStorageConfiguration();
  if (!storage.configured) return NextResponse.json({ deleted: 0, configured: false });

  const retentionDays = getDocumentRetentionDays();
  const threshold = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let cursor: string | undefined;
  let deleted = 0;

  do {
    console.info("blob_read_started", {
      operation: "retention_scan",
      retentionDays,
      cursorPresent: Boolean(cursor),
    });
    const page = await list({ ...storage.auth, prefix: "leads/", cursor, limit: 1000 });
    console.info("blob_read_success", {
      operation: "retention_scan",
      retentionDays,
      blobCount: page.blobs.length,
      hasMore: page.hasMore,
    });
    const expired = page.blobs.filter((blob) => new Date(blob.uploadedAt).getTime() < threshold);
    if (expired.length) {
      console.warn("blob_delete_started", {
        operation: "retention_purge",
        retentionDays,
        count: expired.length,
        pathnames: expired.slice(0, 20).map((blob) => blob.pathname),
      });
      await del(expired.map((blob) => blob.url), storage.auth);
      deleted += expired.length;
      console.info("blob_delete_success", {
        operation: "retention_purge",
        count: expired.length,
      });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return NextResponse.json({ deleted, configured: true });
}
