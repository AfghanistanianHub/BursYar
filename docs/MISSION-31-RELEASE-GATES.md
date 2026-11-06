# Mission 31 — final release gates and product integration

Date: 2026-11-06 UTC. Candidate changes only; production remains TXT-only.
Base: `c0b63d3f05f27b9e76ca010fc88eba3900a2b297`.
Security implementation: `f745fec7ed9bb9c09e913b5b16d49d660f0554c1`.
Product implementation: `2661fdb39f7313bf479bd972b7e6cf9fcc162080`.
Tested implementation tree: `4fa398fa693bce3b8953a9b220914cec9c6e5588`.

## Preservation and cost boundary

The starting candidate and Mission 29 `21472c0` ancestry were verified. Mission 28 and its three integrated branch heads remain in that ancestry; no prior implementation was discarded.
The old Mission 30 checkout was no longer available, demonstrating that Work retention alone is insufficient. Its exact commit was recovered from GitHub.

Reused the existing `work/no-spend-document-deadline` branch rather than creating an unguarded new branch. Its former head `d52d2edd960556a8ba0ce0b1047c12b845cdf9a5` was an ancestor of the candidate. First fast-forwarded it to exact `c0b63d3`, with a lease and without force. A GitHub read and git ls-remote confirmed the exact SHA. Branch deployment history was empty.

Safety evidence:
- Existing unchanged vercel.json explicitly sets this branch's git.deploymentEnabled to false. Official behavior: https://vercel.com/docs/project-configuration/git-configuration
- No open PRs at both preservation checks; Vercel Agent CodeReview triggers on PR creation or commits to open PRs: https://vercel.com/docs/agent/pr-review
- Both repository workflows restrict push events to main; this work branch does not trigger those workflows.
- Render service is main-only, auto-deploy off and preview environments off.
- Vercel's separate Nov 3 Security Review beta can run on pushes but is explicitly free until Nov 10, 2026: https://vercel.com/changelog/vercel-security-review-public-beta . No paid fix action was invoked. Recheck after that date before any further push.

This establishes a time-bounded nonbillable preservation path, NOT a confirmed nonbillable PR/CI/hosting-release path. No integration/billing/protection/credential settings were changed. The final documentation commit is intended to fast-forward this same guarded branch; the final tracker entry records the verified final ref SHA.

## OCR implementation

- Owner-aware unique lock tickets use a choosing phase and ordered bakery tickets. Only provably dead owners in the same host/boot/PID namespace are reclaimed; ambiguous records fail closed. No elapsed-time-only lock theft.
- This executor's /proc PID mapping differs from process.pid. Process-start comparisons are used only when the namespace mapping is proven comparable; ESRCH is otherwise the death proof within the recorded namespace.
- Bounded, path-validated publication journals recover interrupted stage/backup renames. Tests kill children at five publication boundaries; cold initialization and impossible journals have separate coverage. Unrelated directories are preserved.
- An ownerless legacy .ocr-preparation.lock deliberately requires operator confirmation; foreign owners and unsafe journal states remain blocked.
- Browser Web Locks coordinate binary extraction across same-origin tabs before reading bytes. Busy or unsupported browsers fail closed. TXT stays usable. Closing a tab and deadline expiry release the lease.
- PNG preflight validates IHDR combinations, limits inflated scanline estimates including conservative Adam7 overhead to 48 MiB, and refuses compressed metadata iCCP/zTXt/iTXt. A real synthetic compressed-metadata expansion fixture is rejected before decode.
- Existing 256 MiB per-core WASM maximum, page/canvas limits, consent, preview, field review and worker teardown remain.
- No authenticity status is promoted by extraction.

Limits: Web Locks do not hard-cap the whole browser/JS/PDF/GPU process or coordinate all storage partitions. Best-effort late cleanup can outlive an extraction promise and briefly overlap a later lease. Two publication renames still permit a brief missing target; SIGKILL recovery is not a power-loss durability guarantee. Arbitrary IDAT/PDF decompression attacks, low-memory/mobile/non-SIMD behavior and full native-decoder isolation remain release gates.

## OCR licenses and provenance

The upstream pinned model bytes match the npm model bytes, compressed and decompressed. Upstream naptha/tessdata revision 806cd9adc8c6e8abc11c782db1818c990576bebc provides Apache-2.0 LICENSE. Maintainer Balearica explicitly added that license; the upstream generator independently hard-codes MIT in npm wrapper metadata.
- https://github.com/naptha/tessdata/issues/4#issuecomment-1686457658
- https://github.com/naptha/tessdata/blob/806cd9adc8c6e8abc11c782db1818c990576bebc/LICENSE
- https://github.com/naptha/tessdata/blob/806cd9adc8c6e8abc11c782db1818c990576bebc/scripts/gen-pkg.js

