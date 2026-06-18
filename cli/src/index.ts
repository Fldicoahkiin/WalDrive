#!/usr/bin/env bun
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { Transaction } from "@mysten/sui/transactions";
import type { SuiObjectResponse, SuiObjectChange } from "@mysten/sui/jsonRpc";
import { createSuiClient, uploadBlob, blobUrl, CONTRACT, type BlobFile } from "@waldrive/shared";
import { loadKeypair } from "./wallet";

const SUI_CLOCK_ID = "0x6";

const MIME_BY_EXT: Record<string, string> = {
  ".txt": "text/plain", ".md": "text/markdown", ".json": "application/json",
  ".js": "text/javascript", ".ts": "text/typescript", ".csv": "text/csv",
  ".html": "text/html", ".css": "text/css", ".pdf": "application/pdf",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".mp4": "video/mp4", ".zip": "application/zip",
};
const mimeFromPath = (p: string) => MIME_BY_EXT[extname(p).toLowerCase()] ?? "application/octet-stream";

/** Minimal flag parser: positionals + `--key value` / `--flag`. */
function parseArgs(argv: string[]): { positionals: string[]; flags: Record<string, string | true> } {
  const positionals: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, flags };
}

function parseFileRecord(res: SuiObjectResponse): BlobFile | null {
  const content = res.data?.content;
  if (!content || content.dataType !== "moveObject") return null;
  const f = content.fields as Record<string, unknown>;
  return {
    objectId: res.data!.objectId,
    blobId: String(f.blob_id ?? ""),
    name: String(f.name ?? ""),
    mimeType: String(f.mime_type ?? ""),
    size: Number(f.size ?? 0),
    folderId: (f.folder_id as string | null) ?? null,
    tags: Array.isArray(f.tags) ? (f.tags as string[]) : [],
    owner: String(f.owner ?? ""),
    uploadedAtMs: Number(f.uploaded_at_ms ?? 0),
    expiryEpoch: Number(f.expiry_epoch ?? 0),
    isPublic: Boolean(f.is_public ?? false),
    isDeleted: Boolean(f.is_deleted ?? false),
    version: Number(f.version ?? 1),
    parentVersionId: (f.parent_version_id as string | null) ?? null,
    status: "done",
  };
}

function requirePackageId(): string {
  if (!CONTRACT.PACKAGE_ID) throw new Error("CONTRACT_PACKAGE_ID is not set (see .env).");
  return CONTRACT.PACKAGE_ID;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${units[i]}`;
}

async function cmdUpload(positionals: string[], flags: Record<string, string | true>): Promise<void> {
  const path = positionals[0];
  if (!path) throw new Error("usage: waldrive upload <path> [--name <name>] [--epochs <n>]");
  const packageId = requirePackageId();
  const keypair = loadKeypair();
  const address = keypair.getPublicKey().toSuiAddress();
  const client = createSuiClient();

  const bytes = new Uint8Array(await readFile(path));
  const size = bytes.byteLength;
  const mime = mimeFromPath(path);
  const displayName = typeof flags.name === "string" ? flags.name : basename(path);
  const epochs = typeof flags.epochs === "string" ? Number(flags.epochs) : undefined;

  const { blobId, endEpoch } = await uploadBlob(bytes, { sendObjectTo: address, epochs });

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::${CONTRACT.FILE_RECORD}::register`,
    arguments: [
      tx.pure.string(blobId),
      tx.pure.string(displayName),
      tx.pure.string(mime),
      tx.pure.u64(BigInt(size)),
      tx.pure.u64(BigInt(endEpoch ?? 0)),
      tx.object(SUI_CLOCK_ID),
    ],
  });
  const res = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showObjectChanges: true },
  });
  const suffix = `${packageId}::${CONTRACT.FILE_RECORD}::FileRecord`;
  const created = (res.objectChanges ?? []).find(
    (c: SuiObjectChange) => c.type === "created" && c.objectType === suffix,
  );
  const objectId = created && "objectId" in created ? created.objectId : null;

  if (flags.json) {
    console.log(JSON.stringify({ name: displayName, size, mime, blobId, objectId, digest: res.digest, url: blobUrl(blobId) }, null, 2));
  } else {
    console.log(`Uploaded "${displayName}" (${formatBytes(size)}, ${mime})`);
    console.log(`  blobId:   ${blobId}`);
    console.log(`  objectId: ${objectId ?? "(not found in objectChanges)"}`);
    console.log(`  digest:   ${res.digest}`);
    console.log(`  url:      ${blobUrl(blobId)}`);
  }
}

