import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { getSuiClient } from "@/lib/suiClient";
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
): Promise<{ blobId: string; endEpoch: number | null }> {
  const relay = RELAYS[network];
  if (!relay) throw new Error(`Wallet upload is not configured for ${network}.`);

  // Loaded on demand: the walrus module graph is heavy (contract bindings +
  // wasm glue) and stalls the dev module graph when imported eagerly.
  const { WalrusClient } = await import("@mysten/walrus");
  const suiClient = getSuiClient(network);
  const walrus = new WalrusClient({
    network: network as "testnet" | "mainnet",
    suiClient,
    wasmUrl: walrusWasmUrl,
    uploadRelay: {
      host: relay,
      sendTip: { max: 1_000_000 }, // ≤0.001 SUI tip to the relay
    },
  });

  const { blobId, blobObject } = await walrus.writeBlob({
    blob: bytes,
    deletable: true,
    epochs,
    signer: keypair,
  });
  const end = Number(blobObject?.storage?.end_epoch);
  return { blobId, endEpoch: Number.isFinite(end) ? end : null };
}

/** Current Walrus epoch for the network (for expiry countdowns). */
export async function getWalrusEpoch(network: SuiNetwork): Promise<number> {
  if (network !== "testnet" && network !== "mainnet") {
    throw new Error(`Walrus is not available on ${network}.`);
  }
  const { WalrusClient } = await import("@mysten/walrus");
  const suiClient = getSuiClient(network);
  const walrus = new WalrusClient({ network, suiClient, wasmUrl: walrusWasmUrl });
  const state = await walrus.systemState();
  return state.committee.epoch;
}

/** Rough epoch length for countdown copy. */
export const EPOCH_DAYS: Record<"testnet" | "mainnet", number> = { testnet: 1, mainnet: 14 };

export interface OwnedBlob {
  objectId: string;
  blobId: string;
  size: number;
  endEpoch: number;
  deletable: boolean;
}

/** Resolve the Walrus package id from the system object's type (works per network). */
async function walrusPackageId(
  suiClient: SuiJsonRpcClient,
  network: "testnet" | "mainnet",
): Promise<string> {
  const { TESTNET_WALRUS_PACKAGE_CONFIG, MAINNET_WALRUS_PACKAGE_CONFIG } = await import("@mysten/walrus");
  const systemObjectId =
    network === "mainnet"
      ? MAINNET_WALRUS_PACKAGE_CONFIG.systemObjectId
      : TESTNET_WALRUS_PACKAGE_CONFIG.systemObjectId;
  const res = await suiClient.getObject({ id: systemObjectId, options: { showType: true } });
  const type = res.data?.type;
  if (!type) throw new Error("Couldn't resolve the Walrus system object.");
  return type.split("::")[0];
}

/** The Walrus `Blob` storage objects owned by an address (what extend/delete operate on). */
export async function listOwnedBlobs(address: string, network: SuiNetwork): Promise<OwnedBlob[]> {
  if (network !== "testnet" && network !== "mainnet") return [];
  const { blobIdFromInt } = await import("@mysten/walrus");
  const suiClient = getSuiClient(network);
  const pkg = await walrusPackageId(suiClient, network);

  const blobs: OwnedBlob[] = [];
  let cursor: string | null | undefined = null;
  do {
    const page = await suiClient.getOwnedObjects({
      owner: address,
      filter: { StructType: `${pkg}::blob::Blob` },
      options: { showContent: true },
      cursor,
    });
    for (const item of page.data) {
      const content = item.data?.content;
      if (!content || content.dataType !== "moveObject") continue;
      const f = content.fields as Record<string, unknown>;
      const storage = (f.storage as { fields?: Record<string, unknown> } | undefined)?.fields ?? {};
      blobs.push({
        objectId: item.data!.objectId,
        blobId: blobIdFromInt(BigInt(String(f.blob_id ?? "0"))),
        size: Number(f.size ?? 0),
        endEpoch: Number(storage.end_epoch ?? 0),
        deletable: Boolean(f.deletable ?? false),
      });
    }
    cursor = page.hasNextPage ? page.nextCursor : null;
  } while (cursor);
  return blobs;
}

/** Extend a Blob object's storage by N epochs (pays WAL from the wallet). */
export async function extendOwnedBlob(
  blobObjectId: string,
  epochs: number,
  { keypair, network }: { keypair: Ed25519Keypair; network: SuiNetwork },
): Promise<void> {
  if (network !== "testnet" && network !== "mainnet") throw new Error(`Not available on ${network}.`);
  const { WalrusClient } = await import("@mysten/walrus");
  const suiClient = getSuiClient(network);
  const walrus = new WalrusClient({ network, suiClient, wasmUrl: walrusWasmUrl });
  await walrus.executeExtendBlobTransaction({ blobObjectId, epochs, signer: keypair });
}

/** Burn a deletable Blob object and reclaim its storage. */
export async function deleteOwnedBlob(
  blobObjectId: string,
  { keypair, network }: { keypair: Ed25519Keypair; network: SuiNetwork },
): Promise<void> {
  if (network !== "testnet" && network !== "mainnet") throw new Error(`Not available on ${network}.`);
  const { WalrusClient } = await import("@mysten/walrus");
  const suiClient = getSuiClient(network);
  const walrus = new WalrusClient({ network, suiClient, wasmUrl: walrusWasmUrl });
  await walrus.executeDeleteBlobTransaction({ blobObjectId, signer: keypair });
}
