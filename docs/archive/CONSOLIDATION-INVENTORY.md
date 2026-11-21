# BursYar release consolidation inventory — 2026-11-11

Base: `origin/main` @ `6fabd1d` (Fix landing-page PDF pagination and document demo printing).
Branch: `release/consolidated-2026-11-11` — ONE commit on top of `6fabd1d`.
Revert: `git revert <this-commit>` returns the tree to `6fabd1d`. Nothing below is deleted from history; all source branches remain on the remote.

## 1. What exists only in each version

### A. `main` only (preserved — homepage + merged fixes #117–#119)
- New homepage: `src/hero-document-demo.js`, `src/hero-document-demo.css` (approved document-reader hero, `4b32059`), tightened English hero layout (`81c1c0f`), landing PDF pagination + document-demo print rules in `src/editorial-composition.css`, `src/guided-entry.css`, `src/hero-document-demo.*` (`6fabd1d`).
- Merged technical fixes already in main: `fix(hero) #117` (AI-first hero), `fix(documents) #118` (release PDF/canvas resources on extraction failure), `fix(pathfinder) #119` (preserve assessment reasons, filter unavailable reviews).
- Proof: `git diff origin/fix/reviewed-pathfinder-guidance..origin/main --stat` = homepage files + `src/document-extraction.js` + tests. Live `https://bursyar.vercel.app/` serves this homepage.

### B. Preview deployment only (Vercel STAGED `bursyar-hvnvwsfsw…`, branch `fix/reviewed-pathfinder-guidance @ 842b7d1`)
- Same pathfinder content as main's #119 (verified identical logic; different SHA from squash-merge).
- LACKS: #118 document-extraction cleanup and the entire new homepage (no `hero-document-demo.*`, no `6fabd1d/81c1c0f/4b32059`).
- Verdict: SUPERSEDED. Nothing unique to carry forward. Preview is login-protected (Vercel SSO) and behind production. Do not deploy it.

### C. Technical branches — unique vs their merge-base, and disposition
INCLUDED in this commit (still-valid, non-duplicate, non-breaking):
1. `work/no-spend-local-pdf-runtime` (`d52d2ed`, `94f8eee`, `1653772`): bound async extraction + scanned-page dimensions, bundle pinned local `pdfjs-dist@4.10.38` via new `src/pdf-runtime.js`, retain PDF.js license, bounded WASM/timeout hardening. Files: `src/document-extraction.js`, `src/pdf-runtime.js`, `public/licenses/pdfjs-dist-LICENSE.txt`, `package.json`, `package-lock.json`, `tests/document-extraction.test.js`, `verification/local-pdf-browser.mjs`.
2. `work/no-spend-verified-discovery` (`3405e9b`, `8c28b2a`, `82e4599`; covers `work/no-spend-discovery-search@3405e9b` as subset — marked DUPLICATE of itself): multilingual search normalization (`research-catalog.js`), ESOP source-checked facts panel (`verified-programs.js`, `research-explorer.js`, `data/scholarship-sources.json`), window-expiry logic. Files listed in stat below.
3. `work/no-spend-pathfinder-priority` (`9194c55`): prioritize specific evidence guidance over deadline wording in `src/gap-actions.js` + test. One-line logic reorder, safe.
4. `work/no-spend-guided-dashboard` (`4affdd7`, `76b350b`): guided student dashboard (`student-dashboard.*`, `dashboard-copy.js`), `documents.js` disconnected-mount guards + pending-review opener + `bursyar:document-status` events, `main.js` dashboard wiring (adds `#dashboard-entry` link only — hero untouched), `research-explorer.js` saved-notification. Verified compatible with (2): both hunks applied to `research-explorer.js`.

