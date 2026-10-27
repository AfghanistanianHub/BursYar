# Milestone 2 — identity verifier and durable reservation store

Date: 2026-10-26 (America/Vancouver)
Baseline checkpoint: a89e3098cff643ecb1c1336d71b96b7ffc7fc758
Branch: feat/firebase-inference-quotas, stacked on PR #5

## Completed
- Firebase Admin SDK verifier calls verifyIdToken(token, true): SDK signature/expiry/audience/issuer validation plus backend revocation/disabled-user check.
- Wrapper additionally pins project/issuer, requires bursyarDemo=true custom claim, rejects anonymous users, bounds header length, returns only UID.
- Refuses Firebase Auth emulator mode in executable inference verifier.
- SQLite WAL/FULL synchronous transaction reserves per-user minute/day, global day and lifetime units atomically; hashed UID keys; source/token content never stored.
- Absolute persistent DB path required; failures throw; no silent memory fallback. Multiple connections share caps. Lifetime budget does not reset on restart or day rollover.

## Test evidence
`npm test`: 19 passed. Added wrong-project, unapproved/anonymous/malformed/rejected-verifier tests; actual temporary-file SQLite reopen and two-connection quota tests, atomic rejection and daily/lifetime behavior. These auth tests inject verifier results; they DO NOT cryptographically verify real Firebase tokens.

## Remaining blockers
Primitives not yet wired into active HTTP path. No live ADC/Meta key/model ID. Persistent storage must be provisioned separately without changing billing; never deploy this on ephemeral disk. One SQLite database on one server instance only; no multi-host promise. Human translation/evidence review, live Firebase/Meta and emulator/browser QA outstanding.

## Exact next steps
1. Replace server entrypoint with injected testable HTTP factory using authenticate and QuotaStore.
2. Reserve full request bytes plus bounded completion units before any provider call; no refund on timeout/provider errors.
3. Fixed Meta URL, no redirects/retries, bounded response streaming and deadline; safe generic errors.
4. Add Firebase client login and bearer token flow; test endpoint without secrets using fake provider, real SQLite and injected verifier.

Commit SHA is recorded in Issue #4 milestone comment and PR; this checkpoint is included in that commit.