The selected distribution grant for byte-matched model data is Apache-2.0; contradictory npm metadata is recorded, not rewritten. Removed npm wrapper README/package metadata from runtime output to avoid labeling models MIT. New checked inventory covers all 17 source assets, hashes and project-level grants. Generated output has 21 files including notices/inventory. Source/derived core modification notices remain.

This resolves the candidate's choice of model grant using upstream evidence; it is not legal sign-off or an upstream metadata correction. Complete embedded native-component bill of materials and human license review remain pending. productionApproved remains false.

## Scholarship and product implementation

Added a partial source-checked Türkiye Scholarships health-sciences academic criterion from its canonical official page. Exact excerpt, canonical URL, captured timestamp, 90/100 minimum and seven-day freshness are shared between catalog and deterministic engine.
https://www.turkiyeburslari.gov.tr/scholarshipsprograms

Scope is Medicine/Dentistry/Pharmacy only; no degree equivalency, nationality, residency, other academic pathways, language waiver or funding assumption was invented. Other program requirements remain unreviewed. Application dates are null and the discovery card explicitly reports dates unknown, never confirmed open.

- Same-scale academic scores only: 90/100 meets the criterion; 89/100 does not; 18/20, missing or conflicting evidence remain UNKNOWN. Even a met criterion leaves overall eligibility UNKNOWN because coverage is incomplete.
- Existing academic evidence form now accepts an explicit score/scale without conversions and preserves issuer-verified fields.
- Existing comparison UI displays catalog titles and invalidates pending evaluations/results on profile changes or remount, preventing old responses from publishing stale PathFinder guidance.
- Saved confirmation survives form remount; source evidence and user approval remain separate.
- Research card safely handles missing application windows and checks its exact canonical URL.
- en/fa/ps UI strings were added with translation status still unreviewed.

Backend source at 4e272a7 already accepts academicScore and the existing assessment endpoints. No migration or new endpoint is required; the new criterion requires candidate backend code to be deployed to appear there. Older backend catalogs retain title/id compatibility. No new live-backend functionality is claimed.

## Reproducible validation

All checks ran in the cloud workspace against synthetic/public data; no inference, private student records or remote CI.
- npm test: 442 passed, 0 failed, 0 skipped, 0 cancelled.
- npm run test:evaluation: 60 passed, 0 failed.
- npm run build: passed locally, not a hosting build.
- npm audit: 0 total advisories (including 0 high/critical); dependency lock remains Mission 30's remediation.
- verification/document-ocr-integration.mjs: 34 passed, 0 failed.
- verification/ocr-worker-lifecycle-browser.mjs: 5 passed; 0 workers remain.
- verification/document-concurrency-browser.mjs: 5 passed.
- verification/image-preflight-browser.mjs: 6 input cases passed; zero external requests.
- verification/academic-policy-browser.mjs: 12 language/viewport journeys passed (en/fa/ps x 320/390/768/1440), including a delayed stale-response regression in en/320; axe checks passed.
- verification/research-browser.mjs: 12 language/viewport journeys passed with axe and no POST requests.
- verification/document-production-gate-browser.mjs: 9 named assertions passed, TXT-only gate retained.
- Built local OCR smoke passed: synthetic English recognized, 0 remaining workers, 0 external requests.
- tests/ocr-lock-recovery.test.js: 9 cases, included in the 442 Node count, not additional tests.

Native-script quality: one synthetic Farsi fixture and one synthetic Pashto fixture each had character error rate 0 against its exact expected text. This is fixture evidence, not general accuracy, human language approval or real-document certification. English PNG/JPEG and scanned PDF checks also passed. No emulator/macOS/remote exact-head CI or live Google sign-in validation is claimed.

Fresh scoped read-only postreview found no critical/important finding in reviewed changes. Two later additions were tests only (cold recovery and delayed eligibility response); final Node suite and updated product browser suite passed afterward.

## Remaining release gates and next action

1. Complete native component license inventory/legal review, browser process-memory and decompression/low-memory/non-SIMD testing; maintain binary intake disabled.
2. Human en/fa/ps semantic review and hosted CSP/MIME/auth/privacy/isolation evidence.
3. Expand full official eligibility coverage (degree equivalency, nationality/residency, funding exclusions and conditional policies); this mission adds only the verified partial academic criterion.
4. Confirm a nonbillable PR review path, required exact-head CI including emulator/macOS, available CI storage and Vercel/Render build capacity. Preserve required checks.
5. Only after approval/checks, use existing release workflow and independently verify frontend plus backend. No PR/merge/deployment was initiated in this mission.

Last known production frontend remains 9720b4a and backend 4e272a7; not re-certified live by these local candidate tests.

The execution environment became unavailable after validation and after both implementation commits were saved. Final ref/evidence/tracker operations use GitHub directly; no unavailable workspace command or new test result is claimed.
