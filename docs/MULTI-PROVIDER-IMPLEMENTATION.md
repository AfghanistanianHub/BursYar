# BursYar multi-provider implementation checkpoint
Date: 2026-10-29. Status: prototype policy only — NOT integrated with HTTP or deployed.

## Verified constraints
Meta: https://dev.meta.ai/legal/geographic-use-policy — Afghanistan, Iran and Pakistan restricted; requires adult users and adult-targeted integrated product (https://dev.meta.ai/legal/terms-of-service). Standard only for user content; Contributor models are excluded from all production user flows.
Gemini: https://ai.google.dev/gemini-api/terms — age 18+; API clients directed toward or likely used by under-18s are prohibited. Geographic eligibility must be checked. https://ai.google.dev/gemini-api/docs/available-regions lists Pakistan, not a blanket global approval. https://ai.google.dev/gemini-api/docs/pricing indicates free-tier content may be used for model improvement, so do not route private student content on that basis.
Qwen3: https://github.com/QwenLM/Qwen3 — open-weight Apache 2.0 models; independently deployed models still require local-law, sanctions, infrastructure security, privacy and license review. Do not claim self-hosting circumvents law.
No route uses VPN/proxy evasion; no provider gets data merely because a second API happens to accept a request.

## Current implementation
engine/provider-policy.js pure decision API supports Meta Standard, Gemini placeholder, separately reviewed self-hosted Qwen and no-provider deterministic mode.
'gemini-approved' and 'qwen3-local' are deliberate internal placeholders, NOT current provider API model IDs and do NOT make any provider requests.
Application flow must never trust browser-submitted age, geolocation, review flags, model selection or consent. A real trusted policy service and audited server-side subject/guardian binding are prerequisites.
A separate minor-facing product boundary may be needed because Meta/Gemini terms restrict *products* for minors, not merely individual API calls. Legal review is required before using either API within a shared minor-accessible product.

## Next engineering integration
1. Audited server-side context service: confirmed user subject, verified provider product audience, allowed-region decision with freshness, adult status, consent and contract tier, not client assertions.
2. Gateway enforcement before quota reservation, prompt construction and model invocation; deny (or use explicitly lawful non-AI route) on uncertain context, with zero outbound provider calls in negative integration tests.
3. Add actual approved Gemini adapter only in a separate task, using documented model ID, server-only secrets, paid/no-training terms for any personal content, timeouts, quota budgets and evidence validation.
4. Vet and benchmark low-cost Qwen3 self-hosted stack for eligible audiences/jurisdictions; do not deploy a remote endpoint until security/privacy compliance and hosting budget pass.
5. Dedicated guardian/minor scoped storage/consent/authorization; no Meta or Gemini for under-18 service without express provider authorization.
6. Compare source-grounded scholarship extraction, false eligibility, unknown criteria, language review (en/fa/ps), latency and real costs. No fabricated provider test success.
7. Run all Node tests, Firebase Emulator, offline evaluation, browser/accessibility matrix, build and CI; no merge/deploy until all gates pass.

## Privacy
Document-first onboarding must require review and approval before claims enter profile. Official issuer verification only with authorized issuer mechanism. Public-source synthetic benchmark must be separate from real user data and cannot contain indirectly identifying data.

## Cost control
No API keys, billing modifications or live API calls included. No automatic provider fallback to a billable service.

## Mission 2 implementation (supersedes prototype status above)
The gateway now binds trusted policy to exact configured adapters; separate Meta, Gemini and local Qwen adapters are disabled without explicit configuration. Private server records have identity, consent, verification and expiry checks. Meta restricted countries cannot be overridden by the region allowlist. Family-enabled deployments disable Meta and Gemini entirely. Credentials remain environment-only; no provider was activated or called live.

Authenticated deterministic catalog, evaluation, profile, document, export and erase APIs support guardian-scoped identities. Academic scores, degree, language, explicit exemptions, documents, submission deadlines and funding conditions retain unknown outcomes for absent/conflicting/unsupported evidence. Default Oxford exclusions are a partial official-source review and cannot produce overall met. Catalog review expires; broader program curation remains required. The en/fa/ps interface exposes local assessment and scoped degree saving; full guardian document actions are API functionality.

Configuration: BURSYAR_PROVIDER_CONFIG, BURSYAR_POLICY_RECORDS, BURSYAR_FAMILY_GRANTS and BURSYAR_REVIEWED_CATALOG reference absolute owner-only JSON files. No browser write API provisions trusted evidence or guardian grants. Provider configuration requires enabled, provider, model, models, regions, audience, termsReviewed, termsValidUntil (epoch milliseconds), privacyReviewed, consentVersion, dataClasses, maxReservationUnits, costReviewed, worstCaseUsdPerUnit, spendLimitUSD and spendingApproved. Existing spending confirmation remains required. Quota lifetime units are capped by the reviewed worst-case price and spend limit. Missing configuration leaves external providers unavailable. Actual verification service, legal/contract decisions and guardian authority verification remain owner provisioning responsibilities.

Local verification: restored baseline 139 passing Node tests; expanded suite 152 passing, 0 failing; 42 offline evaluation assertions; 47 Firebase Emulator checks; production build passes. Local Chromium exits SIGTRAP before tests; browser verification requires CI. All model tests use synthetic transports. No live provider accuracy, fluent translation approval or production verification is claimed.
