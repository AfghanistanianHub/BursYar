# BursYar — release verification (submission)

Verified 2026-11-02, release `main` tip `b60444b`
(code tip `0960b24`, PR #72; docs PR #73).

## Production

- Frontend https://bursyar.vercel.app → 200, serves
  `index-Czy_aVBG.js` / `index-C9znp_fj.css` (CSS hash matches the
  release build) with markers `glyph-doc`, `glyph-search`,
  `eligibility-example`, `empty-note`, `summary::marker`,
  `skip-link`, `hero-actions` at verified counts.
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
2:59.87, 1920×1080 H.264 yuv420p, 8.4 MB, full-decode clean,
frames inspected. Sources: `m09/01–05,08` (production) and
`m09/06–07` (local mocked rehearsal, bannered); title cards in
`/tmp/m09cuts/cards/`; assembly `/tmp/m09cuts/assemble.py`.
