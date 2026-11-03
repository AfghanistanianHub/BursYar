# BursYar M18 re-cut pipeline (committed sources)

Reproducible pipeline for
`submission/2026-meta-hackathon/final-assets/BursYar-Meta-Hackathon-Demo.mp4`
(179.5 s). Origin: Mission 18 video production (peer session
pond-conjunction); committed here so the documented recovery
procedure runs from the delivered checkout. The only delta from the
producer's frozen tree is the Mission 19 caption fix in
`edit/assemble_edit.py` (see below) plus this README.

## Layout

- `footage/` — 8 original screen recordings (VP8 webm, 1920×1080).
- `audio/` — narration script, 37 cue AIFFs + 7 act AIFFs,
  `timeline.json` (measured per-cue timings).
- `labels/` — 5 overlay PNGs (Chromium-rendered, transparent).
- `frames/` — freeze-frame PNGs used by the assembly (`fz*.png`).
- `edit/` — capture scripts, label renderer, `assemble_edit.py`,
  generated `captions.ass`, audit probe.

## Re-run (regenerates the final MP4 + SRT)

Prerequisites: Node 24 + repo deps, Chromium (`npx playwright
install chromium`), imageio-ffmpeg (`pip install imageio-ffmpeg`;
override with `$FFMPEG`), macOS `say` with the Reed voice (only if
re-synthesizing narration — the committed AIFFs are reused as-is).

From the repo root:

```bash
python3 verification/video-production/m18/edit/assemble_edit.py \
  --out /tmp/BursYar-Meta-Hackathon-Demo.mp4
```

To re-capture footage instead of reusing it:
`node edit/capture-live.mjs` (public production) and
`REPO=/path/to/BursYar node edit/capture-local.mjs` (local stack).

## Mission 19 caption fix

The producer's caption generator wrapped each narration cue to at
most 2 lines and silently dropped the rest (12 of 37 cues lost
trailing words in both burned captions and the SRT sidecar). The
committed `assemble_edit.py` keeps the original line breaks whenever
a cue fits, and otherwise splits the cue into additional timed
dialogues proportionally within its spoken window — 46 SRT cues, zero
dropped words (verified programmatically: every timeline sentence
present verbatim). Audio, footage, labels, and timings are
byte-identical inputs to the producer's render; only caption text
changed (new SHA-256 recorded in FINAL-VIDEO-REPORT.md).
