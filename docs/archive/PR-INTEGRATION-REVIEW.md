# PR integration review — 2026-10-26

| PR | Head | Integration decision |
|---|---|---|
| #2 | b8bd33bc4621c9e8017e1e31045a0d72fa406bf1 | Superseded experimental engine; do not merge independently. Its original engine.js baseline is unused by the active server. |
| #3 | 4730ad7e1b285dd2ee3d2d172ef8f774fd33399b | Frontend base, demo catalog and proposed rules. Keep draft; no production rules deployment. |
| #5 | a4b224762ac77509fa53a092d2d5b7fbc3450dfd | Stacked on #3. Evidence validation/PathFinder and original engine import. |
| #6 | d20d11573f80626bd2c067d4f25156b149dcabbc | Stacked on #5. Active Firebase-authenticated server, quotas and client. Node22 CI success run 40440091335. |

All four PRs were open/draft/mergeable at review. #3 → #5 → #6 is an ordered stack; overlapping files are expected, not independent parallel implementations. Do not merge #2 after #5/#6; it could restore the insecure experimental authentication and duplicate engine. Preserve history; no PR closed or merged in this review.

## Active path
src/main.js → src/analyzer.js → src/auth.js → same-origin /api/analyze → engine/http.js → auth.js + quota.js → meta.js → evidence.js. engine/engine.js is historical and not imported by active server. The old shared-token route is absent. Only /health is unauthenticated. Firestore data is not used for quotas; client writes to quota documents cannot change SQLite reservations.

## Findings addressed in continuation
- Analyzer omitted funding/uncertainty/provenance from visible results.
- PathFinder messages and statuses were English-only on RTL pages.
- Main navigation rerenders discarded typed scholarship input.
- No executable emulator suite or browser regression existed.

## Release risks retained
Exact quote matching establishes traceability, not semantic entailment. Criterion kind is AI-classified and must remain unreviewed; missing document availability can only flag a potential mismatch. No eligibility claim is made. Quota store must be on persistent local disk, one instance. Token-work units are not monetary limits. Real Firebase/Meta credentials and human translation review remain external gates.
