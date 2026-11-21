# Scholarship evaluation cases — 29 October 2026

Branch `feat/scholarship-evaluation-cases`, stacked on `docs/final-review-readiness` (PR #18 head, which includes PR #17 and Checkpoint 15's verified live inference). No Oxford live test repeated, no paid inference, no merge/deploy/submit.

## New offline fixtures (`verification/fixtures/scholarship-evaluation.json`)

Three cases added alongside the existing Oxford/Chevening/Cambridge excerpts; all assert conservative `unknown` in en/fa/ps (9 new assertions, 42 total checks):

1. `toronto-pearson-nomination` — `https://future.utoronto.ca/pearson-scholarships` (fetched 2026-10-29, status 200). Excerpt: school nomination + undergraduate entry. Reason: nomination predicates unsupported; a held degree must never satisfy nomination.
2. `eth-esop-top-ten-percent` — `https://ethz.ch/students/en/studies/financial/scholarships/excellencescholarship.html` (fetched 2026-10-29, status 200). Excerpt: top-10% bachelor's result = grade A. Reason: rank-percentile predicates unsupported; holding the degree must never satisfy the percentile.
3. `melbourne-graduate-research-entry` — `https://scholarships.unimelb.edu.au/awards/graduate-research-scholarships` (direct fetch **blocked with 403**, same bot-protection class as the Oxford central page; not bypassed). Wording grounded in official page snippets; flagged as such in the fixture's `reason` and the file's `retrievalMethod`.

No grammar or engine changes: the excerpts deliberately fall outside the narrow degree/IELTS/Oxford-exclusion grammar, proving the evaluator stays `unknown` instead of over-claiming. `verification/evaluate.mjs` coverage string updated (three → six fixtures).

## Verification

- `npm run test:evaluation`: **42/42 pass** (33 prior + 9 new), all new cases `unknown` in all three languages.
- `npm test`: **129/129 pass** (unchanged).
- Expected answers remain in the offline harness; nothing sent to any model.

## Remaining limits

Melbourne wording is snippet-grounded, not page-verified; no live inference on any new case (owner authorization required); human semantic/translation review still pending; fixtures test conservative handling, not admission prediction.
