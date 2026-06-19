/**
 * Runtime-agnostic constants. Reads `NEXT_PUBLIC_*` env in the browser/Next build
 * and bare names elsewhere (MCP server) so the same module works in both runtimes.
 */

function readEnv(...keys: string[]): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env;
  if (!env) return undefined;
  for (const key of keys) {
    const value = env[key];
    if (value) return value;
  }
  return undefined;
}

export const CONTRACT = {
  PACKAGE_ID: readEnv("NEXT_PUBLIC_CONTRACT_PACKAGE_ID", "CONTRACT_PACKAGE_ID") ?? "",
  FILE_RECORD: "file_record",
  SHARE_LINK: "share_link",
} as const;

const AGGREGATOR =
  readEnv("NEXT_PUBLIC_WALRUS_AGGREGATOR", "WALRUS_AGGREGATOR") ??
  "https://aggregator.walrus-testnet.walrus.space";

const PUBLISHER =
  readEnv("NEXT_PUBLIC_WALRUS_PUBLISHER", "WALRUS_PUBLISHER") ??
  "https://publisher.walrus-testnet.walrus.space";

export const WALRUS = {
  AGGREGATOR,
  PUBLISHER,
  // Walrus drops the blob after this many epochs (FileRecord lingers). Keep it
  // long enough that files don't silently 404 in days; auto-renew is Roadmap.
  EPOCHS_DEFAULT: 30,
} as const;

export type SuiNetwork = "mainnet" | "testnet" | "devnet" | "localnet";

export const SUI_NETWORK: SuiNetwork =
  (readEnv("NEXT_PUBLIC_SUI_NETWORK", "SUI_NETWORK") as SuiNetwork | undefined) ?? "testnet";

/** Public read URL for a Walrus blob via the aggregator. */
export const blobUrl = (blobId: string): string => `${WALRUS.AGGREGATOR}/v1/blobs/${blobId}`;
