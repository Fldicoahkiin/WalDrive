// Frontend constants — Vite reads import.meta.env.VITE_*, NOT process.env.
// (@waldrive/shared's constants read process.env for the Node/MCP runtime.)

export const CONTRACT = {
  // Defaults to the deployed testnet package so web / dev builds work without a
  // .env; override with VITE_CONTRACT_PACKAGE_ID to point at another deployment.
  PACKAGE_ID:
    import.meta.env.VITE_CONTRACT_PACKAGE_ID ??
    "0xf7ac2790c5fe604fdd4b7666605a7e7423cf2feb43e37564b6158d9db800ad45",
  FILE_RECORD: "file_record",
  SHARE_LINK: "share_link",
} as const;

export const WALRUS = {
  AGGREGATOR:
    import.meta.env.VITE_WALRUS_AGGREGATOR ?? "https://aggregator.walrus-testnet.walrus.space",
  PUBLISHER:
    import.meta.env.VITE_WALRUS_PUBLISHER ?? "https://publisher.walrus-testnet.walrus.space",
  // Keep blobs alive long enough that files don't silently 404 in days
  // (auto-renew before expiry is Roadmap). Was 3 — too short.
  EPOCHS_DEFAULT: 30,
} as const;

export type SuiNetwork = "mainnet" | "testnet" | "devnet" | "localnet";
export const SUI_NETWORK = (import.meta.env.VITE_SUI_NETWORK ?? "testnet") as SuiNetwork;

/** Local desktop wallet secret (suiprivkey1...). Test wallet for the hackathon. */
export const WALDRIVE_KEYPAIR = import.meta.env.VITE_WALDRIVE_KEYPAIR ?? "";

/**
 * Read-only demo wallet ADDRESS (public — no key). With no local wallet the
 * console browses this address's files, so first-time visitors (and the live
 * hero embed) land on a populated, verifiable drive instead of an empty
 * onboarding screen. Reads are wallet-free; writes prompt for a real wallet.
 */
export const DEMO_ADDRESS =
  import.meta.env.VITE_DEMO_ADDRESS ??
  "0xce98556a6a7f924b32d8f4c03ac74d60c34447cff47856402f5bbcf97393a14f";

// Runtime aggregator base. settingsStore overrides this so blobUrl() reflects the
// user's configured aggregator without threading the URL through every caller.
let aggregatorBase = WALRUS.AGGREGATOR;
export const setAggregatorBase = (url: string): void => {
  aggregatorBase = url || WALRUS.AGGREGATOR;
};

/** Public read URL for a Walrus blob via the (runtime-configured) aggregator. */
export const blobUrl = (blobId: string): string => `${aggregatorBase}/v1/blobs/${blobId}`;

/** Suiscan explorer URL for an on-chain object or transaction on the given network. */
export const explorerUrl = (kind: "object" | "tx", id: string, network: SuiNetwork): string =>
  `https://suiscan.xyz/${network}/${kind}/${id}`;
