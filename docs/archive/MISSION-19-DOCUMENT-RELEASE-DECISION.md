# MISSION 19 — Document release decision: NO-GO (2026-11-03)

Candidate: PR #86 `feat/document-pdf-image-local-extraction` (audited at
`a9b35a6`, re-confirmed at `f29aa99`, all CI green).
Frozen release untouched: `main 95190e6`, production
`index-C35aFzXy.js`. Submission status: **NOT SUBMITTED**.

## Decision: NO-GO — do not merge before the hackathon

The PR's image/scanned-PDF OCR path is dead on arrival despite green
CI, and the branch is a same-day moving target whose own latest commit
notes real-file acceptance still pending.

## Release blockers (all reproduced, head `f29aa99` unless noted)

1. **P0 — OCR export-shape bug (OPEN).** `src/document-extraction.js`
   calls `mod.createWorker` on the `tesseract.esm.min.js` namespace,
   but the build exports only `default` (`createWorker` lives at
   `mod.default.createWorker`, verified in-browser). Every PNG/JPEG
   upload and every scanned-PDF page fails with "Local PDF/OCR
   extraction is unavailable". Reproduced live on `f29aa99` with a
   synthetic PNG. All existing OCR tests mock the loader, which is
   why CI is green. One-line fix (`mod.default ?? mod`), verified
   working under a local patch — but the fix is not on the branch.
2. **P0 — SyntaxError on audited head (fixed by author mid-audit).**
   `src/documents.js:102` carried a double-escaped regex that broke
   module load. Fixed in `f29aa99`; cited as head-instability
   evidence, not a current defect.
3. **P1 — pdfjs 6.4.299 render crashes on current Chromium.**
   `page.render()` throws `getOrInsertComputed is not a function` on
   Chromium 141 (Playwright 1.56.1, the repo's pinned version), so
   the scanned-PDF fallback mis-reports valid scans as "Invalid PDF"
   for current browsers. Pin a 4.x/5.x supporting current Chrome, or
   feature-detect with an honest message.
4. **Process.** Three head pushes during the audit; author's gates
   #4 (vendored/SRI assets or explicit approval) and #7 and fa/ps
   human evaluation unresolved; password-protected PDFs untested.

## What verified (LOCAL BROWSER VERIFIED, real CDN, mocked auth/API)

PDF text-layer extraction (exact text → preview → consent → save,
`not_verified`); PNG/JPEG English OCR byte-perfect (~5–6 s incl.
model fetch); Farsi OCR perfect on clean fixture; Pashto correct on
Perso-Arabic script, weak on Latin (honestly shown in the editable
preview with an "OCR may be wrong" warning); corrupt/6-page/oversize/
bad-extension rejections with zero writes; offline-CDN degradation
(TXT still saves); consent-withdrawal block; reload persistence;
public-check URL/issuer validation without network; axe zero
violations with preview open; TXT regression clean; on-device privacy
(CDN traffic is code/model GETs only — no document bytes leave);
PR #83 idempotency preserved; copy never claims authenticity
(`issuerAuthenticated:false`, `not_verified` throughout).

## Minimum path to a later GO

1. Fix the `mod.default ?? mod` export shape on the branch.
2. Resolve the pdfjs version/browser-compat issue with a real
   scanned-PDF pass on repo-pinned Chromium.
3. Re-run full CI green on a stable head; re-run this mission's
   real-file battery (`/tmp/m19shots/real1.mjs`…`real5.mjs`,
   `confirm.mjs`, `fx/` fixtures).
4. Vendor/SRI the CDN assets or record explicit security approval;
   note fa/ps OCR as machine-evaluated only.
5. Re-gate narrowly (CI + battery + production smoke) — do not
   re-audit the frozen release.

## Report

**DECISION:** NO-GO · **PR #86:** Open, blocked on P0 export bug + P1
compat · **SECURITY:** PASS on reviewed design (limits, validation,
worker isolation, SSRF shape, no exfiltration) · **PDF TEXT:**
Verified · **SCANNED PDF OCR:** Failed (render crash) / logic sound
· **PNG/JPEG OCR:** Failed on branch (export bug); Verified under
local patch · **FARSI/PASHTO OCR:** Verified good (fas) / Limited
honest (pus), machine-evaluated only · **CLIENT PRIVACY:** Verified
· **CDN/CSP:** Loads; no SRI/CSP hardening — needs approval before
broad deployment · **BROWSER PERFORMANCE:** Acceptable (5–6 s first
OCR incl. fetch; caps + cleanup verified) · **TXT REGRESSION:** PASS
· **PRODUCTION:** `95190e6` / `index-C35aFzXy.js`, TXT-only ·
**DOCUMENT AUTHENTICITY:** NOT OFFICIALLY VERIFIED · **VIDEO:**
Preserved (`731016d5…fac347`, still current) · **OWNER ACTIONS:**
none new — portal submission remains owner-only · **SUBMISSION:**
NOT SUBMITTED.
