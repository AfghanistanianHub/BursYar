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
- Model failure, truncated/oversized output, invented excerpt → generic 502, charged reservation, no raw error/secret in response.
- Restart with same DB and verify budgets persist. Disable account/revoke token, verify denial.
- Verify one real official scholarship in all 3 languages; manually compare every interpretation to excerpts and source. Exact quote matching does not prove semantic entailment; prompt injection and conflicting deadlines require real model evaluation.

## Outstanding release gates
Live Firebase credentials/token/revocation checks, enabled provider/domain and approved demo users; Meta access/model/credit/limits; account spend cap; real source + bilingual human review; browser/RTL/keyboard tests; Firebase emulator rules tests; dependency audit; secure TLS/reverse proxy/persistent storage review. Do not deploy public API or mark demo operational before those checks. Existing static Render preview cannot execute this backend. No production rules changes required by these code changes.

Official references verified 2026-10-26:
- https://firebase.google.com/docs/auth/admin/verify-id-tokens
- https://firebase.google.com/docs/auth/admin/manage-sessions
- https://dev.meta.ai/docs/protocols/chat-completions
