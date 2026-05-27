# WalDrive

Google Drive-like file management UI for Walrus decentralized storage, built developer-first.

Metadata lives **on Sui (Move objects)**, not in any centralized database. Blob data lives on **Walrus**. The frontend is the only "app" — no traditional backend.

---

## Package Manager

**Use `bun` exclusively.** Never use npm, yarn, or pnpm.

```bash
bun install
bun dev
bun build
bun add <package>
bun remove <package>
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| UI components | HeroUI (`@heroui/react`) |
| Styling | Tailwind CSS |
| Drag interaction | `react-grab` |
| Virtual scrolling | `react-window` or `react-virtual` |
| Walrus SDK | `@mysten/walrus` |
| Sui wallet | `@mysten/dapp-kit` |
| Sui client | `@mysten/sui`, `@mysten/sui/grpc` (for Walrus SDK setup) |
| Global state | Zustand |
| Async / cache | TanStack React Query v5 |
| Icons | lucide-react |
| Share code generation | `nanoid` |
| Smart contracts | Move (Sui) |
| CORS proxy | Cloudflare Workers + Hono (upload only) |
| MCP Server | `@modelcontextprotocol/sdk`, `zod` |
| Frontend deploy | Vercel |

---

## Architecture

```
AI Clients (Claude, Cursor, ChatGPT, Gemini, etc.)
    │
    ├── MCP Protocol ─────────────────────→ MCP Server (local process)
    │                                           │
    │                                           ├── upload_file → Walrus Publisher
    │                                           ├── download_file → Walrus Aggregator
    │                                           ├── list_files → Sui RPC
    │                                           └── create_folder → Sui Move tx
    │
Browser (Next.js / Vercel)
    │
    ├── @mysten/dapp-kit ──────────────────→ Sui Wallet (sign, pay gas)
    │
    ├── Upload
    │     └── File bytes ────────────────→ CF Worker PUT /upload (CORS proxy)
    │                                           └──→ Walrus Publisher
    │                                                └── returns blobId
    │     └── Register metadata tx ──────→ Sui (Move contract)
    │              FileRecord { blobId, name, folder, tags, ... }
    │
    ├── Read / download
    │     └── GET /v1/{blobId} ───────────→ Walrus Aggregator (direct, no CORS issue)
    │
    ├── File list / folders
    │     └── getOwnedObjects ────────────→ Sui RPC (owned objects filtered by type)
    │
    └── Share link lookup
          └── share_code → objectId ──────→ Sui event index (see Share Link section)
