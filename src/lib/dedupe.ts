/**
 * Content-addressed upload dedupe.
 *
 * Walrus is content-addressed: identical bytes yield the same blob. Before a PUT
 * we hash the *plaintext* (SHA-256) and check a local index of hashes we've
 * already stored; on a hit we reuse the existing blobId and skip the upload
 * entirely. The hash is taken before Seal encryption so identical plaintext
 * dedupes even though encryption is non-deterministic — the index key carries
 * the encrypt flag so a plaintext and its ciphertext blob never collide.
 *
 * This is a cache: the source of truth stays Walrus (bytes) + Sui (FileRecord).
 * Losing the index only costs a re-upload, never correctness.
 */

const KEY = "waldrive:dedupe-v1";

type Entry = { blobId: string; endEpoch: number };
type Index = Record<string, Entry>;

function read(): Index {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Index) : {};
  } catch {
    return {};
  }
}

function write(idx: Index): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(idx));
  } catch {
    // localStorage full/unavailable — dedupe is a cache, losing it just re-uploads.
  }
}

/** SHA-256 of the bytes, hex. The content address used for dedupe. */
export async function contentId(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function indexKey(hash: string, encrypted: boolean): string {
  return `${hash}:${encrypted ? "enc" : "raw"}`;
}

/** Look up a previously stored blob for this plaintext hash + encrypt mode. */
export function lookupBlob(hash: string, encrypted: boolean): Entry | null {
  return read()[indexKey(hash, encrypted)] ?? null;
}

/** Record a freshly stored blob so the next identical upload reuses it. */
export function recordBlob(hash: string, encrypted: boolean, blobId: string, endEpoch: number): void {
  const idx = read();
  idx[indexKey(hash, encrypted)] = { blobId, endEpoch };
  write(idx);
}
