# BursYar demo video production (Missions 09–10)

Reproducible pipeline for the hackathon demo cut. No credentials, paid
APIs, or student data are used or needed.

## Prerequisites

- Node dependencies installed (`npm ci`) for Playwright recording.
- An ffmpeg binary: set `$FFMPEG`, or `pip install imageio-ffmpeg`,
  or install system ffmpeg. A caption font: `$VIDEO_FONT`, macOS
  Arial, or DejaVu Sans.

## Steps

1. Record production scenes (read-only; no auth, inference, uploads):
   `node verification/record-submission-demo.mjs`
2. Record rehearsal scenes (local mocked stack, bannered):
   `node verification/record-rehearsal-demo.mjs`
3. Render title cards:
   `node verification/video-production/render-cards.mjs`
4. Assemble the 3-minute provisional cut:
   `python3 verification/video-production/assemble.py [--out PATH]`

Inputs land in `verification/artifacts/m09/` (git-ignored). The
default output is `bursyar-demo-3min-provisional.mp4` (2:59.87,
1920×1080 H.264, captioned, silent).

## Adding owner-recorded narration later

The master is audio-ready: mux a finished 180s narration WAV with

```sh
ffmpeg -i FINAL.mp4 -i narration.wav -c:v copy -c:a aac -shortest FINAL-narrated.mp4
```

See `submission/2026-meta-hackathon/final-assets/BursYar-Narration-Script.md`
for the time-coded script. Local macOS speech synthesis was evaluated
and judged below professional narration quality; owner-recorded audio
remains optional.
