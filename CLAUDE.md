# WalDrive

A file-management UI + visual console for Walrus decentralized storage, built for the **Sui Overflow 2026 Walrus track**. The pitch is frontend interaction and fluidity.

WalDrive is a **cross-platform desktop app** (Tauri 2.0 shell + Vite/React SPA), not a web app. It signs Sui transactions in-process with a local keypair — no browser, no wallet extension.

Metadata lives **on Sui (Move objects)**, blob data lives on **Walrus**. No centralized backend.

Three pieces:
- **Desktop console** (the star) — browse / upload / preview / search / share, focused on fluid interaction
- **MCP Server** — lets developers / CLI / AI clients operate the same Walrus data from the command line
- **Move contracts** — file metadata on-chain, verifiable

> Positioning: the track theme is AI agent memory; this project **downplays agent logic** and focuses on "file-management tool + console". MCP is the developer/agent entry point but implements no agent behavior.

---

## Hackathon Context

- **Track**: Sui Overflow 2026 — Walrus track (matches official idea #32 "Walrus file-management UI").
- ⚠️ **Confirm the deadline yourself** (overflow.sui.io / HackerEarth) — public sources disagree.
- **Demo throughline** (scope is cut around this):
  ```
  Console fluidity as the main axis:
  drag to upload → file appears live → instant preview → search/filter → one-click read-only share link
  MCP as the supporting highlight: developers operate the same Walrus data via CLI/scripts
  ```
- **Scope tiers**: MVP = the minimum that supports the demo above; everything else goes to the Roadmap section, not deleted.

---

## Package Manager

**Use `bun` exclusively.** Never use npm, yarn, or pnpm.

```bash
bun install
bun dev          # Vite dev server (browser preview at :5173)
bun tauri dev    # launch the desktop window
bun build        # Vite production build (→ dist/, bundled by Tauri)
bun add <package>
bun remove <package>
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Desktop shell | **Tauri 2.0** (Rust, `src-tauri/`) — single transparent overlay window, `tauri-plugin-window-state` |
| Frontend | **Vite 6 + React 19** SPA (`src/`), single window, no router/SSR |
| Language | TypeScript (strict mode) |
| UI components | HeroUI **v3** (`@heroui/react` + `@heroui/styles`) — compound components, `onPress` |
| Styling | Tailwind CSS **v4** (CSS-first `@theme`, not `tailwind.config.ts`) |
| Motion | `motion` (framer-motion, imported as `motion/react`) |
| Theme | dark + light via `data-theme` + class on `<html>` (`src/lib/theme.ts`) |
| Walrus upload | Publisher HTTP PUT (MVP) · `@mysten/walrus` `writeFilesFlow` (Roadmap) |
| Sui wallet | **local Ed25519 keypair**, signs in-process (`src/lib/wallet.ts`) — no browser extension |
| Sui client | `@mysten/sui` |
| Global state | Zustand |
| Async / cache | TanStack React Query v5 |
| Icons | lucide-react |
| Share code generation | `nanoid` (Roadmap — MVP shares the aggregator `blobUrl`) |
| Smart contracts | Move (Sui) |
| MCP Server | `@modelcontextprotocol/sdk`, `zod` |
| Drag-to-pan (`react-grab`) | Roadmap |
| Virtual scrolling (`react-window`) | Roadmap |

---

## Architecture

```
Desktop Console (Tauri 2.0 + Vite/React)       MCP Server (local — devs / CLI / AI clients)
    │                                              │
    ├── local Ed25519 keypair (in-process)         ├── upload_file → Publisher HTTP, then sign
    │   signs metadata tx, pays SUI gas            │                 file_record::register (local keypair)
    │   — no browser wallet, no popup              ├── list_files → Sui RPC
    │                                              └── download / folder / share → Roadmap
    ├── Upload (MVP: Publisher direct)
    │   ① PUT bytes → Walrus Publisher
    │      ?epochs=N&deletable=true&send_object_to={user}
    │      · publisher fronts the WAL storage cost
    │      · blob object is sent to the user (renewable / deletable)
    │      · returns blobId (readable from aggregator immediately)
    │   ② Sui tx: file_record::register(blobId, …)
    │      signAndExecuteTransaction({ signer: keypair }) — in-process, 1 tx
    │
    ├── Read / preview
    │   └── GET aggregator /v1/blobs/{blobId}        (public, no wallet)
    │
    ├── File list
    │   └── getOwnedObjects (FileRecord type)        (Sui RPC, paginate via cursor)
    │
    └── Share
        └── copy aggregator blobUrl(blobId) to clipboard   (self-contained, no web page)
```

**Rule:** No centralized backend. The app PUTs straight to the public Walrus publisher (a local process has no CORS limits). Reads hit the aggregator directly. All persistent state lives on Sui (Move) or Walrus. The MCP Server also runs locally.

---

## Project Structure

```
waldrive/                               # bun workspaces monorepo
│
├── index.html                          # Vite SPA entry (mounts #root)
├── vite.config.ts                      # Vite + React + Tailwind v4 plugins
├── tsconfig.json
│
├── src-tauri/                          # Tauri 2.0 desktop shell (Rust)
│   ├── Cargo.toml                      # crate `waldrive_lib` + binary `waldrive`
│   ├── tauri.conf.json                 # window (transparent overlay, 1200×800), devUrl :5173, bundle
│   ├── capabilities/default.json       # window permissions
│   ├── icons/                          # app icons
│   └── src/
│       ├── main.rs                     # binary entry → waldrive_lib::run()
│       └── lib.rs                      # Tauri builder + window-state plugin (backend commands = Roadmap)
│
├── packages/
│   └── shared/                         # runtime-agnostic ONLY (browser + Node MCP):
│       └── src/                        #   constants, types, Sui/Walrus helpers. NO React code here.
│           ├── walrus.ts               # uploadBlob() Publisher PUT
│           ├── sui.ts                  # createSuiClient()
│           ├── constants.ts            # Node-side constants (read process.env)
│           ├── types.ts                # BlobFile, UploadStatus, …
│           └── index.ts                # barrel export (@waldrive/shared)
│
├── contracts/                          # Move smart contracts
│   ├── Move.toml
│   └── sources/
│       ├── file_record.move            # FileRecord (versioning/soft-delete fields = Roadmap)
│       ├── folder.move                 # Folder object (nested folders = Roadmap)
│       └── share_link.move             # ShareLink object + Registry (unused by desktop MVP — Roadmap)
│
├── src/                                # Vite/React desktop frontend (the console)
│   ├── main.tsx                        # React root + QueryClientProvider
│   ├── App.tsx                         # single-window shell: TitleBar + Sidebar + grid + PreviewModal
│   ├── globals.css                     # Tailwind + HeroUI styles, DESIGN.md palette, dark/light tokens
│   ├── vite-env.d.ts
│   │
│   ├── components/
│   │   ├── ui/Button.tsx               # custom primitive — prefer HeroUI first
│   │   ├── TitleBar.tsx                # tauri-drag-region header, wallet address, theme toggle
│   │   ├── Sidebar.tsx
│   │   ├── UploadZone.tsx              # drag-to-upload
│   │   ├── FileGrid.tsx                # motion grid (virtual scrolling = Roadmap)
│   │   └── PreviewModal.tsx            # inline preview + "copy share link" (blobUrl)
│   │
│   ├── hooks/
│   │   ├── useUpload.ts                # uploadBlob() → blobId, then in-process register
│   │   └── useFiles.ts                 # React Query: getOwnedObjects (FileRecord), cursor-paginated
│   │
│   ├── stores/
│   │   └── walletStore.ts              # Zustand: local Ed25519 keypair + address
│   │
│   ├── lib/
│   │   ├── wallet.ts                   # loadKeypairFromSuiPrivkey() — in-process signer
│   │   ├── theme.ts                    # useTheme() — dark/light via data-theme
│   │   ├── walrus.ts                   # re-export from @waldrive/shared
│   │   ├── sui.ts                      # re-export from @waldrive/shared
│   │   ├── constants.ts                # Vite constants (read import.meta.env.VITE_*)
│   │   ├── cn.ts                       # className merge
│   │   ├── fileKind.ts                 # mime/ext → icon + tag color + label; relativeTime()
│   │   └── utils.ts                    # shortenAddress(), formatBytes()
│   │
│   └── types/index.ts                  # local UI types
│
└── mcp-server/                         # MCP Server for devs / CLI / AI clients
    ├── src/
    │   ├── index.ts                    # MCP Server entry point (stdio)
    │   ├── tools/
    │   │   ├── upload.ts               # upload_file tool (MVP)
    │   │   └── list.ts                 # list_files tool (MVP)
    │   └── lib/
    │       ├── context.ts              # shared client + keypair context
    │       ├── wallet.ts               # dedicated keypair loader
    │       ├── mime.ts
    │       └── result.ts
    ├── .env.example
    ├── package.json
    └── tsconfig.json
```

---

## Environment Variables

```bash
# .env (frontend — Vite reads import.meta.env.VITE_*, NOT process.env)
VITE_CONTRACT_PACKAGE_ID=0x...
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
VITE_SUI_NETWORK=testnet
VITE_WALDRIVE_KEYPAIR=suiprivkey1...   # local desktop wallet secret (dedicated testnet keypair)

# mcp-server/.env
SUI_NETWORK=testnet
WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
CONTRACT_PACKAGE_ID=0x...
SHARE_REGISTRY_ID=0x...
WALDRIVE_KEYPAIR=suiprivkey1...        # dedicated testnet keypair for MCP signing — NOT your main keystore
```

---

## Move Contracts

> ⚠️ **DRAFT** — design sketches, not the source of truth. Once `contracts/sources/*.move` exists, the compiled code wins and this section is replaced by an interface summary. Versioning / soft-delete / tags / nested folders are **Roadmap** (kept here as the target shape, not the MVP cut).

### `Move.toml`

```toml
[package]
name = "waldrive"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "testnet" }

[addresses]
waldrive = "0x0"
```

---

### `file_record.move`

```move
module waldrive::file_record {
    use std::string::String;
    use sui::clock::{Self, Clock};

    public struct FileRecord has key, store {
        id: UID,
        blob_id: String,          // Walrus blob ID
        name: String,             // display filename
        mime_type: String,
        size: u64,                // bytes
        folder_id: Option<ID>,    // parent Folder object ID, none = root
        tags: vector<String>,
        owner: address,
        uploaded_at_ms: u64,      // unix timestamp ms from Clock
        expiry_epoch: u64,        // Walrus expiry epoch number
        is_public: bool,
        // Version management
        version: u64,             // version number (starts at 1)
        parent_version_id: Option<ID>,  // link to previous version
        // Soft delete
        is_deleted: bool,         // soft delete flag
        deleted_at_ms: Option<u64>, // deletion timestamp
    }

    public entry fun register(
        blob_id: String,
        name: String,
        mime_type: String,
        size: u64,
        expiry_epoch: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let record = FileRecord {
            id: object::new(ctx),
            blob_id,
            name,
            mime_type,
            size,
            folder_id: option::none(),
            tags: vector::empty(),
            owner: ctx.sender(),
            uploaded_at_ms: clock::timestamp_ms(clock),
            expiry_epoch,
            is_public: false,
            version: 1,
            parent_version_id: option::none(),
            is_deleted: false,
            deleted_at_ms: option::none(),
        };
        transfer::transfer(record, ctx.sender());
    }

    public entry fun rename(record: &mut FileRecord, new_name: String) {
        record.name = new_name;
    }

    public entry fun move_to_folder(record: &mut FileRecord, folder_id: ID) {
        record.folder_id = option::some(folder_id);
    }

    public entry fun remove_from_folder(record: &mut FileRecord) {
        record.folder_id = option::none();
    }

    public entry fun set_visibility(record: &mut FileRecord, is_public: bool) {
        record.is_public = is_public;
    }

    public entry fun add_tag(record: &mut FileRecord, tag: String) {
        vector::push_back(&mut record.tags, tag);
    }

    // Soft delete
    public entry fun soft_delete(record: &mut FileRecord, clock: &Clock) {
        record.is_deleted = true;
        record.deleted_at_ms = option::some(clock::timestamp_ms(clock));
    }

    // Restore from soft delete
    public entry fun restore(record: &mut FileRecord) {
        record.is_deleted = false;
        record.deleted_at_ms = option::none();
    }

    // Create new version (creates a new FileRecord linked to the old one)
    public entry fun create_version(
        old_record: &FileRecord,
        new_blob_id: String,
        new_size: u64,
        new_expiry_epoch: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let new_record = FileRecord {
            id: object::new(ctx),
            blob_id: new_blob_id,
            name: old_record.name,
            mime_type: old_record.mime_type,
            size: new_size,
            folder_id: old_record.folder_id,
            tags: old_record.tags,
            owner: ctx.sender(),
            uploaded_at_ms: clock::timestamp_ms(clock),
            expiry_epoch: new_expiry_epoch,
            is_public: old_record.is_public,
            version: old_record.version + 1,
            parent_version_id: option::some(object::id(old_record)),
            is_deleted: false,
            deleted_at_ms: option::none(),
        };
        transfer::transfer(new_record, ctx.sender());
    }
}
```

---

### `folder.move`

```move
module waldrive::folder {
    use std::string::String;
    use sui::clock::{Self, Clock};

    public struct Folder has key, store {
        id: UID,
        name: String,
        parent_id: Option<ID>,    // none = root level
        owner: address,
        created_at_ms: u64,
    }

    public entry fun create(
        name: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let folder = Folder {
            id: object::new(ctx),
            name,
            parent_id: option::none(),
            owner: ctx.sender(),
            created_at_ms: clock::timestamp_ms(clock),
        };
        transfer::transfer(folder, ctx.sender());
    }

    public entry fun create_nested(
        name: String,
        parent_id: ID,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let folder = Folder {
            id: object::new(ctx),
            name,
            parent_id: option::some(parent_id),
            owner: ctx.sender(),
            created_at_ms: clock::timestamp_ms(clock),
        };
        transfer::transfer(folder, ctx.sender());
    }

    public entry fun rename(folder: &mut Folder, new_name: String) {
        folder.name = new_name;
    }

    // Delete folder. NOTE: folder_id is a SOFT reference (just an ID); Sui does NOT
    // block deletion when children exist — this always succeeds, leaving orphans
    // (child FileRecord.folder_id points to a deleted Folder).
    // KNOWN ISSUE — cascade strategy undecided (see Roadmap "on-chain model"):
    //   (a) frontend checks emptiness before calling (chain can't enforce it)
    //   (b) one PTB processes folder + all children together
    //   (c) on delete, reset children's folder_id back to root
    public entry fun delete(folder: Folder, _ctx: &mut TxContext) {
        let Folder { id, name: _, parent_id: _, owner: _, created_at_ms: _ } = folder;
        object::delete(id);
    }
}
```

---

### `share_link.move`

```move
module waldrive::share_link {
    use std::string::String;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};

    // Registry is a singleton shared object — created once on deploy
    // Maps share_code (String) → ShareLink object ID
    public struct ShareRegistry has key {
        id: UID,
        codes: Table<String, ID>,
    }

    public struct ShareLink has key {
        id: UID,
        file_id: ID,
        share_code: String,
        blob_id: String,       // denormalized for wallet-free reads
        file_name: String,
        owner: address,
        created_at_ms: u64,
        expires_at_ms: Option<u64>,  // optional expiration time
    }

    // Called once during deployment via init
    fun init(ctx: &mut TxContext) {
        let registry = ShareRegistry {
            id: object::new(ctx),
            codes: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    public entry fun create(
        registry: &mut ShareRegistry,
        file_id: ID,
        share_code: String,
        blob_id: String,
        file_name: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let link = ShareLink {
            id: object::new(ctx),
            file_id,
            share_code: share_code,
            blob_id,
            file_name,
            owner: ctx.sender(),
            created_at_ms: clock::timestamp_ms(clock),
            expires_at_ms: option::none(),
        };
        let link_id = object::id(&link);
        table::add(&mut registry.codes, share_code, link_id);
        transfer::share_object(link);
    }

    // Create share link with expiration
    public entry fun create_with_expiry(
        registry: &mut ShareRegistry,
        file_id: ID,
        share_code: String,
        blob_id: String,
        file_name: String,
        expires_at_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let link = ShareLink {
            id: object::new(ctx),
            file_id,
            share_code: share_code,
            blob_id,
            file_name,
            owner: ctx.sender(),
            created_at_ms: clock::timestamp_ms(clock),
            expires_at_ms: option::some(expires_at_ms),
        };
        let link_id = object::id(&link);
        table::add(&mut registry.codes, share_code, link_id);
        transfer::share_object(link);
    }

    // Check if share link is expired
    public fun is_expired(link: &ShareLink, clock: &Clock): bool {
        if (option::is_none(&link.expires_at_ms)) {
            return false  // no expiration
        };
        let expires_at = *option::borrow(&link.expires_at_ms);
        clock::timestamp_ms(clock) > expires_at
    }

    // Frontend looks up objectId from registry, then fetches the ShareLink object directly
    public fun lookup(registry: &ShareRegistry, share_code: &String): &ID {
        table::borrow(&registry.codes, *share_code)
    }
}
```

> **Share link resolution flow:** Frontend generates `nanoid(8)` as `share_code`, calls `share_link::create`. To resolve `/drive/[shareCode]`, the frontend queries the `ShareRegistry` object (fixed ID from env) to get the `ShareLink` object ID, then fetches that object directly via `suiClient.getObject()`. No event scanning needed.
>
> ⚠️ **KNOWN ISSUE (undecided):** `ShareRegistry` is a singleton shared object — every `create` takes `&mut` on it, so Sui serializes them through consensus; and `table::add` aborts on a duplicate `share_code` (nanoid(8) collision is low but nonzero, and anyone can write codes). Alternatives: use the `ShareLink` objectId directly as the URL (drop the registry) / dynamic fields / an off-chain indexer. See Roadmap.

---

## Contract Constants

```ts
// src/lib/constants.ts — Vite reads import.meta.env.VITE_*, NOT process.env.
// (@waldrive/shared's constants read process.env for the Node/MCP runtime.)
export const CONTRACT = {
  PACKAGE_ID: import.meta.env.VITE_CONTRACT_PACKAGE_ID ?? '',
  FILE_RECORD: 'file_record',
  SHARE_LINK: 'share_link',
} as const;

export const WALRUS = {
  // configured explicitly — do NOT derive publisher from aggregator by string replace
  AGGREGATOR: import.meta.env.VITE_WALRUS_AGGREGATOR ?? 'https://aggregator.walrus-testnet.walrus.space',
  PUBLISHER:  import.meta.env.VITE_WALRUS_PUBLISHER ?? 'https://publisher.walrus-testnet.walrus.space',
  EPOCHS_DEFAULT: 3,
} as const;

export const SUI_NETWORK = (import.meta.env.VITE_SUI_NETWORK ?? 'testnet') as SuiNetwork;

/** Local desktop wallet secret (suiprivkey1...). */
export const WALDRIVE_KEYPAIR = import.meta.env.VITE_WALDRIVE_KEYPAIR ?? '';

// read path is /v1/blobs/{blobId} — the old /v1/{blobId} returns 404 (verified)
export const blobUrl = (blobId: string) =>
  `${WALRUS.AGGREGATOR}/v1/blobs/${blobId}`;
```

---

## Core Types

```ts
// types/index.ts
export type UploadStatus =
  | 'idle'
  | 'uploading'      // PUT bytes → Walrus publisher (returns blobId)
  | 'saving_meta'    // Sui tx: file_record::register (wallet signs, 1 tx)
  | 'done'
  | 'failed';

export interface BlobFile {
  // Sui object fields
  objectId: string;
  blobId: string;
  name: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  tags: string[];
  owner: string;
  uploadedAtMs: number;       // unix ms from Clock
  expiryEpoch: number;        // Walrus epoch number
  isPublic: boolean;
  // local UI only
  status: UploadStatus;
}

export interface SuiFolder {
  objectId: string;
  name: string;
  parentId: string | null;
  createdAtMs: number;
}

export type ViewMode = 'grid' | 'list';
```

---

## Key Behaviors

### Upload Flow — MVP: Publisher direct (2 steps)

```
① PUT bytes → Walrus Publisher
     /v1/blobs?epochs=N&deletable=true&send_object_to={userAddress}
     · publisher fronts the WAL storage cost
     · blob object goes to the user (so they can renew / delete it)
     · returns blobId — readable from the aggregator immediately (no certify wait)
② Sui tx: file_record::register(blobId, name, mime, size, expiry, clock)
     · signAndExecuteTransaction({ signer: keypair }) — in-process, no popup
     · user pays only SUI gas for this tx
```

- **Signing**: the local keypair signs in-process (`useUpload.ts`). No wallet extension, no popup.
- **Fees**: publisher covers WAL (storage); the user pays SUI gas only for step ②.
- **`deletable=true` + `send_object_to` are required** — without them the blob object stays with the publisher, and the user can neither renew nor delete their own file.
- **Constraints**: public publisher ~10 MiB cap, rate-limited, testnet free. Mainnet publishers require auth (see Roadmap).
- **Encoding floor**: Walrus erasure-codes into a ~66 MB minimum billed size, so small files cost about the same — expect this for a "many small files" drive.
- **Abstraction**: wrap as `uploadBlob(bytes) → blobId`; Publisher is the default impl. SDK `writeFilesFlow` (B) is a Roadmap impl behind the same interface.

UI: progress = uploading → saving_meta → done. Show a step indicator, never silently chain.

### Frontend Features

**MVP — fluidity is the pitch, spend the time here:**
- Live updates: after upload the file appears in the list without a manual refresh (React Query invalidate / optimistic insert)
- Instant inline preview: images / markdown / code / PDF
- Instant client-side search across loaded files (zero latency)
- Drag-to-upload with progress + optimistic "appears, then confirms on-chain"
- Skeletons, transitions, dark + light theme (DESIGN.md), polished empty states

**Roadmap — listed, not built for the demo:**
- Breadcrumb navigation (needs nested folders)
- Sorting (name / date / size / type, persisted in URL query)
- Type filtering (images / videos / docs / code / archives, toggle chips)
- Virtual scrolling (`react-window`) — only once a list grows to hundreds of items

### Reading Files

```ts
// hooks/useFiles.ts — query Sui RPC directly, no API call
const { data } = useQuery({
  queryKey: ['files', walletAddress],
  queryFn: () => suiClient.getOwnedObjects({
    owner: walletAddress,
    filter: {
      StructType: `${CONTRACT.PACKAGE_ID}::${CONTRACT.FILE_RECORD}::FileRecord`,
    },
    options: { showContent: true },
  }),
});
// NOTE:
// - getOwnedObjects returns ~50/page — paginate with cursor (hasNextPage / nextCursor)
// - is_deleted and old versions (parent_version_id chain) can't be filtered server-side;
//   pull them back and filter client-side (a Roadmap concern once counts grow)
```

### Sharing — MVP: copy the aggregator URL

The desktop app is self-contained, so there's no web share page. "Share link" in `PreviewModal` copies the public aggregator URL to the clipboard — anyone can open it, no wallet:

```ts
// src/components/PreviewModal.tsx
await navigator.clipboard.writeText(blobUrl(file.blobId));
// → https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blobId}
```

> **Roadmap** — `share_link.move` (ShareLink + ShareRegistry) and short `nanoid` share codes are kept on-chain for a future web share surface, but the desktop MVP does not call them.

### File Persistence

| Layer | What it stores | Source of truth? |
|---|---|---|
| Walrus | Raw blob bytes | ✅ immutable |
| Sui chain | FileRecord, Folder, ShareLink Move objects | ✅ yes |
| localStorage | Optimistic UI cache | ❌ always reconcile on mount |

### Status Colors

| Status | HeroUI color |
|---|---|
| `uploading` | `warning` (orange) |
| `saving_meta` | `primary` (blue) |
| `done` | `success` (green) |
| `failed` | `danger` (red) |

---

## MCP Server — AI Client Interface

MCP Server enables AI clients (Claude, Cursor, ChatGPT, Gemini, etc.) to operate Walrus files via the Model Context Protocol.

### MCP Tools

| Tool | Tier | Description | Parameters |
|------|------|-------------|------------|
| `upload_file` | **MVP** | Upload a file to Walrus and register metadata on Sui | `path: string`, `name?: string`, `folder_id?: string` |
| `list_files` | **MVP** | List all files owned by the wallet | `folder_id?: string`, `limit?: number` |
| `download_file` | Roadmap | Download a file from Walrus by blob ID | `blob_id: string`, `output_path?: string` |
| `list_folders` | Roadmap | List all folders owned by the wallet | `parent_id?: string` |
| `create_folder` | Roadmap | Create a new folder on Sui | `name: string`, `parent_id?: string` |
| `get_file_info` | Roadmap | Get detailed file metadata from Sui | `object_id: string` |
| `create_share_link` | Roadmap | Create a share link for a file | `file_id: string`, `share_code?: string` |

### MCP Server Implementation

```ts
// mcp-server/src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'waldrive',
  version: '0.1.0',
});

