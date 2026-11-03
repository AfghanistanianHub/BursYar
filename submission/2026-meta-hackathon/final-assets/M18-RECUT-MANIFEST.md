# BursYar M18 video production manifest

Reproducible pipeline for BursYar-Meta-Hackathon-Demo.mp4 (179.5s).
No credentials, paid APIs, or real student data required.

## Prerequisites
- Node 24 + repo deps: BursYar checkout with `npm ci` (capture scripts
  import @playwright/test + vite via ./node_modules symlink; recreate with
  `ln -s $REPO/node_modules node_modules`) and Chromium (`npx playwright
  install chromium`).
- FFmpeg with libx264+aac+libass+drawtext: `pip install imageio-ffmpeg`
  (used here), or system ffmpeg; override path with $FFMPEG.
- macOS `say` with Reed (English U.S.) voice for narration.
- Engine imports resolve from $REPO (default: the 340a5e5 worktree used).

## Steps
1. `node edit/capture-live.mjs` — 5 live production scenes -> footage/.
2. `REPO=$REPO node edit/capture-local.mjs` — 3 rehearsal scenes -> footage/.
3. `node edit/render-labels.mjs` — lower-thirds + end card -> labels/.
4. Synthesize narration per audio/narration-script.txt (37 cues, Reed voice),
   then rebuild audio/timeline.json timings (see audio/ for method).
5. `python3 edit/assemble_edit.py --out BursYar-Meta-Hackathon-Demo.mp4`
   (+ .srt sidecar).

## Layout
- footage/ — 8 original screen recordings (VP8 webm, 1920x1080/25fps).
- audio/ — narration script, 37 cue AIFFs + 7 act AIFFs, timeline.json.
- labels/ — 5 overlay PNGs (Chromium-rendered, transparent).
- frames/ — audit + freeze frames. qa/ — QC frames, evidence map, QA report.
- edit/ — capture scripts, label renderer, assemble_edit.py, captions.ass.

## Honesty rules (binding on any re-cut)
LIVE footage only from production; local-stack footage keeps its REHEARSAL
banner + chip; synthetic fixtures labeled; simulated analysis UI disclosed
in narration; run metadata only from META-INTEGRATION-EVIDENCE.md; never
imply document authentication; never use real personal data.
