import { WALRUS } from "./constants";

export interface UploadBlobOptions {
  epochs?: number;
  /** Sui address that receives the on-chain Blob object the publisher mints. */
  sendObjectTo?: string;
  /** Override the Walrus publisher base URL (defaults to the env/constant). */
  publisher?: string;
  /** Abort the PUT after this many ms. */
  timeoutMs?: number;
  /** Bearer token for publishers that require auth (mainnet publishers). */
  authToken?: string;
}

/** Walrus publisher `PUT /v1/blobs` response. Exactly one branch is present. */
interface PublisherResponse {
  newlyCreated?: { blobObject?: { blobId?: unknown; storage?: { endEpoch?: unknown } } };
  alreadyCertified?: { blobId?: unknown; endEpoch?: unknown };
}

export interface StoredBlob {
  blobId: string;
  /** Walrus epoch after which the blob may be dropped (real epoch number, not a duration). */
  endEpoch: number | null;
}

function extractStoredBlob(payload: unknown): StoredBlob {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Walrus publisher returned a non-object response");
  }
  const res = payload as PublisherResponse;
  const created = res.newlyCreated?.blobObject;
  if (typeof created?.blobId === "string") {
    const end = created.storage?.endEpoch;
    return { blobId: created.blobId, endEpoch: typeof end === "number" ? end : null };
  }
  const certified = res.alreadyCertified;
  if (typeof certified?.blobId === "string") {
    return {
      blobId: certified.blobId,
      endEpoch: typeof certified.endEpoch === "number" ? certified.endEpoch : null,
    };
  }
  throw new Error("Walrus publisher response missing blobId");
}

/**
 * Upload raw bytes to the Walrus publisher and return the stored blob's id and
 * real expiry epoch. Stores the blob as `deletable` and optionally transfers
 * the minted Blob object to `sendObjectTo` so the wallet owner controls it.
 */
export async function uploadBlob(bytes: Uint8Array, options: UploadBlobOptions = {}): Promise<StoredBlob> {
  const epochs = options.epochs ?? WALRUS.EPOCHS_DEFAULT;
  const base = options.publisher || WALRUS.PUBLISHER;
  const params = new URLSearchParams({ epochs: String(epochs), deletable: "true" });
  if (options.sendObjectTo) params.set("send_object_to", options.sendObjectTo);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 60_000);
  try {
    const res = await fetch(`${base}/v1/blobs?${params.toString()}`, {
      method: "PUT",
      body: bytes as BodyInit,
      headers: options.authToken ? { Authorization: `Bearer ${options.authToken}` } : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Walrus publisher PUT failed: ${res.status} ${res.statusText}`);
    }
    return extractStoredBlob(await res.json());
  } finally {
    clearTimeout(timeout);
  }
}