// Tool: upload_file
server.tool(
  'upload_file',
  'Upload a file to Walrus decentralized storage',
  {
    path: z.string().describe('Local file path to upload'),
    name: z.string().optional().describe('Display name (defaults to filename)'),
    folder_id: z.string().optional().describe('Target folder object ID'),
  },
  async ({ path, name, folder_id }) => {
    // 1. Read file bytes
    // 2. PUT bytes → Walrus Publisher (?epochs=N&deletable=true&send_object_to={addr})
    //    → blobId (no CORS / no relay needed; MCP runs locally)
    // 3. Sui tx: file_record::register(blobId, …) signed by the dedicated keypair
    return { content: [{ type: 'text', text: `Uploaded: ${blobId}` }] };
  }
);

// Tool: list_files
server.tool(
  'list_files',
  'List files owned by the connected wallet',
  {
    folder_id: z.string().optional().describe('Filter by folder ID'),
    limit: z.number().optional().describe('Max results (default 50)'),
  },
  async ({ folder_id, limit }) => {
    // Query Sui RPC: getOwnedObjects filtered by FileRecord type
    return { content: [{ type: 'text', text: JSON.stringify(files) }] };
  }
);

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
```

### MCP Client Configuration

Users add this to their MCP client config (e.g., `~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "waldrive": {
      "command": "node",
      "args": ["path/to/waldrive/mcp-server/dist/index.js"],
      "env": {
        "SUI_NETWORK": "testnet",
        "WALRUS_AGGREGATOR": "https://aggregator.walrus-testnet.walrus.space"
      }
    }
  }
}
```

### MCP Server Rules

- MCP Server runs locally, no CORS restrictions — calls the Walrus Publisher directly (no relay)
- Reuse `@waldrive/shared` utilities (walrus, sui, constants)
- Each tool must handle errors gracefully and return descriptive error messages
- Use `zod` for parameter validation
- **Wallet — dedicated testnet keypair** (`WALDRIVE_KEYPAIR` env), NOT your main `~/.sui/sui_config/sui.keystore`. A stdio process driven by an AI client must not hold keys to real assets.
- **Confirmation**: a stdio MCP server has no UI and can't pop its own dialog. "Don't auto-sign" relies on the client's *elicitation* capability; if the client lacks it, scope risk via the low-privilege keypair above and make writes explicit in tool output.
- **Security**: never expose private keys in logs or error messages

---

## HeroUI Usage

Always reach for HeroUI before writing custom components. **This project uses HeroUI v3** — do NOT apply v2 patterns:

- **No `<HeroUIProvider>`** (v2 only) — v3 needs no provider
- **Compound components**: `<Card><Card.Header><Card.Title>…`, not flat `<Card title=…>`
- **`onPress`, not `onClick`** (React Aria)
- **Tailwind v4**: `@import "tailwindcss"` then `@import "@heroui/styles"` in `src/globals.css`; theme via CSS variables + `@theme`, NOT `tailwind.config.ts`
- DESIGN.md palette is wired by overriding HeroUI's semantic vars in `src/globals.css` (`--accent: #5e6ad2`, etc.); dark is default, light flips via `[data-theme="light"]`

