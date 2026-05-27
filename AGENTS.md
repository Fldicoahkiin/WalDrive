# WALDRIVE KNOWLEDGE BASE

## OVERVIEW

WalDrive — Google Drive-like file management UI for Walrus decentralized storage. Next.js 14 + TypeScript + HeroUI + Tailwind. Metadata on Sui (Move objects), blobs on Walrus. MCP Server for AI clients.

## STRUCTURE

```
walrus-drive/
├── packages/shared/    # Shared utilities (walrus.ts, sui.ts, constants.ts)
├── contracts/          # Move smart contracts (file_record, folder, share_link)
├── src/                # Next.js frontend
│   ├── app/            # App Router pages
│   ├── components/     # UI components (drive/, sidebar/, layout/)
│   ├── hooks/          # useWalrus, useFiles, useFolders, useDragDrop
│   ├── stores/         # Zustand (fileStore)
│   └── lib/            # Client utilities
├── mcp-server/         # MCP Server for AI clients
└── worker/             # Cloudflare Worker (CORS proxy only)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| File metadata | `contracts/sources/file_record.move` | FileRecord object with versioning |
| Folder hierarchy | `contracts/sources/folder.move` | Folder object |
| Share links | `contracts/sources/share_link.move` | ShareLink + ShareRegistry |
| Upload flow | `src/hooks/useWalrus.ts` | 5-step: encode→register→upload→certify→save_meta |
| File listing | `src/hooks/useFiles.ts` | React Query: getOwnedObjects filtered by FileRecord |
| File grid | `src/components/drive/FileGrid.tsx` | Virtual scrolling with react-window |
| MCP tools | `mcp-server/src/tools/` | upload, download, list, folder, share |
| CORS proxy | `worker/src/index.ts` | Single PUT /upload route |

## CONVENTIONS

- **bun only** — never npm/yarn/pnpm
- **HeroUI first** — always use HeroUI components before custom
- **Tailwind + HeroUI** — no inline styles, no CSS modules
- **Functional components** — no class components
- **No `any`** — use `unknown` and narrow explicitly
- **Components < 150 lines** — extract hooks for logic

## DESIGN

- Dark theme, lavender-blue accent (#5e6ad2) — see `DESIGN.md`
- HeroUI v3 component reference — `.agents/skills/heroui-react/SKILL.md`
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

## COMMANDS

```bash
bun dev              # Frontend dev server
bun build            # Production build
sui move build       # Build Move contracts
sui move test        # Test Move contracts
cd mcp-server && bun run build  # Build MCP Server
cd worker && bun run dev        # CF Worker dev
```
