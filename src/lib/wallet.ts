import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

/**
 * Local desktop wallet — no browser extension. This app signs Sui transactions
 * with an Ed25519 keypair held in-process.
 *
 * Stub: loads a keypair from a bech32 `suiprivkey1...` secret string. Secure
 * storage of that string (OS keychain via a Tauri command, encrypted file, etc.)
 * is wired up later — this only turns the string into a usable keypair.
 */
export function loadKeypairFromSuiPrivkey(suiPrivkey: string): Ed25519Keypair {
  // Ed25519Keypair.fromSecretKey accepts the bech32 `suiprivkey1...` form directly
  // (and a raw 32-byte Uint8Array). It throws on a malformed/wrong-scheme key.
  return Ed25519Keypair.fromSecretKey(suiPrivkey);
}