```tsx
// ✅ v3: compound + onPress
import { Card, Button } from '@heroui/react';
<Card isPressable isHoverable>
  <Card.Header><Card.Title>{file.name}</Card.Title></Card.Header>
</Card>
<Button color="primary" onPress={upload}>Upload</Button>
```

Component mapping:
- Upload button → `<Button color="primary" onPress>`
- Status labels → `<Chip color="warning|primary|success|danger">`
- File cards → `<Card isPressable isHoverable>` (compound)
- Loading → `<Spinner>`
- Blob ID copy → `<Tooltip content="Copied!">`
- Context menu → `<Dropdown>` + `<Dropdown.Menu>`
- Upload progress → `<Modal>`
- Grid / List toggle → `<Tabs>`

Always fetch v3 docs before implementing (heroui-react skill / `https://heroui.com/docs/react/components/{name}.mdx`).

---

## Code Style

- Functional components only, no class components
- Named exports for components and hooks
- Co-locate types with component if used only there
- Prefer `async/await` over `.then()` chains
- No `any` — use `unknown` and narrow explicitly
- Tailwind + HeroUI only — no inline styles, no CSS modules
- Keep components under 150 lines; extract hooks for logic

---

## Commands

```bash
# Frontend / desktop
bun dev           # Vite dev server — localhost:5173 (browser preview)
bun tauri dev     # launch the desktop window (runs Vite + the Rust shell)
bun build         # Vite production build → dist/
bun tauri build   # bundle the desktop app (.app / .dmg / .exe …)
bun typecheck     # tsc --noEmit
cargo build --manifest-path src-tauri/Cargo.toml   # build the Rust shell alone

# Move contracts
cd contracts
sui move build
sui move test
sui client publish --network testnet
# → copy the published package ID and ShareRegistry object ID into .env.local

# MCP Server
cd mcp-server
bun install
bun run build     # Build MCP Server
bun run dev       # Development mode with watch
```

