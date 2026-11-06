# Mission 29 — unpublished zero-cost development candidate

## Preserved baseline

Started from Mission 28 `2f8356fc362bbbdea179a4a0d28e4cc7b45c87ea` in a
separate cloud worktree. All three completed heads remain ancestors:
`165377278c37796ee9608425fd5117fc1a275217` (PDF),
`9194c55d21ea0d81781f4760ed810a766cda16d9` (PathFinder), and
`82e45996a96178ce2d25c62624706311ba86be12` (verified discovery).
No old workspace edits or existing remote branches were overwritten.

No new remote branch is presumed safe from hosting triggers. Changes are saved
as GitHub commit objects linked from Issue #120, with a local Work branch
`work/mission29-zero-cost`. That is not a remote release branch. Unreferenced
Git objects have no guaranteed retention; Work workspace retention is also not
guaranteed. A confirmed safe durable remote ref remains required.

## Saved changes

1. `e559cd34f6b19ee0fbfb43a134a79ecc2bab6296`: pinned same-origin OCR,
   isolated worker lifecycle, PDF render cancellation and regression checks.
2. `2fc4c4d4786e17d86635b64462d0ebe0b54add34`: conflicting eligibility
   requirements return UNKNOWN, with original source excerpts retained.
3. `9cdf0e84b307c7f47b4c16c23ae78795283a3062`: discovery browser matrix
   expanded to en/fa/ps at 320/390/768/1440 pixels.

These commits form one chain and include the complete Mission 28 baseline.
They are review artifacts, not PRs, merges into main or deployed versions.

## OCR implementation

Exact dependencies: Tesseract.js 5.1.1, core 5.1.1, eng/fas/pus data 1.0.0.
No existing installed package versions changed; 13 dependency entries were added.
The npm lockfile pins tarball integrity. `data/ocr-assets.json` additionally
pins SHA-256 and byte lengths for 23 assets/notices (34,995,055 bytes total),
plus exact decompressed model sizes/hashes. `prepare:ocr`, `predev` and
`prebuild` verify and copy them to ignored `public/vendor/ocr-v1`. Preparation
uses installed packages only, performs no network requests, and fails closed
on missing/modified/version-mismatched assets. Generated assets are reproduced
from the checked-in lockfile and manifest, not stored as large Git binaries.

The lazy OCR runtime bundles the exact checked dist artifact and explicitly
sets same-origin worker/core/model paths; no runtime CDN fallback is used.
Persistent Tesseract caches are disabled. A private host owns native workers
before initialization, explicitly terminates children on disposal/error, and
has a bounded 150 ms acknowledgement fallback. One host is allowed per loaded
runtime module. Image/canvas data are transferred as bounded bytes; unused OCR
layout/export formats are disabled. Existing shared 30-second budget, 5 MB input,
5-page, 12-megapixel limits and production refusal remain. PDF.js also receives
image/canvas bounds, and timed-out render tasks are cancelled before cleanup.

## Review and evidence

Fresh read-only review found an important upstream initialization leak:
Tesseract 5.1.1 can leave its returned promise pending after model-load failure,
so waiting for a late successful worker was insufficient. A real browser
regression reproduced a worker remaining alive after extraction timed out.
The isolated host fix then passed stalled/missing/corrupt model, missing core
and concurrent-attempt tests: two real workers observed per case, zero remain.
No post-fix independent review is claimed; the fix was verified with the
reproducing browser tests and the full suite.

Final cloud-local results:

- **416 Node tests passed; 0 failed, skipped or cancelled.**
- **60 offline evaluation cases passed** (mocked interpretations, no model accuracy claim).
- **28 real OCR/journey checks passed**, with zero off-origin requests:
  synthetic English PNG/JPEG, Farsi and Pashto text, scanned PDF, corrupt and
  structurally encrypted PDF, oversized/page-limit/signature negatives,
  cancellation, consent withdrawal, uncertain write/idempotent retry and reload.
  Farsi/Pashto fixtures explicitly load the local Noto Naskh Arabic font. This
  proves these particular fixtures, not general language recognition quality.
- **5 real worker-lifecycle cases passed**, including failed/stalled initialization
  and concurrency, zero workers remaining.
- Built OCR worker packaging passed synthetic English recognition with zero
  external requests and zero workers remaining.
- Production build and built-production TXT-only gate passed. Synthetic identity
  is used in this gate; no live Google sign-in claim.
- Local PDF eng/fas/pus and native image-preflight browser checks passed.
- **12 discovery journeys passed:** 3 languages × 4 widths, source review,
  search/save/reload/export/clear/strict filters, overflow and axe checks.
- Production dependency audit: **6 moderate, 0 high/critical**, unchanged count.

## Remaining limitations and release gates

- Production PDF/image uploads remain disabled. Consent and field-by-field human
  review are unchanged; no document-authenticity claim is introduced.
- Browser WASM/process memory is not hard-capped; parser/decompression/metadata
  attacks, non-SIMD devices and low-memory mobile browsers need broader testing.
  Per-runtime serialization is not a cross-tab or process-wide memory bound.
- Browser lifecycle and packaging evidence is local Chromium, not hosted CSP,
  all-browser or live-provider evidence. No hosted deployment/CI was triggered.
- Asset licenses/notices are retained, but model packages only include metadata
  declaring MIT and READMEs; full model-license/provenance review remains open.
- Asset preparation verifies before replacing output but is intended to run
  serially; concurrent runs/rename failure are a deferred build-tooling risk.
- Human en/fa/ps translation review remains pending. No labels were upgraded.
- No new nationality/funding policies or deadlines were invented. An attempted
  official Gates Cambridge source retrieval was unavailable; no facts from
  third-party search summaries were promoted into the verified catalog.
- Nationality coverage, real policy expansion and verified scholarship catalog
  expansion remain incomplete beyond the preserved Mission 28 work.
- No billing/credential/production settings, student records, remote refs, PRs,
  remote CI, deployments or inference were changed/invoked in this mission.
  Last separately verified production frontend remains 9720b4a; it was not
  reverified or modified by Mission 29.
