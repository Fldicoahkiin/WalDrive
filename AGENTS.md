# WALDRIVE KNOWLEDGE BASE

## OVERVIEW

WalDrive — a file-management UI + visual console for Walrus decentralized storage, built for the **Sui Overflow 2026 Walrus track**. Pitch: frontend fluidity. **Cross-platform desktop app**: Tauri 2.0 (Rust shell, `src-tauri/`) + Vite + React 19 + TypeScript + HeroUI v3 + Tailwind v4 + motion. Single-window SPA, no web/SSR. Signs Sui txs in-process with a local Ed25519 keypair (no browser wallet). Metadata on Sui (Move objects), blobs on Walrus, no centralized backend. MCP Server is the dev/CLI entry point. Agent logic is downplayed.

## STRUCTURE

```
waldrive/                # bun workspaces monorepo
├── index.html           # Vite SPA entry
├── src-tauri/           # Tauri 2.0 desktop shell (Rust): main.rs, lib.rs, tauri.conf.json
├── packages/shared/     # runtime-agnostic: constants, types, Sui/Walrus helpers
├── contracts/           # Move smart contracts (file_record, folder, share_link)
├── src/                 # Vite/React desktop frontend (the console)
│   ├── main.tsx App.tsx # React root + single-window shell (no router)
│   ├── components/      # Sidebar (source list), ThemeToggle, UploadZone, FileGrid/FileList, PreviewModal+SettingsModal (HeroUI Modal), WalletPanel, Onboarding, EmptyState, ui/
│   ├── hooks/           # useUpload, useFiles, useBalance, useRename, useDelete
│   ├── stores/          # Zustand: walletStore (keypair, generate/import), settingsStore (network/endpoints/epochs/contract, persisted)
│   └── lib/             # wallet, theme, constants (VITE_*), re-exports from @waldrive/shared
└── mcp-server/          # MCP Server for devs / CLI / AI clients
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Desktop shell / window | `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json` | transparent overlay window; backend commands = Roadmap |
| Wallet (signer) | `src/stores/walletStore.ts`, `src/lib/wallet.ts` | local Ed25519 keypair; generate/import in-app, kept in localStorage (env `VITE_WALDRIVE_KEYPAIR` seeds first run) |
| Settings / config | `src/components/SettingsModal.tsx`, `src/stores/settingsStore.ts` | HeroUI Modal: network/endpoints/epochs/contract editable + persisted; embeds WalletPanel |
| Theme (dark/light) | `src/lib/theme.ts` | Zustand store; `data-theme` + class on `<html>` |
| File metadata | `contracts/sources/file_record.move` | FileRecord (versioning/soft-delete = Roadmap) |
| Folder hierarchy | `contracts/sources/folder.move` | Folder (nested = Roadmap; delete has orphan issue) |
| Share links (contract) | `contracts/sources/share_link.move` | ShareLink + ShareRegistry — unused by desktop MVP (Roadmap) |
| Upload flow | `src/hooks/useUpload.ts` | MVP 2-step: PUT publisher → in-process file_record::register |
| File listing | `src/hooks/useFiles.ts` | React Query: getOwnedObjects (FileRecord), paginate via cursor |
| File grid | `src/components/FileGrid.tsx` | motion grid; virtual scrolling = Roadmap |
| Preview / share | `src/components/PreviewModal.tsx` | HeroUI Modal: preview + rename + delete (AlertDialog) + copy aggregator `blobUrl` |
| `blobUrl()` / read URL | `src/lib/constants.ts` | aggregator `/v1/blobs/{blobId}` |
| MCP tools | `mcp-server/src/tools/` | upload + list (MVP); rest Roadmap |

## CONVENTIONS

- **bun only** — never npm/yarn/pnpm
- **HeroUI v3 first** — compound components, `onPress`; Tailwind v4 (`@theme`, no `tailwind.config.ts`)
- **Tailwind + HeroUI** — no inline styles, no CSS modules
- **Functional components** — no class components
- **No `any`** — use `unknown` and narrow explicitly
- **Components < 150 lines** — extract hooks for logic

## DESIGN

- Dark + light theme, lavender-blue accent `#5e6ad2` (HeroUI semantic vars in `src/globals.css`) — see `DESIGN.md`
- HeroUI v3 component reference — `.agents/skills/heroui-react/SKILL.md`
- Native-feel / fluidity (Tauri WebView) — `.agents/skills/native-feel-cross-platform-desktop/`
- Anti-pattern detection — `/impeccable detect src/`

## ANTI-PATTERNS

- No `npm`/`yarn`/`pnpm` — bun only
- No class components — functional only
- No `any` type — use `unknown` and narrow
- No inline styles — Tailwind + HeroUI only
- No CSS modules
- No components > 150 lines — extract hooks
- No `const renderXxx = () => <JSX/>` inside component bodies
- No array index as list keys — use semantic unique values
- No CF Worker / no centralized backend — the desktop app PUTs straight to the public publisher
- No browser wallet / dapp-kit — the app signs in-process with the local keypair

## COMMANDS

```bash
bun dev              # Vite dev server (browser preview :5173)
bun tauri dev        # launch the desktop window
bun build            # Vite production build → dist/
bun tauri build      # bundle the desktop app
bun typecheck        # tsc --noEmit
sui move build       # Build Move contracts
sui move test        # Test Move contracts
cd mcp-server && bun run build  # Build MCP Server
```