```

**Rule:** CF Worker is stateless. It proxies raw bytes to the Walrus publisher and returns the blobId. All persistent state lives on Sui (Move) or Walrus. MCP Server runs locally and has no CORS restrictions.

---

## Project Structure

```
walrus-drive/
│
├── packages/                           # Shared packages (Monorepo)
│   └── shared/                         # Shared utilities
│       ├── src/
│       │   ├── lib/
│       │   │   ├── walrus.ts          # Walrus client
│       │   │   ├── sui.ts             # Sui client
│       │   │   └── constants.ts       # Constants
│       │   └── types/
│       │       └── index.ts           # Shared types
│       ├── package.json
│       └── tsconfig.json
│
├── contracts/                          # Move smart contracts
│   ├── Move.toml
│   └── sources/
│       ├── file_record.move            # FileRecord object (with versioning)
│       ├── folder.move                 # Folder object
│       └── share_link.move             # ShareLink object + Registry
│
├── src/                                # Next.js frontend
│   ├── app/
│   │   ├── layout.tsx                  # Root layout, wallet + query providers
│   │   ├── page.tsx                    # Landing / connect wallet
│   │   └── drive/
│   │       ├── page.tsx                # Main file manager
│   │       └── [shareCode]/
│   │           └── page.tsx            # Public share page (wallet-free read)
│   │
│   ├── components/
│   │   ├── ui/                         # Custom primitives — prefer HeroUI first
│   │   ├── drive/
│   │   │   ├── FileGrid.tsx
│   │   │   ├── FileList.tsx
│   │   │   ├── FileDetailPanel.tsx
│   │   │   ├── UploadZone.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── CodeSnippet.tsx
│   │   │   ├── BreadcrumbNav.tsx      # Breadcrumb navigation
│   │   │   └── SortFilter.tsx         # Sort and filter controls
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   └── StorageUsage.tsx
│   │   └── layout/
│   │       └── Header.tsx
│   │
│   ├── hooks/
│   │   ├── useWalrus.ts                # writeFilesFlow wrapper → blobId
│   │   ├── useFiles.ts                 # React Query: getOwnedObjects filtered by FileRecord type
│   │   ├── useFolders.ts               # React Query: getOwnedObjects filtered by Folder type
│   │   └── useDragDrop.ts              # Global drag-and-drop handler
│   │
│   ├── stores/
│   │   └── fileStore.ts                # Zustand: selected files, view mode, upload queue
│   │
│   ├── lib/
│   │   ├── walrus.ts                   # Walrus client (imports from @waldrive/shared)
│   │   ├── sui.ts                      # Sui client (imports from @waldrive/shared)
│   │   ├── constants.ts                # Constants (imports from @waldrive/shared)
│   │   └── utils.ts                    # blobUrl(), shortenAddress(), formatBytes()
│   │
│   └── types/
│       └── index.ts                    # BlobFile, UploadStatus, ViewMode, SuiFileRecord
│
├── mcp-server/                         # MCP Server for AI clients
│   ├── src/
│   │   ├── index.ts                    # MCP Server entry point
│   │   ├── tools/
│   │   │   ├── upload.ts              # upload_file tool
│   │   │   ├── download.ts            # download_file tool
│   │   │   ├── list.ts                # list_files tool
│   │   │   ├── folder.ts              # create_folder, list_folders tools
│   │   │   └── share.ts              # create_share_link tool
│   │   ├── lib/
│   │   │   ├── walrus.ts              # Walrus client (imports from @waldrive/shared)
│   │   │   ├── sui.ts                 # Sui client (imports from @waldrive/shared)
│   │   │   └── constants.ts           # Constants (imports from @waldrive/shared)
│   │   └── types/
│   │       └── index.ts               # MCP tool types
│   ├── package.json
│   └── tsconfig.json
│
└── worker/                             # Cloudflare Worker — CORS proxy only
    ├── src/
    │   └── index.ts                    # Hono: single PUT /upload route
    ├── wrangler.toml
    └── package.json
```

---

## Environment Variables

```bash
# .env.local (frontend)
NEXT_PUBLIC_CONTRACT_PACKAGE_ID=0x...
NEXT_PUBLIC_SHARE_REGISTRY_ID=0x...   # ShareRegistry shared object ID
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
NEXT_PUBLIC_WORKER_URL=https://waldrive-proxy.your-subdomain.workers.dev
NEXT_PUBLIC_SUI_NETWORK=testnet

# mcp-server/.env
SUI_NETWORK=testnet
WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
CONTRACT_PACKAGE_ID=0x...
SHARE_REGISTRY_ID=0x...

# worker — no secrets needed, it's a dumb pipe
# wrangler.toml has WALRUS_PUBLISHER env var
```

---

## Move Contracts

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

    // Delete folder (must be empty)
    // Note: In practice, the frontend should check if folder is empty before calling
    // This function will fail if the folder has children (Sui object ownership check)
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

---

## Contract Constants

```ts
// lib/constants.ts
export const CONTRACT = {
  PACKAGE_ID: process.env.NEXT_PUBLIC_CONTRACT_PACKAGE_ID!,
  SHARE_REGISTRY_ID: process.env.NEXT_PUBLIC_SHARE_REGISTRY_ID!,
  // module names
  FILE_RECORD: 'file_record',
  FOLDER: 'folder',
  SHARE_LINK: 'share_link',
} as const;

export const WALRUS = {
  PUBLISHER:  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR!.replace('aggregator', 'publisher'),
  AGGREGATOR: process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR!,
  EPOCHS_DEFAULT: 3,
} as const;

export const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL!;

export const blobUrl = (blobId: string) =>
  `${WALRUS.AGGREGATOR}/v1/${blobId}`;
```

---

## Core Types

```ts
// types/index.ts
export type UploadStatus =
  | 'idle'
  | 'encoding'
  | 'registering'    // Sui tx #1: blob register
  | 'uploading'      // bytes → Walrus
  | 'certifying'     // Sui tx #2: blob certify
  | 'saving_meta'    // Sui tx #3: FileRecord::register
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

