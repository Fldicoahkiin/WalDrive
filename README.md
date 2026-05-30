# WalDrive

> A file-management UI + visual console for **Walrus** decentralized storage, built for the **Sui Overflow 2026 Walrus track**. The pitch is frontend interaction and fluidity.

WalDrive is a **cross-platform desktop app** — a Tauri 2.0 shell wrapping a Vite + React SPA. File **metadata lives on Sui** (Move objects), **blob bytes live on Walrus**, and there is **no backend in between**. The app signs Sui transactions in-process with a local keypair (no browser, no wallet extension); the same Walrus data is also reachable from any AI client / CLI through the MCP server.

- **Desktop console** — drag-to-upload, browse, preview, search, and share files, signed by a local keypair.
- **MCP server** — `upload_file` / `list_files` for AI clients and scripts over the same Walrus data.
- **Move contracts** — `FileRecord` and `ShareLink` objects make file metadata verifiable on-chain.

---

## How it works

```
Desktop console (Tauri 2.0 + Vite/React)      MCP server (local, for devs / AI clients)
   │ local Ed25519 keypair (in-process)           │ dedicated testnet keypair
   │ — no browser wallet, no popup                 │
   ├─ Upload (2 steps)                            ├─ upload_file → publisher PUT → register
   │   ① PUT bytes → Walrus publisher             └─ list_files  → Sui RPC
   │      ?epochs=N&deletable=true&send_object_to={you}
   │      → blobId (publisher fronts the WAL cost)
   │   ② Sui tx: file_record::register(blobId, …)  ← signed in-process
   │
   ├─ Read   → GET aggregator /v1/blobs/{blobId}   (public, no wallet)
   ├─ List   → getOwnedObjects (FileRecord type)   (Sui RPC, paginated)
   └─ Share  → copy aggregator blobUrl(blobId) to clipboard   (self-contained)
```

**Upload is publisher-direct** — a local process has no CORS limits, so the app PUTs straight to the public Walrus testnet publisher; no proxy / backend. The publisher fronts the WAL storage cost and (via `send_object_to`) hands the on-chain Blob object to your local wallet, so you can renew or delete it. You pay only SUI gas for the one `register` transaction.

**Sharing is self-contained** — the desktop app has no web share page, so "Share link" copies the public aggregator URL (`/v1/blobs/{blobId}`) to the clipboard; anyone can open it, no wallet. (`share_link.move` is kept on-chain for a future web share surface — Roadmap.)

---

## Tech stack

| Layer | Choice |
|---|---|
| Desktop shell | Tauri 2.0 (Rust, `src-tauri/`) — single transparent overlay window |
| Frontend | Vite 6 + React 19, TypeScript strict (single-window SPA) |
| UI | HeroUI v3 (`@heroui/react` + `@heroui/styles`), Tailwind v4, `motion` (framer-motion) |
| Sui | `@mysten/sui` — in-process Ed25519 keypair (no wallet extension) |
| Data/cache | TanStack React Query v5 · Zustand |
| Storage | Walrus (publisher PUT, aggregator GET) |
| Contracts | Move (Sui), deployed on testnet |
| MCP | `@modelcontextprotocol/sdk`, `zod` |
| Package manager | **bun** (only) |

---

## Getting started

### Prerequisites
- [bun](https://bun.sh)
- [Rust](https://rustup.rs) + the [Tauri 2.0 system dependencies](https://tauri.app/start/prerequisites/) for your OS
- [Sui CLI](https://docs.sui.io) with a testnet address and some gas (`sui client faucet`)

### Install
```bash
bun install
```

### Deploy the contracts (or reuse the existing testnet deployment)
```bash
sui move build  --path contracts
sui client publish --gas-budget 200000000 contracts
# copy the PackageID into .env.local as VITE_CONTRACT_PACKAGE_ID
```
A testnet deployment already exists:
```
PACKAGE_ID = 0x43744366f717f6ed40d127a97db357a53a389c6b2a53d1ba1748c4f6ccf2771d
```

### Configure env
```bash
cp .env.local.example .env.local
# then set VITE_CONTRACT_PACKAGE_ID to your PackageID and
# VITE_WALDRIVE_KEYPAIR to a dedicated testnet keypair (suiprivkey1…)
```
```bash
# .env.local — Vite reads import.meta.env.VITE_*
VITE_CONTRACT_PACKAGE_ID=0x4374…2771d
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
VITE_SUI_NETWORK=testnet
VITE_WALDRIVE_KEYPAIR=suiprivkey1…   # local desktop wallet — fund it via faucet
```

### Run
```bash
bun tauri dev    # launches the desktop window (also starts Vite)
# or: bun dev    # browser preview at http://localhost:5173
```
Drag a file onto the drive to upload it — the local keypair signs in-process, no popup.

---

## MCP server

Lets AI clients (Claude, Cursor, …) and scripts operate the same Walrus data from the command line. It signs with a **dedicated testnet keypair** (`WALDRIVE_KEYPAIR`) — never your main Sui keystore. Generate one with `sui client new-address ed25519`, fund it via faucet, and export its `suiprivkey1…` string. See `mcp-server/.env.example`.

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
      "args": ["/abs/path/to/waldrive/mcp-server/src/index.ts"],
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
├── src-tauri/         # Tauri 2.0 desktop shell (Rust): main.rs, lib.rs, tauri.conf.json
├── packages/shared/   # runtime-agnostic: constants, types, Sui/Walrus helpers
├── contracts/         # Move: file_record, folder, share_link
├── src/               # Vite/React console (main.tsx, App.tsx, components, hooks, stores, lib)
└── mcp-server/        # MCP server (upload_file, list_files)
```

## Scripts
```bash
bun dev            # Vite dev server (browser preview :5173)
bun tauri dev      # launch the desktop window
bun build          # Vite production build → dist/
bun tauri build    # bundle the desktop app (.app / .dmg / .exe …)
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
- Web share surface + short share codes (`share_link.move` exists but the desktop MVP just copies the aggregator URL)
- Secure keypair storage (OS keychain via a Tauri command — currently loaded from `VITE_WALDRIVE_KEYPAIR`)
- More MCP tools: download, folders, share links

## Notes
- **Testnet only.** Mainnet needs new contract/Walrus URLs and a different upload path (mainnet publishers require auth).
- Aggregator read path is `/v1/blobs/{blobId}`.
- The publisher fronts WAL (storage); you still pay SUI gas for `register`.
- Walrus erasure-codes to a ~66 MB minimum billed size, so tiny files cost about the same.
- The app signs in-process with a **local Ed25519 keypair** — no browser wallet, no popup. Use a **dedicated testnet keypair** (`VITE_WALDRIVE_KEYPAIR`), never one holding real assets.
- Move objects are the source of truth; the UI reconciles against chain on load.
