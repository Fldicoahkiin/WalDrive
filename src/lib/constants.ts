// Frontend constants — Vite reads import.meta.env.VITE_*, NOT process.env.
// (@waldrive/shared's constants read process.env for the Node/MCP runtime.)

export const CONTRACT = {
  // Defaults to the deployed testnet package so web / dev builds work without a
  // .env; override with VITE_CONTRACT_PACKAGE_ID to point at another deployment.
  PACKAGE_ID:
    import.meta.env.VITE_CONTRACT_PACKAGE_ID ??
    "0x2fc345f205e241e8941cc5228ed6dd76f11e82484b6583c4070bc63eb914b5f6",
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