### Upload Flow (5-step, browser wallet safe)

```
1. encode         → WalrusFile.from({ contents, identifier })
2. register       → Sui tx: blob registration        (wallet signs #1)
3. upload         → PUT bytes to CF Worker → Walrus publisher
4. certify        → Sui tx: certify blob             (wallet signs #2)
5. save_meta      → Sui tx: file_record::register()  (wallet signs #3)
```

Steps 2, 4, 5 each require a separate wallet interaction.
UI must show clear step progress — never silently chain them.
Use a step indicator component showing which of the 5 steps is active.

### Frontend Features

#### Breadcrumb Navigation
- Display current folder path: `Home > Documents > Project`
- Each segment is clickable to navigate to that folder
- Use HeroUI `Breadcrumbs` component

#### Sorting
- Support sorting by: name, date, size, type
- Default: name ascending
- Use URL query params to persist sort state
- Implement in `useFiles` hook with `sortBy` and `sortOrder` parameters

#### Type Filtering
- Filter by file type: images, videos, documents, code, archives
- Use file extension or MIME type
- Implement as toggle chips above file grid
- Combine with search and folder filtering

#### Virtual Scrolling
- Use `react-window` or `react-virtual` for large file lists
- Only render visible files (typically 20-30 items)
- Dynamic row height based on file type (grid vs list view)
- Implement in `FileGrid` and `FileList` components

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
```

### Share Link Resolution

```ts
// /drive/[shareCode]/page.tsx
// 1. Get the registry object (fixed ID)
const registry = await suiClient.getObject({
  id: CONTRACT.SHARE_REGISTRY_ID,
  options: { showContent: true },
});
// 2. Read the Table to find the ShareLink object ID for this share_code
// 3. Fetch that ShareLink object → get blob_id
// 4. Render file from Walrus aggregator directly (no wallet needed)
```

### File Persistence

| Layer | What it stores | Source of truth? |
|---|---|---|
| Walrus | Raw blob bytes | ✅ immutable |
| Sui chain | FileRecord, Folder, ShareLink Move objects | ✅ yes |
| localStorage | Optimistic UI cache | ❌ always reconcile on mount |
| CF Worker | Nothing | — stateless pipe |

### Status Colors

| Status | HeroUI color |
|---|---|
| `encoding` / `uploading` | `warning` (orange) |
| `registering` / `certifying` / `saving_meta` | `primary` (blue) |
| `done` | `success` (green) |
| `failed` | `danger` (red) |

---

## MCP Server — AI Client Interface

MCP Server enables AI clients (Claude, Cursor, ChatGPT, Gemini, etc.) to operate Walrus files via the Model Context Protocol.

### MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `upload_file` | Upload a file to Walrus and register metadata on Sui | `path: string`, `name?: string`, `folder_id?: string` |
| `download_file` | Download a file from Walrus by blob ID | `blob_id: string`, `output_path?: string` |
| `list_files` | List all files owned by the wallet | `folder_id?: string`, `limit?: number` |
| `list_folders` | List all folders owned by the wallet | `parent_id?: string` |
| `create_folder` | Create a new folder on Sui | `name: string`, `parent_id?: string` |
| `get_file_info` | Get detailed file metadata from Sui | `object_id: string` |
| `create_share_link` | Create a share link for a file | `file_id: string`, `share_code?: string` |

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
    // 2. Encode with WalrusFile.from()
    // 3. Register blob on Sui (tx #1)
    // 4. Upload bytes via CF Worker
    // 5. Certify blob on Sui (tx #2)
    // 6. Register FileRecord on Sui (tx #3)
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

- MCP Server runs locally, no CORS restrictions — can call Walrus Publisher directly
- Reuse `src/lib/` utilities where possible (walrus.ts, sui.ts, constants.ts)
- Each tool must handle errors gracefully and return descriptive error messages
- Tools that require wallet signing must prompt for confirmation (don't auto-sign)
- Use `zod` for parameter validation
- **Wallet**: Use Sui CLI wallet (`~/.sui/sui_config/sui.keystore`) for transaction signing
- **Security**: Never expose private keys in logs or error messages

---

## CF Worker — Upload Proxy Only

Single route. No KV, no DB, no state.

```ts
// worker/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';

