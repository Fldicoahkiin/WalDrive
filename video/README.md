# WalDrive demo video

Real-interaction demo video: Playwright drives the live app with a visible
synthetic cursor and records each scene as real footage; a
[HyperFrames](https://github.com/heygen-com/hyperframes) composition (`hf/`)
assembles the clips with title cards, TTS narration, synced captions and a
quiet music bed. Output: 3840×2160 (4K, composition authored at 1080p ×2 DPR),
30 fps, ~2:23.

Structure: problem (0:00–0:27) → product demo over six real clips (0:27–2:05,
verify gets a slow zoom — it's the differentiator) → conclusion (2:05–2:23).

## Setup

```bash
cd video
bun install                        # playwright (for recording)
bunx playwright install chromium   # once
```

HyperFrames runs via `npx` from `hf/` (Node 22+, FFmpeg required). First TTS /
transcription run downloads Kokoro (~340 MB) and Whisper (~466 MB) into
`~/.cache/hyperframes/` — see `hf/README.md` for the one-time Python venv setup.

## Re-render

```bash
cd video && bun run render
# = cd hf && npx hyperframes render . --quality high --fps 30 \
#     --resolution landscape-4k --crf 17 --output ../out/waldrive-demo.mp4
```

Preview/scrub in the browser: `cd hf && npm run dev`.

## Re-record footage after a UX change

```bash
# 1. start the app (repo root)
bun dev                            # http://localhost:5173

# 2. re-record all six scenes (or pass scene names for just one)
cd video && bun run record         # = node scripts/record.mjs
node scripts/record.mjs 05-organize   # single scene, reuses persisted state

# 3. convert fresh webm → mp4 clips used by the composition
for f in 01-welcome 02-fund 03-first-upload 04-verify 06-restore; do
  ffmpeg -y -i out/clips/$f.webm -c:v libx264 -crf 20 -preset fast -pix_fmt yuv420p -an assets/clips/$f.mp4
done
ffmpeg -y -i out/clips/05-organize.webm -filter:v "setpts=0.71*PTS" -c:v libx264 -crf 20 -preset fast -pix_fmt yuv420p -an assets/clips/05-organize.mp4

# 4. re-render
bun run render
```

### Scenes (`scripts/record.mjs`)

| Clip | What it shows |
|---|---|
| `01-welcome` | Welcome → generate a wallet → gas banner appears |
| `02-fund` | off-screen testnet transfer → banner gone, balance live |
| `03-first-upload` | drag a photo in → progress → card appears live |
| `04-verify` | open file → Verify → "✓ Retrieved … SHA-256 …" |
| `05-organize` | new folder → tag → move into folder → browse in (sped 1.4×) |
| `06-restore` | Settings → import key → files reappear instantly |

Notes: scenes chain via `out/clips/state.json` (single scenes re-record without
replaying the run); funding uses the `waldrive-app` Sui CLI wallet; HeroUI
modals ignore Escape, so the script clicks the Close button (`closeModal()`).

## Structure

```
video/
├── assets/clips/      # H.264 clips used by the composition (committed)
├── public/            # app screenshots (record.mjs upload asset + site)
├── scripts/
│   ├── record.mjs     # Playwright scene recorder (visible cursor)
│   └── capture.mjs    # still-screenshot capture (kept for site assets)
├── hf/                # HyperFrames composition (index.html, narration, captions)
└── out/               # rendered mp4 + raw webm clips (gitignored)
```
