# Release candidate — 29 October 2026

This isolated candidate combines completed work only. No feature expansion, paid inference, credential/billing changes, merge to main, deployment or submission.

## Ancestry and conflict resolution

- PR #18: `dd27b2e00b2d3bb6ffb14222c2e0748b37796db3`, parent PR #17 `37c0bf8`.
- PR #20: `26c5b1c18df66e38df00248c1479b16c54954fbf`, already contains #18.
- PR #19: `c46aba5b115a37d3b8c97375784ffbfe74532cad`, also based on #17.
- Common ancestor of #19/#20: `37c0bf850ee843a92a8a73f33878f99bc8a854dc`.
- Candidate starts from #20 and merges #19, preserving both parent histories and every earlier functional/security ancestor. No cherry-pick duplication or reset of the earlier stack.
- Only conflict: readiness documentation rows for UX/languages. Resolution retains #18's current handoff and verified live milestone plus #19's typography/glyph notes. No runtime conflict.

Candidate PR targets `main` for a consolidated review of the entire unreleased chain, not permission to merge it. Existing component PRs remain untouched. Check the resulting CI/head before any later integration decision.

## Required automated verification

The candidate CI runs Node tests, offline evaluation (42 assertions, including #20), Firebase Emulator isolation, full 15-case multilingual browser/accessibility/journey matrix, production build and native macOS helper tests. No owner Keychain is read by helper tests. Browser identity/model/source transport remain explicit fixtures; source import/profile/document APIs are local real implementations.

Typography probe is now part of browser CI and exits nonzero on failure. It explicitly loads Inter, Vazirmatn and Noto Naskh Arabic sample faces, checks loaded status and successful same-origin font responses, verifies per-language stacks, and exercises U+06B1 fallback. No external font CDN is required. Font Loading API checks alone are not a substitute for a glyph cmap audit; #19 records the prior audit and its limits.

The final CI URL, exact head and screenshot artifact belong in the candidate PR description. A pending job is not a pass. Local tool/sandbox limitations must be reported separately from completed CI evidence.

## Release-blocker checklist

### Critical technical defects

- Any failed required CI job, failed font load, unexpected outbound font request, overflow/accessibility regression, broken source approval or URL-to-eligibility path blocks promotion. Do not waive a failed check because another component branch passed.
- Any auth/isolation, quota, SSRF, source-integrity or privacy regression blocks release. Do not weaken these controls to obtain a demo result.
- Resolve any integration conflicts before promotion; retain the exact reviewed candidate head. This document itself does not certify that the pending candidate CI has passed.

### Human approval and release gates (not observed software defects)

- Semantic review of the existing live output and fluent Dari/Pashto review remain pending. Keep `requiresHumanReview=true`, `coverageComplete=false`; do not advertise human-approved translations or complete eligibility coverage. Use FINAL-REVIEW-PACKET.md and the blank digest-bound review template.
- Official hackathon portal/rules, definitive deadline/timezone and required asset formats are not supplied. Prepared narration is not organizer compliance or a filed submission.
- Main merge, public deployment and submission require separate explicit owner approval. Public-production readiness is not established by a local/emulator demo.

### Known constraints requiring honest presentation

- Central Oxford retrieval was blocked; use normal recovery. Do not bypass protection or relabel supplied text as fetched.
- Melbourne evaluation wording is snippet-grounded after a blocked fetch, not verified full-page retrieval. All new fixtures are offline uncertainty checks, not new live inference or admission predictions.
- The owner-completed Meta run remains verified in Checkpoint 15: request `d1bb0e0f-caab-4f13-8611-e0c3d592335d`, `muse-spark-1.3`, stop + matching validation, 7,263 ms / 2,748 tokens / 4 criteria / 2 funding excerpts. Do not repeat it. No new reliability, semantic-accuracy or billed-cost statistic is implied.
- Exact-source quotation checks preserve traceability, not completeness, authenticity or entailment. Unsupported requirements remain UNKNOWN.

### Optional future features — not reasons to expand this candidate

PDF/image/OCR educational ingestion, issuer verification, broader rule grammars, program-specific provider catalogs, optical font tuning, print styles and production/cloud storage are outside this candidate. Do not implement them to close this release review. Noto fallback style blending still merits fluent typographic review; automated font success is not aesthetic approval.