---

## Design Skills

| Skill | Source | Purpose |
|-------|--------|---------|
| impeccable | `.agents/skills/impeccable/` | UI anti-pattern detection: `/impeccable detect src/` |
| heroui-react | `.agents/skills/heroui-react/` | HeroUI v3 component reference + scripts |
| native-feel-cross-platform-desktop | `.agents/skills/native-feel-cross-platform-desktop/` | Tauri/WebView native-feel + fluidity — directly applies (this is a Tauri desktop app) |
| Linear design | `DESIGN.md` | Dark + light design system (lavender-blue accent #5e6ad2) |

---

## Roadmap

Deferred past the hackathon MVP — kept by design, not dropped:

**Upload / Walrus**
- SDK `writeFilesFlow` (B): user-signed, self-paid WAL, fully on-chain (mainnet path); browser needs an upload relay
- Blob renewal before `expiry_epoch` (otherwise data is dropped while the FileRecord lingers)
- Mainnet publisher auth (the testnet direct-publisher path won't work as-is on mainnet)

**Contracts / on-chain model**
- Versioning: `create_version` + mark the superseded record (else both versions show in the list)
- Soft delete + trash: `is_deleted` / `restore`
- Tags: `add_tag` + a missing `remove_tag`; `move_to_folder` should validate the target is a Folder of the same owner
- Folder cascade: pick a strategy for the orphan issue (see `folder::delete`)
- ShareRegistry contention / collision: see the share_link known issue

**Frontend**
- Nested folders + breadcrumb, sort, type filter, virtual scrolling (`react-window`), drag-to-pan (`react-grab`)
- Share-link expiry / `is_public` toggle
- `getOwnedObjects` pagination; client-side filtering of soft-deleted / old versions

**MCP**
- `download_file`, `create_folder`, `list_folders`, `get_file_info`, `create_share_link`

**Design**
- Map DESIGN.md `#5e6ad2` → oklch CSS variable for HeroUI v3

---

## Notes

- **Testnet only** for now. Mainnet: update `VITE_CONTRACT_PACKAGE_ID`, Walrus URLs, and the upload path (mainnet publishers require auth — see Roadmap).
- **Read path is `/v1/blobs/{blobId}`** (verified); the old `/v1/{blobId}` returns 404.
- **Fees split**: the public publisher fronts WAL (storage); the user pays SUI gas for `file_record::register`. "Publisher free" ≠ "user pays nothing".
- **Encoding floor**: tiny files still encode to a ~66 MB minimum billed size — storing 1 KB and 1 MB costs about the same.
- `uploaded_at_ms` uses `clock::timestamp_ms(clock)` — real unix milliseconds, not a Sui epoch number.
- `expiry_epoch` is a Walrus epoch number (not time), used to show countdown in UI.
- The local keypair signs upload + register in-process — no wallet extension, no popup. Reading public blobs is wallet-free.
- Move objects are the source of truth. Never trust localStorage over what's on chain.
- Desktop MVP shares by copying the aggregator `blobUrl`. `share_link.move` / `nanoid` codes are Roadmap (a future web share surface).
- MCP Server runs locally — no CORS issues, calls the Walrus Publisher directly (no relay).
- MCP Server uses a dedicated testnet keypair, never your main keystore (see MCP Server Rules).
