import "server-only";

export type DocumentStorageConfiguration =
  | {
      configured: true;
      mode: "read_write_token";
      auth: { token: string };
      missing: [];
    }
  | {
      configured: true;
      mode: "oidc";
      auth: { oidcToken: string; storeId: string };
      missing: [];
    }
  | {
      configured: false;
      mode: null;
      auth: null;
      missing: string[];
    };

export function getDocumentStorageConfiguration(): DocumentStorageConfiguration {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();

  if (token) {
    return { configured: true, mode: "read_write_token", auth: { token }, missing: [] };
  }

  if (oidcToken && storeId) {
    return { configured: true, mode: "oidc", auth: { oidcToken, storeId }, missing: [] };
  }

  return {
    configured: false,
    mode: null,
    auth: null,
    missing: [
      "BLOB_READ_WRITE_TOKEN",
      ...(!oidcToken ? ["VERCEL_OIDC_TOKEN"] : []),
      ...(!storeId ? ["BLOB_STORE_ID"] : []),
    ],
  };
}

export function isDocumentStorageConfigured() {
  return getDocumentStorageConfiguration().configured;
}
