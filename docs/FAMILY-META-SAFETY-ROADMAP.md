# BursYar — Family safety, Meta routing and scholarship evaluation plan
Date: 2026-10-29
Status: proposed security/product architecture; NOT implemented or approved for production.
Base: fix/student-profile-acceptance / draft PR #22; preserve release/candidate-2026-10-29 and main.

## Goals and constraints
- Preserve source-grounded, three-valued eligibility, mandatory human review, trilingual en/fa/ps, reviewed profile/documents, origin/provenance, quota, consent, deletion and isolation.
- Document-first onboarding is future scope: upload -> bounded extraction -> user reviews every claim -> profile updates only after approval; distinguish provider-official document verification from AI inspection and unsupported authenticity.
- Do not expand the release candidate or claim verified translation/live provider behavior from offline fixtures.
- Don't infer personal identifiers, citizenship, age, location or sensitive characteristics from filenames, language or appearance.

## Contract and geography gates (review before coding)
Meta official terms updated 2026-10-09 and Model Designation/Geographic Use Policy updated 2026-10-12:
https://dev.meta.ai/legal/terms-of-service
https://dev.meta.ai/legal/geographic-use-policy
https://dev.meta.ai/help/policies-and-privacy/contributor-tier
https://dev.meta.ai/docs/models
- Meta integrated products must not target people under 18 or be made available to under-18 end users. A parent acting as proxy is NOT a blanket exemption. Get explicit written permission before using Meta API for the minor-targeted experience, even if a guardian operates it.
- Geographic restrictions can affect supported deployment AND end-user locations, including relevant regions; verify the current official policy and enforce allowed routing before opening deployment. Do not use VPN or proxy to evade restrictions.
- Standard: model IDs such as muse-spark-1.3; content not used to train Meta models under Standard commitments. Contributor: separate -contributor model ID; prompts/context/responses can be used by Meta to train and evaluate, and it explicitly prohibits personal, confidential or sensitive content. Never rely on UI-only checks, client-supplied model IDs, or a text redaction regex to make a personal request Contributor-safe.
- Disallow Contributor mode for ALL user-originated profile, document, chat, scholarship analysis or request data by default. If evaluation uses synthetic/public material, require dedicated isolated operator-only harness, explicit provenance/no personal information, review of source licenses, and a clearly separate key/model configuration.
- External legal/privacy review needed prior to broad launch, especially protections for children and international users.

## Product architecture: Family mode (non-Meta, unless explicit written permission)
- Adult guardian creates account with age-gated access and privacy notices. Legal guardian authority and consent should be verified proportionately, avoiding unnecessary identity collection.
- Guardian can create multiple separately scoped minor profiles; student records must not be accessible to another guardian or student without lawful authorization.
- Dedicated minor route: **no Meta SDK, endpoints, proxies, model requests, server background work, queued requests, telemetry payloads, or fallback to Meta**. A parent submitting on behalf of a minor remains in this route.
- Phase 1: curated public scholarship catalog and deterministic age/degree/deadline/eligibility filters without any Meta model. Human-readable unknown status for unsupported rules; no invented equivalencies or accepted tests.
- Phase 2 only after provider legal/privacy vetting: separate explicitly permitted provider or self-hosted inference for this route. Server-side deny-by-default policy controls access to provider endpoints.
- Transfer of control at age of majority must be explicit with verified identity, permissions, privacy notice and review, not automatic takeover.
- Privacy: data minimization, granular guardian/student permissions, record consent provenance and revocation, private retention/deletion, no sensitive logs, encryption, export/delete options and data-subject rights.

## Age/provider request gate (server policy, design only)
- Backend owns route selection; never trust age, family mode, geography, tier, or user ID solely from browser fields.
- Fail closed if age is under 18, unknown or ambiguous for Meta-integrated route; do not infer eligibility from adult account alone when analyzing a minor's profile.
- Fail closed if user/end-user location is unsupported or cannot be established sufficiently for compliance; no silent Meta fallback.
- Require explicit policy-approved scenario for all Meta requests, with authenticated user, consent, spending confirmed, quotas, approved model ID and Standard-only user data.
- Prevent any personal content moving to contributor model IDs; reject unknown/unapproved model names at startup and runtime.
- Preserve existing fraud/SSRF/source-integrity/quota safeguards; avoid making age-policy decisions through generative output.
- Document test fixtures: 17-year-old with guardian, 18-year-old, unknown age, adult submitting minor profile, inconsistent DOB, restricted geography, unknown geography, model misconfiguration, contributor on personal data, cross-family IDOR, consent withdrawal, concurrency/quota bypass and provider outages. Tests must assert no outbound Meta call for blocked cases.

## Model evaluation roadmap (separate from release candidate)
- Spark 1.3 Standard is baseline. Wonder 1.0 Standard is optional comparison only when justified by measured marginal improvement and budget. Do not spend or switch billing without owner approval.
- Test with synthetic and non-sensitive public scholarship source excerpts; real institution URL, retrieval origin/digest, supported evidence, unknowns, missing proof, negative/ambiguous eligibility, deadlines, stale source warnings and translated outputs.
- Score source entailment, hallucination/missing evidence, per-criterion precision/recall, contradictory evidence, program-specific language-test acceptance, latency, tokens and cost (actual when available).
- Language quality for en/fa/ps needs qualified human review. Automated language/RTL and offline fixtures are not semantic approval. Preserve requiresHumanReview=true and coverageComplete=false.
- Missing credential is not necessarily missing ability: offer officially accepted tests (e.g. Duolingo English Test ONLY if the specific program explicitly accepts it), accepted alternatives, official provider links and a question to the institution when acceptance is unverified.
- Future document authenticity: label as 'officially verified' ONLY with authorized issuing-institution verification response; AI visual inspection only 'automated inspection', never official proof.

## Delivery stages and acceptance gates
1. Update product/privacy/threat-model decisions and establish precise Meta Terms/geographic decisions. No candidate changes.
2. Implement isolated family data model and authenticated guardian-scoped authorization with negative tests.
3. Implement minor-mode deterministic catalog/filter UX in en/fa/ps and accessibility/responsive checks.
4. Implement single server-side policy gate for all model calls, fail-closed semantics and zero-call denial tests; inspect all routes and queue/background jobs.
5. Separate operator-only synthetic benchmark harness from real-user flows; human review and governance.
6. Re-run Node, offline evaluation, emulator, browser/axe, build, native helper and CI on new branch; publish exact verified counts, no mock-as-live claims.
7. Require owner approval for any merge, public deployment, credential/billing change, or hackathon submission.

## Current verified baseline (historical PR assertions, not rerun on this branch)
Draft PR #22: 129 Node tests, 42 offline assertions, 15 browser cases, build and typography probe passed; Firebase Emulator and live Meta/Google not run in that PR.
PR #21: CI evidence of 47 emulator checks; documented previous real Meta inference in Checkpoint 15 on muse-spark-1.3. Do not repeat paid inference merely to reconfirm that checkpoint.
