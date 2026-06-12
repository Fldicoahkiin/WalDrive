# WalDrive demo video — HyperFrames cut

The submission video, built with [HyperFrames](https://hyperframes.heygen.com).
HTML is the source of truth: `index.html` is the whole composition (one root
timeline). Eight real screen recordings are embedded as seekable `<video>` clips,
narrated by local TTS, with a lower-third caption track and a quiet music bed.

- **Output:** `../out/waldrive-demo.mp4` — 3840×2160 (authored 1080p, rendered at 2× DPR), 30fps, H.264 + AAC, ~3:54.
- **Aesthetic:** dark Linear (`#010102` canvas, `#5e6ad2` accent), `DESIGN.md` palette.

## Sections & timing

| Time          | Section             | Source                                            |
| ------------- | ------------------- | ------------------------------------------------- |
| 0:00–0:05     | Title card          | animated wordmark + track badge                   |
| 0:05–0:27     | Problem             | text scene (where does agent data live?)          |
| 0:27–0:43     | 01 Generate wallet  | `assets/clips/01-welcome.mp4`                      |
| 0:43–1:01     | 02 Free testnet gas | `assets/clips/02-fund.mp4`                         |
| 1:01–1:33     | 03 Multi-upload     | `assets/clips/03-multi-upload.mp4`                |
| 1:33–1:46     | 04 **Verify**       | `assets/clips/04-verify.mp4` (slow zoom on proof) |
| 1:46–2:11     | 05 Organize         | `assets/clips/05-organize.mp4`                    |
| 2:11–2:53     | 06 Versions         | `assets/clips/06-versions.mp4`                    |
| 2:53–3:10     | 07 Storage          | `assets/clips/07-storage.mp4`                     |
| 3:10–3:25     | 08 Accounts         | `assets/clips/08-accounts.mp4`                    |
| 3:25–3:36     | MCP                 | text scene (the agent write-path)                 |
| 3:36–3:54     | Conclusion          | text scene + vision                               |

Scenes crossfade (0.6s, ease-out). Clips alternate `data-track-index` 2/3 so
each crossfade has both frames live; text scenes are GSAP-gated DOM.

## One-time setup (TTS / transcription)

Narration uses local models via the HyperFrames media CLI. They need Python with
`kokoro-onnx` (TTS) and download Whisper weights on first transcribe. The repo
keeps a venv at `video/.ttsvenv`:

```bash
cd video
python3 -m venv .ttsvenv
.ttsvenv/bin/pip install kokoro-onnx soundfile
```

Put that venv on PATH for any `tts` / `transcribe` command so the CLI finds the
Python deps:

```bash
export PATH="$(pwd)/.ttsvenv/bin:$PATH"   # from video/
```

First `tts` downloads ~340 MB (Kokoro model + voices); first `transcribe`
downloads ~466 MB (Whisper `small.en`). Both cache in `~/.cache/hyperframes/`.

## Re-render

```bash
cd video/hf
npx hyperframes render . --quality high --fps 30 --resolution landscape-4k --crf 17 --output ../out/waldrive-demo.mp4
```

Quick iteration: `npx hyperframes render --quality draft --output renders/draft.mp4`.
Preview/scrub in the browser: `npm run dev` (keep it running), then open the
Studio URL it prints.

Always re-check before rendering:

```bash
npx hyperframes lint        # 0 errors expected (4 benign opacity-overlap warnings + 1 file-size advisory)
npx hyperframes validate    # WCAG contrast + console errors
npx hyperframes inspect     # layout overflow
```

## Swap a clip after a UX change

1. Re-capture the recording from the running app (1920×1080, H.264, no audio).
2. Drop it over the matching file in `assets/clips/` (keep the filename).
3. If the new clip's length changed, adjust that clip's `data-duration` (and the
   following scene's `data-start`) in `index.html` so the cut still lands on
   action. Use `data-media-start` to trim lead-in.
4. Re-render.

## Re-run narration after a copy change

1. Edit the matching `assets/narration/NN-*.txt` (one file per scene).
2. Regenerate audio, then transcripts, then caption groups:
   ```bash
   cd video && export PATH="$(pwd)/.ttsvenv/bin:$PATH" && cd hf
   bash scripts/tts.sh          # *.txt → *.wav   (voice af_nova, speed 0.95)
   bash scripts/transcribe.sh   # *.wav → *.transcript.json (Whisper small.en)
   node scripts/build-captions.mjs   # → captions.js + assets/captions.json
   ```
3. If a clip's narration got longer/shorter, nudge that `<audio>`'s `data-start`
   and the scene timing in `index.html` so voice and visuals stay aligned.
4. Re-render.

`scripts/build-captions.mjs` groups words into short phrases and fixes a few
brand-name mishears Whisper makes (WalDrive, Sui, backend, re-fetches). Add to
`PHRASE_FIX` there if new ones appear.

## Files

```
hf/
├── index.html                 # the composition (root timeline)
├── captions.js                # AUTO-GENERATED caption groups (window.__captions)
├── scripts/
│   ├── tts.sh                 # narration: *.txt → *.wav
│   ├── transcribe.sh          # *.wav → *.transcript.json
│   └── build-captions.mjs     # transcripts → captions.js + assets/captions.json
└── assets/
    ├── clips/                 # the eight real screen recordings
    ├── narration/             # NN-*.txt scripts, *.wav, *.transcript.json
    ├── music/bed.wav          # quiet ambient bed (generated via ffmpeg, see below)
    └── captions.json          # AUTO-GENERATED (inspection copy of the caption data)
```

### Voice & music

- **TTS voice:** `af_nova` (Kokoro), speed `0.95` — warm, neutral product-demo.
- **Music bed:** soft A-minor sine pad generated with ffmpeg (lowpassed, slow
  tremolo, fade in/out), mixed at `data-volume="0.12"` so narration stays clear.
  Recreate with `bash scripts/music.sh`.
