import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
// Vite swallows the SDK's own import.meta.url wasm reference during dep
// optimization (the request 404s into the SPA fallback), so resolve it
// explicitly and hand it to the client.
import walrusWasmUrl from "@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import type { SuiNetwork } from "@/lib/constants";

/** Public upload relay — browsers/WebViews can't reach storage nodes directly. */
const RELAYS: Partial<Record<SuiNetwork, string>> = {
  testnet: "https://upload-relay.testnet.walrus.space",
  mainnet: "https://upload-relay.mainnet.walrus.space",
};

export interface WalletUploadOptions {
  keypair: Ed25519Keypair;
  network: SuiNetwork;
  epochs: number;
}

/**
 * Self-custodial upload path: encode the blob locally with the Walrus SDK and
 * pay for storage from the user's own wallet (WAL for storage, SUI for gas and
 * the relay tip). The blob object lands in the wallet, deletable and renewable.
 */
export async function uploadBlobWithWallet(
  bytes: Uint8Array,
  { keypair, network, epochs }: WalletUploadOptions,
): Promise<string> {
  const relay = RELAYS[network];
  if (!relay) throw new Error(`Wallet upload is not configured for ${network}.`);

  // Loaded on demand: the walrus module graph is heavy (contract bindings +
  // wasm glue) and stalls the dev module graph when imported eagerly.
  const { WalrusClient } = await import("@mysten/walrus");
  const suiClient = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl(network), network });
  const walrus = new WalrusClient({
    network: network as "testnet" | "mainnet",
    suiClient,
    wasmUrl: walrusWasmUrl,
    uploadRelay: {
      host: relay,
      sendTip: { max: 1_000_000 }, // ≤0.001 SUI tip to the relay
    },
  });

  const { blobId } = await walrus.writeBlob({
    blob: bytes,
    deletable: true,
    epochs,
    signer: keypair,
  });
  return blobId;
}
