import { head, put } from "@vercel/blob";
import { getDocumentStorageConfiguration } from "@/lib/document-storage";
import type { ValidatedLead } from "@/lib/lead-validation";

export type LeadPersistenceAttempt = {
  configured: boolean;
  saved: boolean;
  error?: "not_configured" | "write_failed";
  detail?: string;
};

function storagePath(lead: ValidatedLead) {
  const createdAt = new Date(lead.createdAt);
  const year = createdAt.getUTCFullYear();
  const month = String(createdAt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(createdAt.getUTCDate()).padStart(2, "0");
  return `leads/requests/${year}/${month}/${day}/${lead.requestId}.json`;
}

export async function persistLead(lead: ValidatedLead): Promise<LeadPersistenceAttempt> {
  const storage = getDocumentStorageConfiguration();
  if (!storage.configured) {
    return { configured: false, saved: false, error: "not_configured" };
  }

  try {
    const pathname = storagePath(lead);
    const serializedLead = JSON.stringify(lead);
    const size = Buffer.byteLength(serializedLead);
    console.info("blob_put_started", {
      operation: "lead_persistence",
      requestId: lead.requestId,
      pathname,
      size,
    });
    const blob = await put(pathname, serializedLead, {
      ...storage.auth,
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    console.info("blob_put_success", {
      operation: "lead_persistence",
      requestId: lead.requestId,
      pathname: blob.pathname,
      size,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    });
    console.info("blob_read_started", {
      operation: "lead_persistence_verification",
      requestId: lead.requestId,
      pathname: blob.pathname,
    });
    const storedBlob = await head(blob.pathname, {
      ...storage.auth,
      abortSignal: AbortSignal.timeout(10_000),
    });
    if (storedBlob.pathname !== blob.pathname || storedBlob.size !== size) {
      throw new Error("Lead blob metadata mismatch after put");
    }
    console.info("blob_read_success", {
      operation: "lead_persistence_verification",
      requestId: lead.requestId,
      pathname: storedBlob.pathname,
      size: storedBlob.size,
      url: storedBlob.url,
      downloadUrl: storedBlob.downloadUrl,
    });
    return { configured: true, saved: true };
  } catch (error) {
    console.error("blob_put_failed", {
      operation: "lead_persistence",
      requestId: lead.requestId,
      providerCode: error instanceof Error ? error.constructor.name : "unknown_error",
      message: error instanceof Error ? error.message.slice(0, 300) : "Unknown error",
    });
    return {
      configured: true,
      saved: false,
      error: "write_failed",
      detail: error instanceof Error ? error.name : "UnknownError",
    };
  }
}
