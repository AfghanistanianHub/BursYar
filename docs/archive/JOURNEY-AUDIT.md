# BursYar user-journey audit and fixes

Date: 2026-11-20. Scope: homepage → get started → authentication → document
upload → PDF/image extraction → evidence review → profile creation → scholarship
selection → eligibility assessment → Barrier PathFinder → saved results and
dashboard.

This is a browser and integration audit of the current source tree, not a
production acceptance. Nothing here is deployed, and no live Google sign-in or
paid inference was used.

## Method and evidence

- `verification/journey-audit.mjs` (new, `npm run test:journey`) starts the real
  Vite app and the real local API (`engine/http.js`, `DocumentStore`,
  deterministic catalog) in one process.
- Identity is mocked at the `src/auth.js` module boundary only. Every case uses
  the real document, profile, catalog and evaluation code paths.
- `/api/analyze` is never given a provider. The audit records the honest failure
  and the deterministic recovery path instead of a simulated success.
- 39 checks pass, 0 fail, 4 recorded observations, 0 console errors or page
  errors. This includes the English journey end to end, PDF intake (text-layer
  extraction, review-and-correct, save, and the no-readable-text manual
  transcription fallback) and a Dari/Pashto check of the new recovery copy
  (localized, no horizontal overflow).
  Machine-readable results: `verification/artifacts/journey-audit.json`.
- Existing suites also pass: `npm test` (419 tests), `npm run build`, and
  `node verification/dashboard-browser.mjs`.

## Defect register (found, fixed, verified)

### BY-J01 — Dashboard verification icon rendered a malformed SVG

- **Observed:** every page load logged
  `<path> attribute d: Expected moveto path command ("M" or "m"), "undefined"`.
  The dashboard sidebar "Verification" link had an empty icon.
- **Cause:** the navigation built `icon(key)` with the route key
  `verifications`, while the icon map only defines `verified`.
- **Fix:** `src/student-dashboard.js` maps the `verifications` route to the
  `verified` icon.
- **Verified:** audit case `N01` (no `d="undefined"` paths, no console errors);
  dashboard browser checks still pass.

### BY-J02 — Signing in discarded the work in progress

- **Observed:** any transition from signed-out to signed-in forced
  `location.hash = '#dashboard'`. A visitor who had opened the document
  workflow, the profile or the assessment was moved off that panel and the
  public site was hidden. Recorded as observation `D01` when the signed-in page
  is loaded at the landing route.
- **Cause:** `src/main.js` redirected on every sign-in that was not already on a
  dashboard route.
- **Fix:** the redirect only happens from the landing route (`#` or `#top`).
  Signing in from a section keeps that section, reveals the dashboard entry, and
  remounts the private panels in place. Private dashboard deep links are still
  honoured (`G06b`).
- **Verified:** `G07` signs in from the document panel's own button, stays at
  `#documents-mount`, and completes an upload; `G06b` opens
  `#dashboard/documents` after sign-in from that deep link.

### BY-J03 — "Assess eligibility" landed on a collapsed disclosure

- **Observed:** the how-it-works step, PathFinder step 3 and the story index all
  target `#eligibility-mount`. With no live compilation, that mount contains a
  collapsed `<details id="eligibility-example">`, so the user arrived at a single
  summary line and no assessment. Re-clicking the same link did nothing because
  the hash had not changed.
- **Cause:** hash navigation never opened the disclosure that wraps the target.
- **Fix:** `src/main.js` `revealHashTarget()` opens an enclosing disclosure, or
  the single disclosure a mount point wraps, on load and on every `hashchange`.
  A delegated click handler repeats this when the hash is already current.
  It deliberately does not open unrelated disclosures inside large containers.
- **Verified:** `J02b` (target visible after the link), `J02c` (same-hash click
  reopens a disclosure the user closed), `J10` (verdict and reasoning rows), and
  `D02` (returning to `#top` opens no unrelated disclosure).

### BY-J04 — Private panels asked for sign-in without offering it

- **Observed:** as a guest, uploading a document showed
  "Sign in with an approved demo account before accessing private documents."
  and saving a profile showed "Profile unavailable. Sign in with an approved
  account and check private storage." Neither panel offered a sign-in action
  (0 in-panel actions); the only control was inside the header *Account*
  popover. The deterministic Barrier PathFinder had the same shape.
- **Cause:** each panel reported the missing credential but delegated recovery to
  an unrelated part of the page.
