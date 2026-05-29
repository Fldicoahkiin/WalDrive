# WALDRIVE KNOWLEDGE BASE

## OVERVIEW

WalDrive — a file-management UI + visual console for Walrus decentralized storage, built for the **Sui Overflow 2026 Walrus track**. Pitch: frontend fluidity. Next.js (App Router) + TypeScript + HeroUI v3 + Tailwind v4. Metadata on Sui (Move objects), blobs on Walrus, no centralized backend. MCP Server is the dev/CLI entry point. Agent logic is downplayed.

## STRUCTURE

```
waldrive/                # bun workspaces monorepo
├── packages/shared/     # runtime-agnostic: constants, types, Sui/Walrus client factories
├── contracts/           # Move smart contracts (file_record, folder, share_link)
├── src/                 # Next.js frontend (the console)
│   ├── app/             # App Router pages (drive/, drive/[shareCode])
│   ├── components/      # UI (drive/, sidebar/, layout/)
│   ├── hooks/           # useUpload, useFiles, useDragDrop
│   ├── stores/          # Zustand (fileStore)
│   └── lib/             # re-export from @waldrive/shared + utils
└── mcp-server/          # MCP Server for devs / CLI / AI clients
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| File metadata | `contracts/sources/file_record.move` | FileRecord (versioning/soft-delete = Roadmap) |
| Folder hierarchy | `contracts/sources/folder.move` | Folder (nested = Roadmap; delete has orphan issue) |
| Share links | `contracts/sources/share_link.move` | ShareLink + ShareRegistry |
| Upload flow | `src/hooks/useUpload.ts` | MVP 2-step: PUT publisher → file_record::register |
| File listing | `src/hooks/useFiles.ts` | React Query: getOwnedObjects (FileRecord), paginate via cursor |
| File grid | `src/components/drive/FileGrid.tsx` | virtual scrolling = Roadmap |
| Read / preview | `src/lib/utils.ts` `blobUrl()` | aggregator `/v1/blobs/{blobId}` |
| MCP tools | `mcp-server/src/tools/` | upload + list (MVP); rest Roadmap |

## CONVENTIONS

- **bun only** — never npm/yarn/pnpm
- **HeroUI v3 first** — compound components, `onPress`; Tailwind v4 (`@theme`, no `tailwind.config.ts`)
- **Tailwind + HeroUI** — no inline styles, no CSS modules
- **Functional components** — no class components
- **No `any`** — use `unknown` and narrow explicitly
- **Components < 150 lines** — extract hooks for logic

## DESIGN

- Dark theme, lavender-blue accent (`#5e6ad2` → map to oklch for HeroUI v3) — see `DESIGN.md`
- HeroUI v3 component reference — `.agents/skills/heroui-react/SKILL.md`
- Native-feel / fluidity ideas — `.agents/skills/native-feel-cross-platform-desktop/`
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
- No CF Worker / no centralized backend — browser uploads go straight to the public publisher

## COMMANDS

```bash
bun dev              # Frontend dev server
bun build            # Production build
sui move build       # Build Move contracts
sui move test        # Test Move contracts
cd mcp-server && bun run build  # Build MCP Server
```
