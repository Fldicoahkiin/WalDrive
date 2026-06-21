import { SealClient, SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

// Testnet decentralized key server (built-in distributed trust). threshold = 1.
const TESTNET_KEY_SERVER = "0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98";
const TESTNET_AGGREGATOR = "https://seal-aggregator-testnet.mystenlabs.com";

function sealClient(suiClient: SuiJsonRpcClient): SealClient {
  return new SealClient({
    suiClient,
    serverConfigs: [{ objectId: TESTNET_KEY_SERVER, aggregatorUrl: TESTNET_AGGREGATOR, weight: 1 }],
    verifyKeyServers: false,
  });
}

/** Encrypt bytes so only `owner` can unseal them. The Seal identity is the
 *  owner's address; access is gated on chain by `waldrive::access::seal_approve`,
 *  which the key server dry-runs before releasing a key. */
export async function sealEncrypt(
  bytes: Uint8Array,
  opts: { owner: string; packageId: string; suiClient: SuiJsonRpcClient },
): Promise<Uint8Array<ArrayBuffer>> {
  const { encryptedObject } = await sealClient(opts.suiClient).encrypt({
    threshold: 1,
    packageId: opts.packageId,
    id: opts.owner,
    data: bytes,
  });
  return encryptedObject;
}

// One signed session key per (owner, package), reused until it nears expiry so
// previewing several encrypted files doesn't re-sign each time.
const sessions = new Map<string, { key: SessionKey; expiresAt: number }>();

async function ownerSession(opts: {
  owner: string;
  packageId: string;
  keypair: Ed25519Keypair;
  suiClient: SuiJsonRpcClient;
}): Promise<SessionKey> {
  const cacheKey = `${opts.owner}:${opts.packageId}`;
  const cached = sessions.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.key;

  const ttlMin = 10;
  const key = await SessionKey.create({
    address: opts.owner,
    packageId: opts.packageId,
    ttlMin,
    suiClient: opts.suiClient,
  });
  const { signature } = await opts.keypair.signPersonalMessage(key.getPersonalMessage());
  key.setPersonalMessageSignature(signature);
  sessions.set(cacheKey, { key, expiresAt: Date.now() + ttlMin * 60_000 });
  return key;
}

/** Unseal bytes previously produced by {@link sealEncrypt} for this owner. */
export async function sealDecrypt(
  encrypted: Uint8Array,
  opts: { owner: string; packageId: string; keypair: Ed25519Keypair; suiClient: SuiJsonRpcClient },
): Promise<Uint8Array<ArrayBuffer>> {
  const sessionKey = await ownerSession(opts);
  const tx = new Transaction();
  tx.moveCall({
    target: `${opts.packageId}::access::seal_approve`,
    arguments: [tx.pure.vector("u8", fromHex(opts.owner))],
  });
  const txBytes = await tx.build({ client: opts.suiClient, onlyTransactionKind: true });
  const plain = await sealClient(opts.suiClient).decrypt({ data: encrypted, sessionKey, txBytes });
  return new Uint8Array(plain); // copy into an ArrayBuffer-backed view for Blob/render
}
