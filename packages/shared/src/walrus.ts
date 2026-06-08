import { WALRUS } from "./constants";

export interface UploadBlobOptions {
  epochs?: number;
  /** Sui address that receives the on-chain Blob object the publisher mints. */
  sendObjectTo?: string;
  /** Override the Walrus publisher base URL (defaults to the env/constant). */
  publisher?: string;
  /** Abort the PUT after this many ms. */
  timeoutMs?: number;
}

/** Walrus publisher `PUT /v1/blobs` response. Exactly one branch is present. */
interface PublisherResponse {
  newlyCreated?: { blobObject?: { blobId?: unknown } };
  alreadyCertified?: { blobId?: unknown };
}

function extractBlobId(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Walrus publisher returned a non-object response");
  }
  const res = payload as PublisherResponse;
  const created = res.newlyCreated?.blobObject?.blobId;
  if (typeof created === "string") return created;
  const certified = res.alreadyCertified?.blobId;
  if (typeof certified === "string") return certified;
  throw new Error("Walrus publisher response missing blobId");
}

/**
 * Upload raw bytes to the Walrus publisher and return the resulting blobId.
 * Stores the blob as `deletable` and optionally transfers the minted Blob object
 * to `sendObjectTo` so the wallet owner controls it.
 */
export async function uploadBlob(bytes: Uint8Array, options: UploadBlobOptions = {}): Promise<string> {
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
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Walrus publisher PUT failed: ${res.status} ${res.statusText}`);
    }
    return extractBlobId(await res.json());
  } finally {
    clearTimeout(timeout);
  }
}
