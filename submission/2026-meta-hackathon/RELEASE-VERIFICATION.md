# BursYar — release verification (submission)

Final delivery re-verification, 2026-11-04 ~01:30 America/Vancouver,
at release `main` tip `f270905` (PR #103; includes #104 `409ce8e`
and editorial `7709619`; supersedes the `340a5e5` record below where
they differ — historical sections kept for audit).

## Production (final delivery, live)

- Frontend https://bursyar.vercel.app → 200. Serves production bundle
  `index-O1olO3S9.js` / `index-ChYumL3r.css`. Deployment of `f270905`
  proven by content markers: JS contains `heroQuote` (×2) and the
  Pashto hero quote (new in #103); CSS contains the editorial
  composition classes (new in #104). Live title `BursYar |
  Education should be understandable.`; 1440px screenshot
  pixel-checked (editorial nav, hero + illustration, both CTAs,
  Document-first / Three-valued / PathFinder pillars).
- Backend https://bursyar-api.onrender.com/health → 200 `ok:true`
  (after one Render free-plan cold-start retry); local assessment,
  source retrieval, document storage available; Meta `configured`
  behind per-request policy gates, `inferenceVerified:false`.
- Unauthenticated POST `/api/analyze` (production Origin) → 401
  `Sign in with an approved account` (auth gate enforced, $0 spent).
- Responsive proof against the release tree: 15/15 combos clean in
  real Chromium (320/390/768/1024/1440 × en/fa/ps, RTL verified,
  zero overflow, zero console errors); fa/ps screenshots
  pixel-checked. Re-runnable: `npm run build` then
  `node verification/responsive-probe.mjs`.
- Reproducible production demo re-recorded 2026-11-04:
  `verification/artifacts/m09/01-landing` … `05-languages` `.webm`
  (public read-only flows, no sign-in, no inference); scene 01
  validated vp8 1920×1080 9.52 s.
- Google sign-in interaction: UNVERIFIED (no authorized test
  interaction performed; configuration retained untouched).
- Authenticated hosted persistence: UNVERIFIED (same reason).
- Live Meta inference output: NOT PERFORMED — requires an
  owner-authenticated session (approved Firebase UID with
  `bursyarDemo` claim + a fresh ≤24 h trusted policy record;
  on-disk records are dated 2026-10-31 and therefore stale).
  Promotional balance/expiry/applicability are not queryable from
  this context; $0.00 consumed, no caps changed, no out-of-pocket
  charge possible from the actions taken. Local Keychain
  metadata-only diagnose: credential present, USD 5 attested and
  confirmed. See `docs/FINAL-MISSION-COST-LEDGER.md`.

## CI (PR #103, run 41796219805, head 78c6354)

verify (381/381 incl. 9 new synthetic-applicant tests), browser,
emulator, macos-helper: all success. Vercel deployment completed
(markers above). Main push run 41797676729 for `f270905`:
verify/emulator/macos-helper success; browser concluded
separately (see PR checks on merge commit).

## Test totals (final delivery, local)

381 Node tests, 60 offline evaluation checks (no live Meta),
responsive probe 15/15, production demo scenes re-recorded.

## Mission 18 record (2026-11-03, release 340a5e5)

## Production (Mission 18, live)

- Frontend https://bursyar.vercel.app → 200. Serves production bundle
  `index-cslf-rZ1.js` / `index-yzGWkncG.css` (JS hash differs from
  local builds only because production builds with Firebase env;
  CSS identical). Bundle contains post-#92 `enableScripting` flag,
  pinned `pdfjs-dist@4.10.38` / `tesseract.js@5.1.1` strings, and the
  TXT-only notice; no `Firebase sign-in is not configured` fallback.
- Production SHA proven `340a5e5`: Vercel success status on the merge
  commit, no newer commits exist, and signed-out boot fetches the
  Firebase dynamic chunks — a behavior only the #93 auto-load code
  path produces (prior trees make zero token calls before interaction).
- Backend https://bursyar.vercel.app/health → 200 `ok:true`; local
  assessment, source retrieval, document storage available; Meta
  `configured` behind per-request policy gates, `inferenceVerified:false`.
- Anonymous `/api/documents` GET/POST → 401 (auth enforced).
- Production QA matrix 185/185 in real Chromium: en/fa/ps ×
  1440/768/390/320 — boot, RTL direction, zero overflow, 4-step
  navigation + history, discovery 3/0/3, country filter, research
  rows, analyzer submit gated without approval (zero quota spent),
  TXT-only notice + `.txt` picker in all 12 cells, offline
  deterministic eligibility, localized error states under blocked
  API, axe clean en/fa/ps, zero console errors; 8 same-origin links
  checked, none broken. Plus: skip-link first Tab stop, detail
  open/close with honest demo labels, PathFinder offline render.
- Google sign-in: UNVERIFIED (no authorized test interaction
  performed; existing auth configuration retained untouched).
- Authenticated document workflow against `dist/` built from the
  exact `340a5e5` tree with stubbed identity + local engine: consent
  upload, library auto-load, reload persistence, selection by id,
  claim review, owner isolation (empty library + 404), deletion with
  profile cleanup, lost-response message, idempotent retry without
  duplication, zero off-origin writes — all PASS. Hosted-backend
  authenticated persistence: UNVERIFIED (same credential reason).

## CI (PR #93, run 41723547491, head 9d19063)

verify, browser (incl. new library + production-gate regressions and
OCR real-integration with `20-library-lists 3 records`), emulator,
macos-helper: all success. Vercel deployment completed. Tree of
`340a5e5` identical to `9d19063` (empty diff).

## Test totals (Mission 18, local)

361 Node tests, 60 offline evaluation checks, 47 emulator checks,
typography probe (zero external font requests), 15 mocked browser
cases with axe, research + review + library + OCR-integration +
preview + production-gate suites, macOS helper self-test. Historical
`59fb81f` record: 331 Node tests.

## Video

`final-assets/BursYar-Hackathon-Demo-Final.mp4` (footage sourced from
`dbfb054`): SHA-256 matches manifest, Chrome playback verified
(179.9 s, 1920×1080, readyState 4, time advancing), frames at
0:25/1:10/2:25/2:45 inspected. Claims re-checked against `340a5e5`
production: two Muse Spark runs match recorded metadata, simulated
analysis UI explicitly labeled, no PDF/OCR-in-production claim,
honest caveats on translations and research leads. Footage predates
the TXT-only notice and library auto-load; neither is contradicted.
Silent captioned master; narration script timed; owner voiceover
optional. A Mission 18 re-cut is in progress by a second agent with
this file preserved as fallback.

## Historical record (2026-11-02 → 2026-11-03, release 59fb81f)

Verified 2026-11-02, re-verified 2026-11-03 at release `main` tip
`59fb81f` (PRs #83, #85).

### Production (historical)

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

### CI (PR #72, run 41526557068) (historical)

verify, browser, emulator, macOS-helper: all success. Vercel
deployment completed.

### Test totals (historical)

331 Node tests, 60 offline evaluation checks, 6 typography cases
(zero external font requests), 15 mocked browser cases with axe
(en/fa/ps × 320–1440), research + document-review suites with axe
(zero POST / no inference), 18-combo visual QA matrix (no overflow,
correct directionality).

### Video (historical)

`verification/artifacts/m09/bursyar-demo-3min-provisional.mp4`:
2:59.90, 1920×1080 H.264 yuv420p, 8.5 MB, full-decode clean,
frames inspected. Sources: `m09/01–05,08` (production) and
`m09/06–07` (local mocked rehearsal, bannered); committed pipeline in
`verification/video-production/`; canonical output
`final-assets/BursYar-Hackathon-Demo-Final.mp4`.