- **Fix:** new `src/sign-in-action.js` renders a localized, in-place
  "Sign in to continue" control with busy, failure and note states. Wired into
  `src/documents.js`, `src/profile-form.js` and `src/local-workflow.js`. The
  local workflow now remounts on identity changes so a stale prompt or another
  account's form state is never reused. Signed-out visitors still see the whole
  public explanation and can keep browsing and using the offline illustration.
- **Verified:** `G02`, `G03` (message plus exactly one in-panel action), `G07`
  (the action completes sign-in and the upload), and `J12` (deterministic
  assessment still works while signed in).

### BY-J05 — The saved page told users to clear a list it could not clear

- **Observed:** the dashboard privacy note said saved scholarships "are separate
  from your account; clear them from the saved page", but the saved page had no
  clear control; clearing existed only inside the public discovery filters.
- **Cause:** copy and controls diverged.
- **Fix:** `src/research-explorer.js` exports `clearSavedResearch()`; the
  dashboard saved view now has a "Clear saved scholarships" action with a
  confirmation status and an empty state, in all three languages
  (`src/dashboard-copy.js`).
- **Verified:** `J16b` clears the list and shows the confirmation; the existing
  dashboard browser suite still passes.

### BY-J06 — A private dashboard deep link had no recovery

- **Observed:** as a guest, `#dashboard/documents` showed the public site (good)
  but nothing indicated that signing in would open the requested view.
- **Cause:** the deep link was dropped by the dashboard sync path.
- **Fix:** the pending route is preserved while signed out and is opened by
  `sync()` as soon as authentication succeeds.
- **Verified:** `G06` (public site, no private content) and `G06b` (sign-in lands
  on the requested documents view).

## PDF intake verification (no defect found)

Added to the audit as `J07b`–`J07f`. The fixture is written by
`verification/fixtures/synthetic-pdf.mjs`; it is a synthesised PDF with a real
Helvetica text layer, processed by the pinned PDF.js build served by the app
itself. No provider and no document bytes leave the page.

| Case | What it proves | Observed result |
| --- | --- | --- |
| `J07b` | A PDF with a text layer stops at the review-and-correct step before anything is stored | stage marker `extract`, extracted text contains `GPA: 3.4/4` and the heading, library unchanged (1 record), no claims shown |
| `J07c` | The corrected preview text, not the raw extraction, is saved | corrected `GPA: 3.6/4` appears as the pending claim value, provenance reads "Text read locally from a PDF", library 1 → 2 |
| `J07d` | Approving the claim performs the save step and produces declared profile facts | stage marker `save`, academic scores panel shows 3.6/4, server profile stores `gpa {3.6, scale 4}` with origin `document_extracted` and `not_verified` |
| `J07e` | A scan with no readable text offers transcription instead of inventing content | status "OCR could not read this scan. Type or paste the visible text below.", editable preview empty, no claims created |
| `J07f` | Manual transcription is saved and recorded as a transcription, not OCR | provenance "Your manual transcription of a PDF", stored `extractionMethod: manual_transcription_from_pdf`, `authenticity: not_verified`, GPA fact 3.2 |

`J07e`/`J07f` replace only the Tesseract runtime boundary with a stub that
returns no characters, which is the same result a failed scan produces. The
real PDF.js render, the real empty-text handling, the real preview/save flow and
the real server-side extraction-method validation all run. No OCR model assets
are downloaded by this audit.

The corrected-text case matters beyond coverage: a PDF whose text layer is
slightly wrong (or a scan read with errors) can be fixed before storage, and the
provenance recorded afterwards is the reviewed text's method. The audit verifies
both halves against the stored record, not only against the screen.

## States exercised

