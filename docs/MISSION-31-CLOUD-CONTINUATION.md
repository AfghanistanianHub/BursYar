# Mission 31 — cloud continuation, 6 November 2026

Release remains held. Synthetic documents only; zero model inference, PRs,
remote CI or hosting deployments. Production PDF/image intake remains disabled.

## Starting state and preservation

Recovered the requested Mission 30 object c0b63d3 and found a newer completed
Mission 31 candidate a333309 on existing work/no-spend-document-deadline.
Verified c0b63d3 is an ancestor; all Mission 28–30 work is retained. Continued
from a333309 rather than replaying completed work. Local branch is
work/mission31-cloud-continuation. Durable destination is the existing
work/no-spend-document-deadline branch, with no new remote branch or PR.

Unchanged vercel.json disables that destination; both workflows push only on
main; no open PR targets this branch. Pre-publication reads show zero branch
Actions runs and Vercel deployments. Prior Mission 31 evidence records Render
main-only with auto-deploy/previews off; no Render settings were changed.
Fresh official Vercel pricing read confirms push Security Review is free until
10 November 2026; paid Fix was never invoked. Recheck before future pushes.
This establishes a preservation path, not a nonbillable release/PR path.

## Implemented

- d05060439ca497487fd4dda2a1ea3927265da959: read PDF text through PDF.js streaming; enforce per-item UTF-16 and
  UTF-8 budgets before concatenating or encoding large text. Count text across
  pages; cancel/release reader and destroy parser on failure. AbortSignal now
  interrupts reads, parser waits and OCR waits with late-resource cleanup.
  File/language/mode changes, consent withdrawal and identity remount stop
  active extraction. This does not bound parser-internal or process memory.
- 4d72d8989d4e15fa43119b50d02eb55ddc4d7dcc: explicit Türkiye citizenship-history and same-level enrolment
  exclusions, official excerpts/digests and seven-day review expiry. Optional
  Yes/No/Unknown profile controls in en/fa/ps, consented private storage and
  evidence-linked PathFinder. A nationality label cannot decide citizenship
  history. Missing, pending and contradicted evidence stays UNKNOWN. Passing
  both exclusions leaves overall UNKNOWN because other criteria are incomplete.
- 96f2a7a3ec6eef5abd61f0027748503e5573baee and 48e65e2f9190f69db57405c3d79dd328367ebea7: review reproduced a consent/token race and stale
  target-relative enrolment. Consent is rechecked after token retrieval, before
  POST; withdrawal plus rechecking does not revive an invalidated save. Bind
  enrolment evidence to its target degree in server storage and evaluation;
  mismatches are UNKNOWN. Clear stale UI/draft values across language remounts.
- Added selected Türkiye full-time funding, degree-scope and graduate-health
  restriction facts from the official provider. Annual recurring calendar is
  recorded as prose, never promoted into a verified cohort window. Dates stay
  unknown; seven-day freshness enforced. Human approval remains pending.

Official evidence:
- https://www.turkiyeburslari.gov.tr/scholarshipsprograms
- https://www.turkiyeburslari.gov.tr/fulltimeprograms
- https://vercel.com/changelog/vercel-security-review-public-beta

## Verification

Exact counts and implementation SHA: MISSION-31-CLOUD-VALIDATION.json.

| Cloud-local command | Result |
| --- | --- |
| npm test | 454 passed, 0 failed/skipped/cancelled |
| npm run test:evaluation | 60 passed, 0 failed |
| node verification/document-ocr-integration.mjs | 34 passed, 0 failed |
| node verification/ocr-worker-lifecycle-browser.mjs | 6 passed; 0 workers left |
| node verification/turkiye-exclusions-browser.mjs | 6 en/fa/ps viewport journeys passed |
| node verification/document-consent-browser.mjs | 3 en/fa/ps consent-race checks passed; 0 POSTs |
| node verification/research-browser.mjs | 12 language/viewport journeys passed |
| node verification/academic-policy-browser.mjs | 12 language/viewport journeys passed |
| node verification/ocr-built-browser.mjs | passed; 0 external requests/workers left |
| node verification/document-production-gate-browser.mjs | 9 named assertions passed |
| npm run build | passed, cloud-local Vite only |
| npm audit --json | 0 advisories at every severity |

Red/green reproductions caught oversized PDF item traversal, ignored cancellation,
missing exclusion policy, stale target context and an unwanted POST after consent
withdrawal. Intermediate failures were corrected. The old discovery expectation
was updated from two to three curated records. Consent withdrawal now erases the
preview, so its integration assertion was updated to check erasure and zero writes.
Scoped read-only review identified the consent and target-context defects above;
regressions verify both fixes, including target change + language switch + save.

One native-script synthetic sample per language has CER 0 for Farsi and Pashto.
This is fixture evidence only, not broad accuracy or fluent human approval.
No student credentials, private records or live inference were used.

## Remaining blockers and scope limits

- Existing upstream model evidence selects Apache-2.0 over the npm wrapper MIT
  label. The checked 17-source-asset inventory, capped WASM and recovery tests are
  retained. Complete embedded native-component BOM and legal approval remain
  pending; productionApproved=false. No new license approval is claimed.
- Streaming reduces retained application text. Browser-process, JavaScript,
  PDF parser, image decoder and GPU memory are not hard-capped. Broader bombs,
  low-memory/mobile and non-SIMD coverage remain security gates.
- Hosted CSP/MIME/auth/isolation, fluent en/fa/ps approval and issuer
  authentication remain unverified. Existing ownerless/unknown lock recovery
  remains fail-closed; do not remove uncertain locks automatically.
- Citizenship/enrolment exclusions are partial policy coverage. Residency,
  degree equivalence, exact programme language acceptance, funding exclusions,
  age and conditional graduation need additional official programme-specific
  review; none was invented. Cohort-specific Türkiye dates remain unverified.
- Required exact-head CI/emulator/macOS and confirmed nonbillable PR/review and
  hosting capacity remain outstanding. New local scripts are reproducible but
  not claimed as remote CI results. Both frontend/backend release changes are
  required before these candidate behaviours can be live.

No deployment or production safety clearance is claimed. The built production
TXT-only gate passed; unchanged live deployment was not smoke-tested in this pass.

Git HTTPS writes were unavailable; connected GitHub Git-data operations preserved
four focused commits. Their final implementation tree exactly matches the tested
cloud checkout. Only evidence-document metadata differs in the final candidate.