DUPLICATE — already in main, excluded (no content change):
- `fix/document-failure-cleanup@18d8c33` ≡ main `1cac54c` (empty diff).
- `fix/reviewed-pathfinder-guidance@842b7d1` ≡ main `9720b4a` logic (same deterministic.js/test; main adds #118 + homepage).
- `fix/document-browser-reload-and-release-gate` (enableScripting:false, bounded mock, async library poll): `grep` shows `enableScripting:false`, test assertion, and `expect.poll` already in main.
- `fix/document-upload-idempotency-20261103` (requestId dedup): `requestId` present in main `engine/documents.js`, `src/documents.js`, `tests/documents.test.js`.
- `fix/mobile-nav-wrap`, `fix/nav-active-offline`: ancestors of main (`merge-base --is-ancestor` = yes).
- `feat/provenance-clarity-from-demo`, `feat/guided-onboarding-calm-ux`, `feat/editorial-landing-structural-parity`, `feat/editorial-original-sketches`, `fix/editorial-layout-and-discovery`, `fix/pdf-audit-composed-layout`, `fix/ai-first-hero-20261104`: `trust-explainer.css`, `guided-entry.css`, `editorial-landing.css`, `editorial-repair.css`, `editorial-composition.css` all present in main (main has equal-or-more lines).

DEFERRED — not in this commit, needs separate review:
- `work/no-spend-document-deadline` (20 commits, `52a8b2e..e559cd3`): integration superset that already contains local-pdf-runtime + verified-discovery + pathfinder-priority, PLUS unreviewed OCR binary-asset pipeline (`data/ocr-*`, `src/ocr-*`, `src/image-preflight.js`), dependency patches, and large docs churn. Reason: too large for a single revertable release commit; binary/license assets and `package-lock` churn overlap with (1) and risk double-application. Revisit as its own release after this commit lands.
- `fix/pathfinder-fail-closed-provenance-m02`, `fix/91-document-library-reload`, older `feat/*`, `docs/*`, `release/*`: pre-homepage branches whose `main..branch` diffs are dominated by homepage deletions (applying wholesale would DELETE the new homepage). Any still-valid hunks from them must be cherry-picked file-by-file, not merged.

EXCLUDED noise (present in work branches, deliberately dropped):
- `vercel.json` `{"git":{"deploymentEnabled":{...}}}` per-branch preview-disable flags — branch CI config, not release content. Reverted to main's version in this commit.

## 2. Conflicts marked and resolved
- `src/research-explorer.js`: `verified-discovery` (verified-programs panel) + `guided-dashboard` (getSavedResearchIds/notifySaved) touch adjacent hunks — git auto-merged; verified both present via `git diff --cached`.
- `src/main.js`: dashboard wiring adds imports + `#dashboard-entry` + `#student-dashboard` mount only; `heroDocumentReader`/`heroDocumentDemo` render unchanged — homepage preserved.
- `src/document-extraction.js`: local-pdf-runtime rewrites extraction with deadline/`release()`/`validDimensions`/local `pdf-runtime.js` loader; no homepage overlap. Homepage CSS/hero files untouched (empty `git diff --cached` on `hero-document-demo.*`, `editorial-composition.css`, `guided-entry.css`, `index.html`).
- `package.json`/`package-lock.json`: only additive `pdfjs-dist@4.10.38` for the local worker. Installed via `npm ci`, `npm test` 403/403 pass, `vite build` succeeds with local `pdf.worker` + `pdf-runtime` chunks.

## 3. Verification (run on this tree before commit)
- `npm ci --no-audit --no-fund`: 749 packages, exit 0.
- `npm test`: 403 pass / 0 fail.
- `npm run build`: `✓ built in ~2s`, `dist/index.html` present, bundle contains `student-dashboard` + `verified-programs` additions and retains hero imports.
- Homepage check: `src/hero-document-demo.*`, `src/editorial-composition.css`, `src/guided-entry.css`, `index.html` have zero staged diff vs `origin/main`; `src/main.js` still imports and renders `heroDocumentReader`/`heroDocumentDemo`; production content matches `https://bursyar.vercel.app/` hero ("Scholarships, clarified." + document-reader hero).

## 4. Recoverability
- Single commit on `release/consolidated-2026-11-11` with parent `6fabd1d` (= `origin/main`). `git log --oneline -3` and `git status` below prove a clean single-commit branch.
- Revert with `git revert <sha>` or `git reset --hard origin/main`. All omitted branches remain on `origin/` untouched; deferred list above names exactly what was left out and why, so nothing is silently lost.