| Transition | Loading | Empty | Error | Success | Recovery |
| --- | --- | --- | --- | --- | --- |
| Document upload | `aria-busy` + status (existing); PDF extraction preview (verified) | library "No documents saved" (existing) | timeout/network/uncertain/code messages (existing); unreadable scan → manual transcription (verified) | review step with stage marker; PDF review-and-correct before save (verified) | explicit sign-in prompt (added), refresh list (existing), discard extraction (existing) |
| Evidence review | busy state (existing) | "no claims pending" (existing) | conflict/unavailable messages (existing) | "Profile updated. Claims remain unverified." (existing) | delete document and retry (existing) |
| Profile | "Working…" (existing) | unknown/empty select values (existing) | "Profile unavailable…" (existing) | "Profile saved. Your declarations are not issuer verification." (existing) | sign-in prompt (added) + existing load/delete |
| Eligibility | computed on each change (existing) | "Cannot determine…" before input (verified) | n/a (local rules) | MET / NOT MET / UNKNOWN (existing) | editable inputs and hypothetical scenario (existing) |
| PathFinder | busy on API call (existing) | "No current reviewed scholarships…" (existing) | "Unavailable. Sign in…" (existing) | per-requirement guidance + next actions (existing) | sign-in prompt (added), reload catalog (existing) |
| Saved results | n/a (local) | "No saved scholarships yet" (existing) | storage failure message (existing) | item list with official source (existing) | clear action (added), browse (existing) |
| Dashboard | "Checking document status…" (existing) | no documents / no saved / no assessment (existing) | "Document status unavailable" (existing) | next-step card + counts (existing) | refresh on documents view (existing) |

## Recorded observations (not defects)

- `D01`: a signed-in visitor who loads the landing route is taken to the
  dashboard. That is the returning-user behaviour; signing in *from* a section
  no longer does this.
- `G02`/`G03`: the guest panels show both the server's explanation and the new
  sign-in action; no state claims private data was saved.
- `G05`: saved scholarships are browser-local, and their list is the dashboard's
  saved view (available after sign-in) plus the discovery panel's saved-only
  filter, count and export. Copy states this explicitly.
- Error copy for `429`/`503` is reached by the existing gateway tests rather than
  this audit's local server.

## Limits

- No live Google OAuth, no Meta/provider call, no production deployment and no
  Firestore rules deployment were exercised.
- PDF text-layer extraction and the manual-transcription fallback are covered
  end to end (`J07b`–`J07f`). `J07e` replaces the OCR runtime with a
  no-character stub, so this audit alone does not run a model.
- The live-OCR gap was closed separately on 2026-11-20: after
  `npm run prepare:ocr` (9 files, 17.7 MiB from the pinned tesseract.js 5.1.1
  packages), `npm run test:ocr` printed **OCR REAL-INTEGRATION PASSED** with
  every check passing. It uses the real pinned PDF.js and the
  self-hosted Tesseract worker, WASM core and language data, with mocked auth
  and a local engine API. English PNG and JPEG scans and a scanned (image-only)
  PDF produced text; Farsi OCR produced text and kept the RTL editable preview.
  The synthetic Pashto scan produced no characters from the model, and the gate
  verified the app's honest outcome: the manual-transcription prompt, no
  invented text, and the user's own transcription accepted. With every CDN host
  blocked, OCR still worked using only `/ocr/worker.min.js`,
  `/ocr/tesseract-core-simd-lstm.wasm.js` and `/ocr/lang/eng.traineddata.gz`,
  and zero off-origin requests occurred. This gate is separate from
  `npm run test:journey` and runs as `npm run test:ocr`. It legitimately needs
  the generated assets: run `npm run prepare:ocr` first (17.7 MiB into the
  git-ignored `public/ocr`); its `predev`, `prebuild` and `pretest` hooks only
  cover those other commands, not `test:ocr`. Without them the worker, WASM
  core and language data are missing and the gate fails rather than silently
  falling back to a CDN.
- Browser runs in this environment (both `npm run test:journey` and
  `npm run test:ocr`) need the no-root helpers
  `scripts/dev/install-browser-libs.mjs` and `scripts/dev/install-browser-fonts.mjs`
  (source `/tmp/chrome-libs.env` and `/tmp/chrome-fonts.env`; without fonts
  Chromium aborts in Skia).
- New Dari/Pashto strings follow the repository's existing unreviewed-translation
  caveat.

## Files changed

- `src/main.js` — sign-in redirect scope, hash-target disclosure handling.
- `src/sign-in-action.js` (new) — shared in-panel sign-in recovery.
- `src/documents.js`, `src/profile-form.js`, `src/local-workflow.js` — wired the
  recovery control; local workflow remounts on identity change.
- `src/student-dashboard.js`, `src/research-explorer.js`, `src/dashboard-copy.js`
  — icon mapping, saved-page clear action and copy.
- `src/style.css` — sign-in action styles.
- `package.json` — `test:journey` and `test:ocr` scripts.
- `verification/journey-audit.mjs` (new) — the audit harness above, including
  the PDF intake and manual-transcription cases.
- `verification/fixtures/synthetic-pdf.mjs` (new) — synthetic PDF with a text
  layer, and the text-less page used for the manual-transcription case.
