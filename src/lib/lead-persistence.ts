import { put } from "@vercel/blob";
import { isDocumentStorageConfigured } from "@/lib/documents";
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
  if (!isDocumentStorageConfigured()) {
    return { configured: false, saved: false, error: "not_configured" };
  }

  try {
    await put(storagePath(lead), JSON.stringify(lead), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return { configured: true, saved: true };
  } catch (error) {
    return {
      configured: true,
      saved: false,
      error: "write_failed",
      detail: error instanceof Error ? error.name : "UnknownError",
    };
  }
}
