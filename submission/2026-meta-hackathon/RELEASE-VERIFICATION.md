# BursYar — release verification (submission)

Verified 2026-11-02, re-verified 2026-11-03 at release `main` tip
`59fb81f` (PRs #83, #85).

## Production

- Frontend https://bursyar.vercel.app → 200, serves
  `index-C35aFzXy.js` / `index-yzGWkncG.css` with markers
  `glyph-doc`, `glyph-search`, `eligibility-example`, `empty-note`,
  `summary::marker`, `skip-link`, `hero-actions`, `hero-visual`,
  `how-it-works`, `chain-verdicts`, `nextEmpty`, `nextEmptyCta` at
  verified counts; stage-4 empty state verified live.
- Backend https://bursyar-api.onrender.com/health → 200
  `ok:true`; local assessment, source retrieval, document storage
  available; Meta `configured` behind per-request policy gates.
- Console errors on production: zero in en/fa/ps (landing +
  disclosures open).
- `engine/` byte-identical from verified backend `4e272a7`
  through release tip — no inference-path drift since the hosted
  Meta proof (`5a58bff8`).

## CI (PR #72, run 41526557068)

verify, browser, emulator, macOS-helper: all success. Vercel
deployment completed.

## Test totals (release branch, local)

331 Node tests, 60 offline evaluation checks, 6 typography cases
(zero external font requests), 15 mocked browser cases with axe
(en/fa/ps × 320–1440), research + document-review suites with axe
(zero POST / no inference), 18-combo visual QA matrix (no overflow,
correct directionality).

## Video

`verification/artifacts/m09/bursyar-demo-3min-provisional.mp4`:
2:59.90, 1920×1080 H.264 yuv420p, 8.5 MB, full-decode clean,
frames inspected. Sources: `m09/01–05,08` (production) and
`m09/06–07` (local mocked rehearsal, bannered); committed pipeline in
`verification/video-production/`; canonical output
`final-assets/BursYar-Hackathon-Demo-Final.mp4`.