async function cmdList(flags: Record<string, string | true>): Promise<void> {
  const packageId = requirePackageId();
  const owner =
    typeof flags.owner === "string"
      ? flags.owner
      : loadKeypair().getPublicKey().toSuiAddress();
  const client = createSuiClient();
  const structType = `${packageId}::${CONTRACT.FILE_RECORD}::FileRecord`;
  const cap = typeof flags.limit === "string" ? Number(flags.limit) : 50;
  const folderId = typeof flags.folder === "string" ? flags.folder : null;

  const all: BlobFile[] = [];
  let cursor: string | null | undefined = null;
  do {
    const page = await client.getOwnedObjects({
      owner,
      filter: { StructType: structType },
      options: { showContent: true },
      cursor,
    });
    for (const item of page.data) {
      const parsed = parseFileRecord(item);
      if (parsed) all.push(parsed);
    }
    cursor = page.hasNextPage ? page.nextCursor : null;
  } while (cursor);

  const superseded = new Set(all.map((f) => f.parentVersionId).filter(Boolean));
  const files = all
    .filter((f) => !f.isDeleted && !superseded.has(f.objectId))
    .filter((f) => (folderId ? f.folderId === folderId : true))
    .sort((a, b) => b.uploadedAtMs - a.uploadedAtMs)
    .slice(0, cap);

  if (flags.json) {
    console.log(JSON.stringify({ owner, count: files.length, files }, null, 2));
    return;
  }
  if (files.length === 0) {
    console.log(`No files for ${owner}.`);
    return;
  }
  console.log(`${files.length} file(s) for ${owner}:`);
  for (const f of files) {
    console.log(`  ${f.name}  ·  ${formatBytes(f.size)}  ·  ${f.mimeType}`);
    console.log(`    objectId ${f.objectId}`);
    console.log(`    blobId   ${f.blobId}`);
  }
}

async function cmdDownload(positionals: string[], flags: Record<string, string | true>): Promise<void> {
  const blobId = positionals[0];
  if (!blobId) throw new Error("usage: waldrive download <blobId> [--out <path>]");
  const res = await fetch(blobUrl(blobId));
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${blobId}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const out = resolve(typeof flags.out === "string" ? flags.out : `./${blobId}`);
  await writeFile(out, bytes);
  console.log(`Wrote ${bytes.length} bytes → ${out}`);
}

async function cmdInfo(positionals: string[], flags: Record<string, string | true>): Promise<void> {
  const objectId = positionals[0];
  if (!objectId) throw new Error("usage: waldrive info <objectId>");
  const client = createSuiClient();
  const res = await client.getObject({ id: objectId, options: { showContent: true } });
  const file = parseFileRecord(res);
  if (!file) throw new Error(`${objectId} is not a FileRecord object`);
  const out = { ...file, url: blobUrl(file.blobId) };
  if (flags.json) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`${file.name}  ·  ${formatBytes(file.size)}  ·  ${file.mimeType}  ·  v${file.version}`);
    console.log(`  blobId ${file.blobId}`);
    console.log(`  url    ${blobUrl(file.blobId)}`);
  }
}

const HELP = `waldrive — verifiable file storage on Walrus (CLI)

Usage:
  waldrive upload <path> [--name <name>] [--epochs <n>] [--json]
  waldrive ls [--owner <addr>] [--folder <id>] [--limit <n>] [--json]
  waldrive download <blobId> [--out <path>]
  waldrive info <objectId> [--json]

Env (see mcp-server/.env.example):
  CONTRACT_PACKAGE_ID   Sui package with the file_record module
  SUI_NETWORK           testnet (default) | mainnet | devnet
  WALRUS_AGGREGATOR     blob read endpoint (GET)
  WALRUS_PUBLISHER      blob write endpoint (PUT)
  WALDRIVE_KEYPAIR      suiprivkey1... — only writes (upload) need it; reads are wallet-free

Writes upload to Walrus + register a FileRecord on Sui; reads hit the public aggregator.`;

async function main(): Promise<void> {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const command = positionals.shift();

  if (!command || command === "help" || flags.help || flags.h) {
    console.log(HELP);
    return;
  }
  switch (command) {
    case "upload": return cmdUpload(positionals, flags);
    case "ls":
    case "list": return cmdList(flags);
    case "download":
    case "dl": return cmdDownload(positionals, flags);
    case "info": return cmdInfo(positionals, flags);
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`waldrive: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
