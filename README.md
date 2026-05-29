# WalDrive

> A file-management UI + visual console for **Walrus** decentralized storage, built for the **Sui Overflow 2026 Walrus track**. The pitch is frontend interaction and fluidity.

File **metadata lives on Sui** (Move objects), **blob bytes live on Walrus**, and there is **no backend in between**. Upload from the browser (wallet-signed) or from any AI client / CLI through the MCP server.

- **Web console** — connect a Sui wallet, drag-to-upload, browse, preview, search, and share files.
- **MCP server** — `upload_file` / `list_files` for AI clients and scripts over the same Walrus data.
- **Move contracts** — `FileRecord` and `ShareLink` objects make file metadata verifiable on-chain.

---

## How it works

```
Browser console (Next.js)                     MCP server (local, for devs / AI clients)
   │ @mysten/dapp-kit → Sui Wallet                │ dedicated testnet keypair
   │                                              │
   ├─ Upload (2 steps)                            ├─ upload_file → publisher PUT → register
   │   ① PUT bytes → Walrus publisher             └─ list_files  → Sui RPC
   │      ?epochs=N&deletable=true&send_object_to={you}
   │      → blobId (publisher fronts the WAL cost)
   │   ② Sui tx: file_record::register(blobId, …)  ← one wallet signature
   │
   ├─ Read   → GET aggregator /v1/blobs/{blobId}   (public, no wallet)
   ├─ List   → getOwnedObjects (FileRecord type)   (Sui RPC, paginated)
   └─ Share  → share_link::create → /drive/{ShareLink objectId}   (wallet-free read)
```

**Upload is publisher-direct** — the public Walrus testnet publisher serves CORS `*`, so the browser PUTs straight to it; no CORS proxy / backend. The publisher fronts the WAL storage cost and (via `send_object_to`) hands the on-chain Blob object to your wallet, so you can renew or delete it. You pay only SUI gas for the one `register` transaction.

**Sharing has no registry** — a `ShareLink` object's own id *is* the share URL (`/drive/{objectId}`). The public page resolves it with a single `getObject` and renders from the aggregator, no wallet required.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript strict |
| UI | HeroUI v3 (`@heroui/react` + `@heroui/styles`), Tailwind v4 |
| Sui | `@mysten/dapp-kit`, `@mysten/sui` |
| Data/cache | TanStack React Query v5 · Zustand |
| Storage | Walrus (publisher PUT, aggregator GET) |
| Contracts | Move (Sui), deployed on testnet |
| MCP | `@modelcontextprotocol/sdk`, `zod` |
| Package manager | **bun** (only) |

---

## Getting started

### Prerequisites
- [bun](https://bun.sh)
- [Sui CLI](https://docs.sui.io) with a testnet address and some gas (`sui client faucet`)

### Install
```bash
bun install
```

### Deploy the contracts (or reuse the existing testnet deployment)
```bash
sui move build  --path contracts
sui client publish --gas-budget 200000000 contracts
# copy the PackageID into .env.local
```
A testnet deployment already exists:
```
PACKAGE_ID = 0x43744366f717f6ed40d127a97db357a53a389c6b2a53d1ba1748c4f6ccf2771d
```

### Configure env
```bash
cp .env.local.example .env.local
# then set NEXT_PUBLIC_CONTRACT_PACKAGE_ID to your PackageID
```
```bash
NEXT_PUBLIC_CONTRACT_PACKAGE_ID=0x4374…2771d
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
NEXT_PUBLIC_SUI_NETWORK=testnet
```

### Run
```bash
bun dev        # http://localhost:3000
```
Connect a Sui wallet, then drag a file onto the drive to upload it.

---

## MCP server

Lets AI clients (Claude, Cursor, …) and scripts operate the same Walrus data from the command line. It signs with a **dedicated testnet keypair** (`WALDRIVE_KEYPAIR`) — never your main Sui keystore.

| Tool | Description |
|---|---|
| `upload_file` | Upload a local file to Walrus and register its metadata on Sui |
| `list_files` | List FileRecord objects owned by the configured keypair |

Client config (e.g. `~/.claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "waldrive": {
      "command": "bun",
      "args": ["run", "/abs/path/to/waldrive/mcp-server/src/index.ts"],
      "env": {
        "SUI_NETWORK": "testnet",
        "CONTRACT_PACKAGE_ID": "0x4374…2771d",
        "WALRUS_AGGREGATOR": "https://aggregator.walrus-testnet.walrus.space",
        "WALRUS_PUBLISHER": "https://publisher.walrus-testnet.walrus.space",
        "WALDRIVE_KEYPAIR": "suiprivkey1…"
      }
    }
  }
}
```

---

## Project structure

```
waldrive/
├── packages/shared/   # runtime-agnostic: constants, types, Sui/Walrus clients
├── contracts/         # Move: file_record, share_link
├── src/               # Next.js console (app/, components/drive, hooks, stores)
└── mcp-server/        # MCP server (upload_file, list_files)
```

## Scripts
```bash
bun dev            # console dev server
bun build          # production build
bun lint           # eslint
bun typecheck      # tsc --noEmit
sui move build --path contracts   # build contracts
```

---

## Roadmap

Deferred past the hackathon MVP (kept by design):

- SDK `writeFilesFlow` upload (user-paid WAL, fully on-chain) for mainnet
- Blob renewal before expiry; mainnet publisher auth
- Versioning, soft-delete + trash, tags, nested folders + breadcrumb
- Sort / type filter / virtual scrolling; share-link expiry
- Short share codes via an off-chain indexer (not an on-chain registry)
- More MCP tools: download, folders, share links

## Notes
- **Testnet only.** Mainnet needs new contract/Walrus URLs and a different upload path (mainnet publishers require auth).
- Aggregator read path is `/v1/blobs/{blobId}`.
- The publisher fronts WAL (storage); you still pay SUI gas for `register`.
- Walrus erasure-codes to a ~66 MB minimum billed size, so tiny files cost about the same.
- Move objects are the source of truth; the UI reconciles against chain on load.
