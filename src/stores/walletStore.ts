import { create } from "zustand";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { loadKeypairFromSuiPrivkey, generateKeypair, exportSuiPrivkey } from "@/lib/wallet";
import { WALDRIVE_KEYPAIR } from "@/lib/constants";

const STORAGE_KEY = "waldrive-wallet-key";

interface WalletState {
  keypair: Ed25519Keypair | null;
  address: string | null;
  error: string | null;
  init: () => void;
  generate: () => void;
  importKey: (suiPrivkey: string) => boolean;
  remove: () => void;
  reveal: () => string | null;
}

function derive(secret: string): { keypair: Ed25519Keypair; address: string } {
  const keypair = loadKeypairFromSuiPrivkey(secret);
  return { keypair, address: keypair.getPublicKey().toSuiAddress() };
}

/**
 * Local desktop wallet. localStorage is the source of truth; the env keypair
 * seeds it once on first run (so it becomes editable, not baked into the build).
 * The app signs transactions in-process — no browser extension.
 */
export const useWallet = create<WalletState>((set, get) => ({
  keypair: null,
  address: null,
  error: null,
  init: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const secret = stored ?? (WALDRIVE_KEYPAIR || null);
    if (!secret) {
      set({ keypair: null, address: null, error: null });
      return;
    }
    if (!stored) localStorage.setItem(STORAGE_KEY, secret); // migrate the env seed so it's manageable
    try {
      set({ ...derive(secret), error: null });
    } catch {
      set({ keypair: null, address: null, error: "Stored wallet key is invalid." });
    }
  },
  generate: () => {
    const keypair = generateKeypair();
    localStorage.setItem(STORAGE_KEY, exportSuiPrivkey(keypair));
    set({ keypair, address: keypair.getPublicKey().toSuiAddress(), error: null });
  },
  importKey: (suiPrivkey) => {
    const secret = suiPrivkey.trim();
    try {
      const next = derive(secret);
      localStorage.setItem(STORAGE_KEY, secret);
      set({ ...next, error: null });
      return true;
    } catch {
      set({ error: "Invalid private key — expected a suiprivkey1… secret." });
      return false;
    }
  },
  remove: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ keypair: null, address: null, error: null });
  },
  reveal: () => {
    const keypair = get().keypair;
    return keypair ? exportSuiPrivkey(keypair) : null;
  },
}));
