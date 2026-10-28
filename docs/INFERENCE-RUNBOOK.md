# BursYar inference demo runbook

Status: implemented/tested with fake identity and provider at HTTP boundary; not live verified, not publicly deployed. Tracks #4; builds on #5. Node >=24.12 required (`node:sqlite`). Install from repository root using `npm ci`.

## Server path
Firebase Google sign-in → short-lived user ID token → same-origin POST /api/analyze → Admin SDK verification including revocation → project/issuer and bursyarDemo claim → input validation → atomic SQLite quota reservation → bounded Meta request → evidence validator → unreviewed result.

No client answers, tokens, source text or output are written to the quota DB. UID is SHA-256 hashed for accounting (pseudonymous, not anonymous). Model key and service account stay server-only. Source URL is attribution only and is never fetched. Backend accepts no user-provided model/endpoint.

## Local setup (requires authorized credentials)
1. Use `.env.example` only as a variable-name reference. VITE_FIREBASE_* values are public web configuration; they may be supplied to Vite through its process environment. Provision all server secrets through private process environment/secret storage outside the checkout. Do not write secrets to any repository file, including ignored .env files. NEVER add Meta/ADC/service keys to a VITE_* variable.
2. Set server environment: FIREBASE_PROJECT_ID; GOOGLE_APPLICATION_CREDENTIALS pointing to an existing private file outside repository; META_API_KEY (or MODEL_API_KEY); exact META_MODEL_ID verified in Meta dashboard. No fallback model.
3. Set BURSYAR_QUOTA_DB to an absolute path in an existing private persistent directory. SQLite is for ONE server instance on ONE persistent disk. Do not deploy on ephemeral disk, duplicate replicas, or copy/reset the DB to reset quotas. A Render persistent disk may require billing; do not create one under current authorization. Multi-host needs shared transactional storage.
4. Explicit positive limits: BURSYAR_USER_MINUTE, BURSYAR_USER_DAY, BURSYAR_GLOBAL_DAY and BURSYAR_LIFETIME_UNITS. Reservations use entire prompt UTF-8 byte count + 4000 maximum completion units. This is a conservative token-work cap, NOT a currency budget. Confirm model pricing and account-level spend cap externally before live use. Failures/timeouts consume reservations; no retries/refunds. Lifetime limit never rolls over.
5. BURSYAR_ORIGIN must be exact frontend origin, default example http://localhost:5173. Executable binds only 127.0.0.1; no public bind option.
6. Firebase Google sign-in must already be enabled and localhost authorized. An authorized Firebase administrator must grant `bursyarDemo: true` to selected demo accounts using trusted Admin tooling, preserving other claims; this code does not mutate claims or Firebase settings. Refresh user token after claim assignment. Anonymous users are rejected.
7. `npm run start:engine` and in a second terminal `npm run dev`. Vite forwards /api to loopback port 8080; if PORT is changed, update the local Vite proxy accordingly. Sign in via Google and paste official public scholarship text and HTTPS URL. Tokens are kept in memory, not localStorage.
8. `GET /health` means process liveness only, not Meta/Firebase operational readiness. Check real authenticated inference separately.

## Negative verification before any demo release
- Missing/expired/revoked/wrong-project/anonymous/unapproved token → 401 and zero inference calls.
- Wrong origin → 403; invalid request → 400/413/415.
- Exhausted user/global/lifetime quota → 429; storage unavailable → 503; no provider call.
- Provider timeout → generic 504; provider billing/rate-limit/unavailability → generic 503; invalid provider output, upstream credentials/model/request failures and rejected evidence → generic 502. All consume the reservation and return only Analysis unavailable. Structured stderr records contain a random requestId, stage, fixed code, numeric providerStatus and elapsedMs; never raw provider errors, source, output, identity or credentials.
- Restart with same DB and verify budgets persist. Disable account/revoke token, verify denial.
- Verify one real official scholarship in all 3 languages; manually compare every interpretation to excerpts and source. Exact quote matching does not prove semantic entailment; prompt injection and conflicting deadlines require real model evaluation.

## Outstanding release gates
Live Firebase credentials/token/revocation checks, enabled provider/domain and approved demo users; Meta access/model/credit/limits; account spend cap; real source + bilingual human review; browser/RTL/keyboard tests; Firebase emulator rules tests; dependency audit; secure TLS/reverse proxy/persistent storage review. Do not deploy public API or mark demo operational before those checks. Existing static Render preview cannot execute this backend. No production rules changes required by these code changes.

Official references verified 2026-10-26:
- https://firebase.google.com/docs/auth/admin/verify-id-tokens
- https://firebase.google.com/docs/auth/admin/manage-sessions
- https://dev.meta.ai/docs/protocols/chat-completions


## Recovery launcher (2026-10-27)

`npm run start:demo` runs from the existing credential-bearing shell after stopping only its original BursYar backend with Ctrl+C. It inherits all credentials and the exact persistent quota path/caps; never extracts a running process environment or reads Terminal history. It checks the configured model through authenticated `GET https://api.meta.ai/v1/models` without generating a completion. The configured model must appear; no fallback is selected. Public Firebase VITE configuration is inherited or retrieved using the existing ADC and read-only Firebase Management API when exactly one web app exists. Missing access fails safely without modifying permissions. Both services stay on loopback, use one terminal and stop together with Ctrl+C. It never performs an automatic paid inference or retry.

`META_TIMEOUT_MS` is optional: default 60000 ms, bounded to integer 1..120000 ms. The Mac launcher accepts this single allowlisted environment override without changing the Keychain record or spending cap. The gateway socket ceiling is 130000 ms; frontend and live runner allow 135000 ms. The 4000 completion-token cap, workload reservations, request/response bounds and no-retry policy are unchanged. Abandoning a browser request aborts local provider work and retains the quota reservation; provider-side cancellation/billing cannot be guaranteed. See [the timeout investigation](META-TIMEOUT-INVESTIGATION.md).

Provider failures now include an allowlisted `provider` diagnostic object: phase (`awaiting_response_headers`, `response_headers`, `reading_response_body`, `validating_response`), configured deadline, request/message bytes, input code-unit count, observed header/first-body-byte times, response bytes and recognized model ID (other values are labeled `other_configured_model`). `timeoutCause` distinguishes `local_deadline`, `caller_cancelled` and `provider_http_504`. Local deadlines preserve an observed HTTP status, including 200 during a stalled body; do not infer origin from status null alone. Only known transport error codes are retained. DNS/connection/TLS/generation cannot be separated retrospectively from the old log or from the fetch pre-header interval. `npm run diagnose:meta-network` is an unauthenticated TLS/status probe, not an inference. `npm run diagnose:meta-size` uses synthetic inputs only. No source text, tokens, credentials, raw errors, arbitrary headers or abort reasons are logged.

Current Meta protocol/model/error references: https://dev.meta.ai/docs/protocols/chat-completions ; https://dev.meta.ai/docs/models ; https://dev.meta.ai/docs/error-handling . The endpoint and existing chat request parameters are supported; the actual account-enabled model and historic failure remain unverified until the existing shell runs the check and an approved real request completes. Do not relabel mock success as live success.

For recovery after Terminal sessions are lost or macOS reboots, use MAC-REBOOT-STARTUP.md. `start-bursyar.command` / `npm run start:mac` load the narrowly named Keychain entry and retain the original private ADC and quota database. The executable gateway now rejects paid inference before quota reservation unless explicit spending confirmation, positive USD limit and confirmation timestamp are present. Older manual `start:engine` instructions must also supply that confirmation; do not invent it from promotional credit.
