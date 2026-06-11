import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { createSuiClient, CONTRACT } from "@waldrive/shared";
import { loadKeypair } from "./wallet";

/** Resolved runtime: Sui RPC client, signing keypair, and its address. */
export interface WalDriveContext {
  client: SuiJsonRpcClient;
  keypair: Ed25519Keypair;
  address: string;
  packageId: string;
}

let cached: WalDriveContext | undefined;

/**
 * Build (once) the shared runtime: a SuiJsonRpcClient for the configured network and
 * the signing keypair from `WALDRIVE_KEYPAIR`. Throws if the package id or
 * keypair env is missing so tools surface a descriptive error.
 */
export function getContext(): WalDriveContext {
  if (cached) return cached;

  if (!CONTRACT.PACKAGE_ID) {
    throw new Error("CONTRACT_PACKAGE_ID is not set.");
  }
  const keypair = loadKeypair();
  cached = {
    client: createSuiClient(),
    keypair,
    address: keypair.getPublicKey().toSuiAddress(),
    packageId: CONTRACT.PACKAGE_ID,
  };
  return cached;
}
