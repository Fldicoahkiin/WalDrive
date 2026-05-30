import { create } from "zustand";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { loadKeypairFromSuiPrivkey } from "@/lib/wallet";
import { WALDRIVE_KEYPAIR } from "@/lib/constants";

interface WalletState {
  keypair: Ed25519Keypair | null;
  address: string | null;
  error: string | null;
  init: () => void;
}

/**
 * Local desktop wallet. Loads the in-process Ed25519 keypair from the injected
 * suiprivkey at startup. No browser extension — the app signs transactions itself.
 */
export const useWallet = create<WalletState>((set) => ({
  keypair: null,
  address: null,
  error: null,
  init: () => {
    if (!WALDRIVE_KEYPAIR) {
      set({ error: "No wallet configured (VITE_WALDRIVE_KEYPAIR is empty)." });
      return;
    }
    try {
      const keypair = loadKeypairFromSuiPrivkey(WALDRIVE_KEYPAIR);
      set({ keypair, address: keypair.getPublicKey().toSuiAddress(), error: null });
    } catch {
      set({ error: "Failed to load wallet keypair." });
    }
  },
}));
