import { create } from "zustand";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { loadKeypairFromSuiPrivkey, generateKeypair, exportSuiPrivkey } from "@/lib/wallet";
import { WALDRIVE_KEYPAIR } from "@/lib/constants";

const STORE_KEY = "waldrive-wallets";
const LEGACY_KEY = "waldrive-wallet-key";

export interface Account {
  address: string;
  secret: string;
  keypair: Ed25519Keypair;
  label?: string;
}

interface PersistedAccount {
  secret: string;
  label?: string;
}

interface Persisted {
  active: string | null;
  /** Current shape. */
  accounts?: PersistedAccount[];
  /** Pre-label shape — migrated on load. */
  secrets?: string[];
}

interface WalletState {
  accounts: Account[];
  address: string | null; // active account
  keypair: Ed25519Keypair | null; // active account
  error: string | null;
  init: () => void;
  generate: (label?: string) => void;
  importKey: (suiPrivkey: string, label?: string) => boolean;
  remove: (address: string) => void;
  switchTo: (address: string) => void;
  reveal: (address?: string) => string | null;
}

function accountFromSecret(secret: string, label?: string): Account {
  const keypair = loadKeypairFromSuiPrivkey(secret.trim());
  return {
    address: keypair.getPublicKey().toSuiAddress(),
    secret: secret.trim(),
    keypair,
    label: label?.trim() || undefined,
  };
}

function persist(accounts: Account[], active: string | null) {
  const data: Persisted = {
    active,
    accounts: accounts.map((a) => ({ secret: a.secret, label: a.label })),
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

/** localStorage (multi-account) → legacy single key → env seed → empty. */
function loadInitial(): { accounts: Account[]; active: string | null } {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw) as Persisted;
      const entries: PersistedAccount[] =
        data.accounts ?? (data.secrets ?? []).map((secret) => ({ secret }));
      const accounts = entries.flatMap((e) => {
        try {
          return [accountFromSecret(e.secret, e.label)];
        } catch {
          return [];
        }
      });
      const active = accounts.some((a) => a.address === data.active)
        ? data.active
        : (accounts[0]?.address ?? null);
      return { accounts, active };
    } catch {
      /* fall through to migration */
    }
  }
  const seed = localStorage.getItem(LEGACY_KEY) ?? (WALDRIVE_KEYPAIR || null);
  if (seed) {
    try {
      const acc = accountFromSecret(seed);
      return { accounts: [acc], active: acc.address };
    } catch {
      /* invalid seed */
    }
  }
  return { accounts: [], active: null };
}

/**
 * Local desktop wallet — multi-account. localStorage is the source of truth; the
 * env keypair seeds the first account on first run. The active account's keypair
 * signs transactions in-process (no browser extension).
 */
export const useWallet = create<WalletState>((set, get) => {
  function apply(accounts: Account[], active: string | null) {
    persist(accounts, active);
    const acc = accounts.find((a) => a.address === active) ?? null;
    set({ accounts, address: acc?.address ?? null, keypair: acc?.keypair ?? null, error: null });
  }

  return {
    accounts: [],
    address: null,
    keypair: null,
    error: null,
    init: () => {
      const { accounts, active } = loadInitial();
      apply(accounts, active);
    },
    generate: (label) => {
      const keypair = generateKeypair();
      const acc: Account = {
        address: keypair.getPublicKey().toSuiAddress(),
        secret: exportSuiPrivkey(keypair),
        keypair,
        label: label?.trim() || undefined,
      };
      apply([...get().accounts.filter((a) => a.address !== acc.address), acc], acc.address);
    },
    importKey: (suiPrivkey, label) => {
      try {
        const acc = accountFromSecret(suiPrivkey, label);
        apply([...get().accounts.filter((a) => a.address !== acc.address), acc], acc.address);
        return true;
      } catch {
        set({ error: "Invalid private key — expected a suiprivkey1… secret." });
        return false;
      }
    },
    remove: (address) => {
      const accounts = get().accounts.filter((a) => a.address !== address);
      const active = get().address === address ? (accounts[0]?.address ?? null) : get().address;
      apply(accounts, active);
    },
    switchTo: (address) => {
      if (get().accounts.some((a) => a.address === address)) apply(get().accounts, address);
    },
    reveal: (address) => {
      const target = address ?? get().address;
      return get().accounts.find((a) => a.address === target)?.secret ?? null;
    },
  };
});
