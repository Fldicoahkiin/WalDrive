---
name: waldrive
description: >-
  Store, retrieve, and verify an AI agent's own data — generated files,
  artifacts, run outputs, datasets, and cross-session memory — on Walrus
  decentralized storage, with tamper-evident content addressing and verifiable
  on-chain Sui metadata. Use this whenever an agent needs durable storage that
  outlives the current session or process: persisting memory/state between runs,
  saving a report or dataset it just produced, handing a file to a human or
  another agent by URL, fetching something stored earlier, or proving that
  stored bytes are intact and unchanged. Works through the WalDrive MCP server
  (upload_file / list_files / download_file / get_file_info) or the `waldrive`
  CLI (upload / ls / download / info). Trigger this even when the user does not
  say "WalDrive" — phrases like "save this somewhere permanent", "put it on
  Walrus", "store the agent's memory", "give me a shareable link to this file",
  "is this file still intact", or "load what we saved last run" all apply.
---

# WalDrive — verifiable storage for agent data

WalDrive lets an agent treat decentralized storage like a drive: write bytes,
get back a stable id and a public URL, list what it owns, read it back, and
**prove** the bytes are the ones it stored. It is the data layer for the things
an agent makes and remembers — not an agent itself.

## The mental model (read this first)

Two layers, one write:

1. **Bytes → Walrus blob.** The file content is uploaded to Walrus and addressed
   by a `blobId` derived from its content. Same bytes ⇒ same id. Anyone can read
   a blob by id from the public aggregator URL — **no wallet, no key**.
2. **Metadata → Sui `FileRecord`.** A small on-chain object records the blobId,
   name, mime type, size, owner, timestamp, and Walrus expiry epoch. This is the
   *verifiable* part: provenance and ownership live on a public ledger, not in a
   database you have to trust.

Why this matters for an agent: content addressing makes storage **tamper-evident**
(if a byte changes, the id changes), and on-chain metadata makes it **auditable**
(who stored what, when). That is what "verifiable data" means here.

**Cost shape, so you choose well:**
- **Reads are free and keyless.** Listing, downloading, and fetching info never
  need a wallet or gas.
- **Writes cost gas.** `upload_file` signs one Sui transaction (SUI gas) and the
  publisher fronts the Walrus storage (WAL). A signing key must be configured.
- **Small files don't save money.** Walrus erasure-codes to a ~66 MB minimum
  billed unit, so 1 KB and 1 MB cost about the same. Batch tiny artifacts (e.g.
  one JSON memory file) rather than writing hundreds of micro-blobs.
- Testnet publishers cap uploads around ~10 MiB and are rate-limited.

## Two ways to drive it — pick one

| Surface | Use when | How |
|---|---|---|
| **MCP server** (preferred) | A `waldrive` MCP server is configured in the client | Call the tools `upload_file`, `list_files`, `download_file`, `get_file_info` |
| **`waldrive` CLI** | You have a shell and the WalDrive repo / `waldrive` command | Run `waldrive upload\|ls\|download\|info` |

Prefer MCP when it is available — it is the supported agent write-path and needs
no repo checkout. Fall back to the CLI for shell-only environments, scripts, or
CI. Both go through the same upload + on-chain register, so results are identical.

If neither is available, the agent cannot write to Walrus — say so plainly and
point the user at setup (below) rather than inventing a fallback.

## Core workflows

### Store a file (write — needs a configured key)

Use this to persist anything the agent produced and wants to keep or share.

- **MCP:** `upload_file({ path: "/abs/path/to/file", name?: "display name" })`
- **CLI:** `waldrive upload /abs/path/to/file [--name "display name"]`

Returns a `blobId`, the `FileRecord` `objectId`, the tx `digest`, and a public
`url`. Keep the `objectId` if you'll want metadata later; keep the `url` to hand
to a human or another agent.

To persist data that lives in memory (a string, JSON), write it to a temp file
first, then upload that path.

### List what the agent owns (read)

- **MCP:** `list_files({ limit?: 50, folder_id?: "0x…" })`
- **CLI:** `waldrive ls [--limit 50] [--folder 0x…] [--owner 0x…] [--json]`

Returns the latest version of each file owned by the configured wallet, newest
first; trashed files and superseded versions are filtered out. Use `--json` (CLI)
for machine parsing. The CLI can list any address with `--owner` and no key.

### Read a file back (read)

By **blobId** (you have the id or the URL):
- **MCP:** `download_file({ blob_id: "…", output_path?: "/abs/out" })`
- **CLI:** `waldrive download <blobId> [--out /abs/out]`

By **objectId** (you want metadata + the URL, not the bytes):
- **MCP:** `get_file_info({ object_id: "0x…" })`
- **CLI:** `waldrive info <objectId> [--json]`

### Verify integrity (the point of "verifiable")

To prove a blob is intact and unchanged: download it and hash the bytes.
Because the `blobId` is content-derived, retrieving the same bytes from any
aggregator and confirming a stable hash is the integrity check — there is no
central server to trust. Cross-check the on-chain `FileRecord` (via
`get_file_info` / `waldrive info`) for the expected owner, size, and timestamp.

### Share a file

The public read URL **is** the share link — anyone can open it, no wallet:
`https://aggregator.walrus-testnet.walrus.space/v1/blobs/<blobId>`.
`upload_file` and `get_file_info` both return it as `url`.

## Setup & install

Install the skill into an agent's skill directory:

```bash
npx skills add Fldicoahkiin/WalDrive
```

Configure the surface you'll use:

- **MCP server** — add a `waldrive` server to the client config and set its env
  (`CONTRACT_PACKAGE_ID`, `SUI_NETWORK`, `WALRUS_AGGREGATOR`, `WALRUS_PUBLISHER`,
  and `WALDRIVE_KEYPAIR` for writes). See the WalDrive repo README → "MCP server".
- **CLI** — from a WalDrive checkout, `bun run waldrive <command>` (or run
  `bun cli/src/index.ts <command>`). Reads need only the network + endpoints;
  writes additionally need `WALDRIVE_KEYPAIR`.

**Key safety:** `WALDRIVE_KEYPAIR` is a dedicated **testnet** keypair, never one
holding real assets — an agent driving writes should not hold keys to value.
Never print the key in logs or output.

## Gotchas worth remembering

- **Testnet only** by default. Mainnet needs different contract/Walrus endpoints
  and a publisher that requires auth.
- **Expiry epochs.** A blob is retained until its Walrus expiry epoch; long-lived
  agent memory may need re-uploading before expiry (renewal is not automatic).
- **`objectId` vs `blobId`.** `blobId` addresses the bytes on Walrus (read path);
  `objectId` addresses the on-chain `FileRecord` (metadata path). `download` takes
  a blobId; `info` takes an objectId; `upload` returns both.
- **No silent fallback.** If a write fails for lack of gas or a missing key,
  report it — don't pretend the data was stored.
