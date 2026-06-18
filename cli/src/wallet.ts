import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

/**
 * Load the signing keypair from the `WALDRIVE_KEYPAIR` env var (a `suiprivkey1...`
 * bech32 string). Only write commands need it — reads are wallet-free. The decoded
 * secret never appears in logs or thrown error messages.
 */
export function loadKeypair(): Ed25519Keypair {
  const raw = process.env.WALDRIVE_KEYPAIR;
  if (!raw) {
    throw new Error("WALDRIVE_KEYPAIR is not set. Provide a suiprivkey1... bech32 string.");
  }

  let secretKey: Uint8Array;
  let scheme: string;
  try {
    ({ secretKey, scheme } = decodeSuiPrivateKey(raw.trim()));
  } catch {
    throw new Error("WALDRIVE_KEYPAIR is not a valid suiprivkey1... bech32 string.");
  }
  if (scheme !== "ED25519") {
    throw new Error(`WALDRIVE_KEYPAIR must be an ED25519 key (got ${scheme}).`);
  }

  return Ed25519Keypair.fromSecretKey(secretKey);
}