const app = new Hono();
app.use('*', cors());

app.put('/upload', async (c) => {
  const body = await c.req.arrayBuffer();
  const epochs = c.req.query('epochs') ?? '3';

  const res = await fetch(
    `${WALRUS_PUBLISHER}/v1/blobs?epochs=${epochs}`,
    {
      method: 'PUT',
      body,
      headers: { 'Content-Type': 'application/octet-stream' },
    }
  );

  const data = await res.json();
  return c.json(data, res.status as any);
});

export default app;
```

---

## HeroUI Usage

Always reach for HeroUI before writing custom components:

```tsx
// ✅ Prefer this
import { Button, Card, Chip, Tooltip, Spinner, Modal, Tabs, Dropdown } from '@heroui/react';

// ❌ Not this — don't reinvent what HeroUI already has
const MyButton = ({ children }) => <button className="...">{children}</button>;
```

Component mapping:
- Upload button → `<Button color="primary">`
- Status labels → `<Chip color="warning|primary|success|danger">`
- File cards → `<Card isPressable isHoverable>`
- Loading → `<Spinner>`
- Blob ID copy → `<Tooltip content="Copied!">`
- Context menu → `<Dropdown>` + `<DropdownMenu>`
- Upload progress modal → `<Modal>`
- Grid / List toggle → `<Tabs>`

HeroUI is configured with Tailwind — extend via `tailwind.config.ts`, not inline overrides.

---

## react-grab Usage

Use `react-grab` for grabbable/pannable surfaces:

```tsx
import { useGrab } from 'react-grab';

const { onMouseDown } = useGrab(containerRef);
<div
  ref={containerRef}
  onMouseDown={onMouseDown}
  className="overflow-x-auto cursor-grab active:cursor-grabbing"
>
  {files.map(...)}
</div>
```

Apply to: **FileGrid** (scroll overflow), **FileDetailPanel** image preview (pan when zoomed).

Do NOT apply to clickable elements. Use `e.stopPropagation()` on interactive children inside a grab surface.

---

## Code Style

- Functional components only, no class components
- Named exports for components, default export for pages
- Co-locate types with component if used only there
- Prefer `async/await` over `.then()` chains
- No `any` — use `unknown` and narrow explicitly
- Tailwind + HeroUI only — no inline styles, no CSS modules
- Keep components under 150 lines; extract hooks for logic

---

## Commands

```bash
# Frontend
bun dev           # localhost:3000
bun build
bun lint
bun typecheck     # tsc --noEmit

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

# CF Worker (upload proxy)
cd worker
bun install
bun run dev       # wrangler dev → localhost:8787
bun run deploy    # wrangler deploy
```

---

## Design Skills

| Skill | Source | Purpose |
|-------|--------|---------|
| impeccable | `.agents/skills/impeccable/` | UI anti-pattern detection: `/impeccable detect src/` |
| heroui-react | `.agents/skills/heroui-react/` | HeroUI v3 component reference + scripts |
| Linear design | `DESIGN.md` | Dark theme design system (lavender-blue accent #5e6ad2) |

---

## Notes

- **Testnet only** for now. Mainnet: update `NEXT_PUBLIC_CONTRACT_PACKAGE_ID`, `NEXT_PUBLIC_SHARE_REGISTRY_ID`, and Walrus URLs in `.env.local`.
- `uploaded_at_ms` uses `clock::timestamp_ms(clock)` — real unix milliseconds, not Sui epoch number.
- `expiry_epoch` is a Walrus epoch number (not time), used to show countdown in UI.
- Wallet required to upload and register metadata. Reading public blobs and share links is wallet-free.
- Move objects are the source of truth. Never trust localStorage over what's on chain.
- CF Worker has no secrets, no KV bindings, no auth — it's a dumb pipe.
- `nanoid` (frontend) generates the `share_code` string before calling `share_link::create`.
- `ShareRegistry` is deployed once via `init()` — its object ID is fixed after first publish.
- MCP Server runs locally — no CORS issues, can call Walrus Publisher directly.
- MCP Server must prompt for wallet confirmation before signing transactions (never auto-sign).
- MCP Server reuses `src/lib/` utilities to avoid code duplication.
