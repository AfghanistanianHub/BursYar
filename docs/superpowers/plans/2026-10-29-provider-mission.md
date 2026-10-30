# Provider Mission Implementation Plan

**Goal:** Complete the authorized mission on PR #25 without enabling services.
**Architecture:** A server-owned, expiring policy record authorizes an exact provider/model and subject; the gateway binds this decision to the adapter actually called. Deterministic assessment reads a reviewed server catalog and owner-scoped profile, independent of all model routes. Guardian grants isolate student documents under a derived storage identity.
**Tech stack:** Node 24, SQLite, Firebase authentication, Vite, Playwright.
**Spec:** User Mission 2 and docs/FAMILY-META-SAFETY-ROADMAP.md.

## Constraints
No inference, production credentials, deployment, billing changes, release candidate changes or main merge. Unknown policy denies. No client age/geography assertions. Preserve three-valued, source-grounded results and en/fa/ps.

## Review focus
Actual adapter/model mismatch; expired/revoked evidence; guardian cross-user access; unsupported criteria/exemptions; outage/cancellation and quota behavior.

## Tasks
- [ ] Restore baseline: install locked dependencies, record exact failures, update only authorized test fixtures, rerun Node/evaluation/build.
- [ ] Policy: add red tests for user age, provider region/model binding, consent freshness, privacy, budgets; implement trusted record resolver and mandatory gateway checks.
- [ ] Providers: add independent, disabled-by-default Meta/Gemini/self-hosted adapters with timeout, bounded output, quota stores and exact model identity; exercise mocked transport only.
- [ ] Deterministic engine: add reviewed criteria registry, degree/academic/language/document/deadline/funding/exemption rules and authenticated evaluate endpoint; unsupported/conflicting conditions remain unknown.
- [ ] Family: server-managed guardian grants and subject storage scopes; preserve confirmation/provenance and export/deletion; deny minor external generation.
- [ ] Verify integration denials have zero prompt reservations and calls; run Node, evaluation, emulator, browser and build; fix regressions.
- [ ] Review diff, document limitations and real counts; commit/push to draft #25 and inspect CI. Never merge.
