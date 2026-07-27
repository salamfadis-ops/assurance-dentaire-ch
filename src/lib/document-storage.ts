import "server-only";

export type DocumentStorageConfiguration =
  | {
      configured: true;
      mode: "read_write_token";
      auth: { token: string };
      missing: [];
      signals: DocumentStorageSignals;
    }
  | {
      configured: true;
      mode: "oidc_request_context";
      auth: { oidcToken?: string; storeId: string };
      missing: [];
      signals: DocumentStorageSignals;
    }
  | {
      configured: false;
      mode: null;
      auth: null;
      missing: string[];
      signals: DocumentStorageSignals;
    };

type DocumentStorageSignals = {
  readWriteToken: boolean;
  oidcEnvironmentToken: boolean;
  storeId: boolean;
  vercelRuntime: boolean;
};

export function getDocumentStorageConfiguration(): DocumentStorageConfiguration {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();
  const signals: DocumentStorageSignals = {
    readWriteToken: Boolean(token),
    oidcEnvironmentToken: Boolean(oidcToken),
    storeId: Boolean(storeId),
    vercelRuntime: process.env.VERCEL === "1",
  };

  if (token) {
    return { configured: true, mode: "read_write_token", auth: { token }, missing: [], signals };
  }

  // Sur Vercel, le jeton OIDC peut être porté par le contexte de la requête
  // plutôt que par process.env. Le SDK @vercel/blob le récupère au moment de
  // l'appel ; BLOB_STORE_ID suffit donc pour tenter l'authentification OIDC.
  if (storeId) {
    return {
      configured: true,
      mode: "oidc_request_context",
      auth: { ...(oidcToken ? { oidcToken } : {}), storeId },
      missing: [],
      signals,
    };
  }

  return {
    configured: false,
    mode: null,
    auth: null,
    missing: [
      "BLOB_READ_WRITE_TOKEN",
      "BLOB_STORE_ID",
    ],
    signals,
  };
}

export function isDocumentStorageConfigured() {
  return getDocumentStorageConfiguration().configured;
}
