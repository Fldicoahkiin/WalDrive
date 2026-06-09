# WalDrive demo video

Programmatic demo video built with [Remotion](https://remotion.dev). Its own
package (own `node_modules`), separate from the app — not a bun workspace.

The composition narrates the app flow over real screenshots captured from the
running desktop console (dark theme), with Ken Burns push-ins, cross-fades, and
caption overlays. Output: 1920×1080, 30fps, ~46s.

## Setup

```bash
cd video
bun install
bunx playwright install chromium   # only needed for re-capturing screenshots
```

Remotion downloads its own Chrome Headless Shell on the first render/preview.

## Re-render

```bash
cd video && bunx remotion render src/index.ts WalDriveDemo out/waldrive-demo.mp4
# → out/waldrive-demo.mp4
```

Preview/scrub interactively in the browser:

```bash
cd video && bunx remotion studio src/index.ts
```

## Swap screenshots after a UX change

The video uses four PNGs in `public/`. Re-capture them from the running app,
then re-render:

```bash
# 1. start the app (from the repo root) — seeds the demo wallet + files
bun dev                       # serves http://localhost:5173

# 2. capture fresh screenshots into video/public/
cd video && bun run capture   # = node scripts/capture.mjs

# 3. re-render
bunx remotion render src/index.ts WalDriveDemo out/waldrive-demo.mp4
```

`scripts/capture.mjs` drives headless Chromium at 1280×800 @2x and writes:

| File             | State                                                                 |
|------------------|-----------------------------------------------------------------------|
| `01-grid.png`    | All Files grid view (sidebar + Demo folder + file cards)              |
| `02-preview.png` | File preview with **Verify** clicked → "✓ Retrieved … SHA-256 …"      |
| `03-search.png`  | Search field filtering on "md"                                        |
| `04-folder.png`  | All Files list view (breadcrumb + Demo folder + file rows)            |

Override the target URL with `APP_URL=… bun run capture`. The composition
tolerates a missing PNG (falls back to a labelled colored card), so a flaky
capture step won't break the render.

## Structure

```
video/
├── public/            # captured screenshots (committed)
├── scripts/capture.mjs
├── src/
│   ├── index.ts       # registerRoot
│   ├── Root.tsx       # <Composition id="WalDriveDemo">
│   ├── WalDriveDemo.tsx  # scenes + timing
│   ├── components.tsx # Screenshot (Ken Burns) + Caption + SceneFade
│   └── theme.ts       # colors / fonts / fps
├── remotion.config.ts
└── out/               # rendered mp4 (gitignored)
```

## Scenes

1. Title — WalDrive / Verifiable file storage on Walrus / Sui Overflow 2026 · Walrus track
2. `01-grid` — bytes land on Walrus, metadata on Sui, no backend
3. `02-preview` — instant preview from the Walrus aggregator
4. `02-preview` zoomed — **verify live, content-addressed, re-fetched & SHA-256'd** (the differentiator)
5. `03-search` ⇄ `04-folder` — search, folders, tags, versions, trash
6. Text — agents write via MCP, you browse/verify/share here
7. Outro — WalDrive / github.com/Fldicoahkiin/WalDrive / Walrus track · Sui Overflow 2026
