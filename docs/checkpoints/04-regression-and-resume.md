# Milestone 4 — regression verification and handoff

Date: 2026-10-26 (America/Vancouver)
Previous implementation commit: 29d86578a60c2bfa0d467bcc5dfbfde2df4d9c25
Draft PR: https://github.com/AfghanistanianHub/BursYar/pull/6
Issue: https://github.com/AfghanistanianHub/BursYar/issues/4
Branch/base: feat/firebase-inference-quotas / feat/evidence-grounded-analyzer

## Test evidence
- `npm ci --no-audit --no-fund`: clean installation succeeds.
- `npm test`: 26/26 pass on Node 24.22.1.
- Actual Firebase Admin SDK rejects malformed and unsigned tokens without credentials. Successful signed token/revocation lookup remains unverified.
- Three independent worker processes race to reserve final global allowance from the same SQLite file: exactly one succeeds, two denied.
- Real SQLite reopen/multiple-connection, mocked-identity/provider HTTP flow, invalid evidence/provider and quota fail-closed tests pass.
- `npm run build`: succeeds without Firebase configuration.
- Build with dummy public VITE_FIREBASE_API_KEY/PROJECT_ID/AUTH_DOMAIN also succeeds, exercising lazy Firebase bundles. Not a live login test. Main JS gzip ~7.9KB; lazy Firebase auth ~39.4KB plus app module ~10.9KB.
- `npm audit --json`: zero vulnerabilities after overriding transitive @grpc/grpc-js to ^1.13.6 (resolved 1.14.6). Previously Firebase umbrella package brought 1.9.16 with GHSA-m9gg-hp2v-232j/GHSA-f596-whhp-79r4. No force-downgrade of Firebase. Deprecation notices remain; zero known audit findings is not proof of security.
- Node22 GitHub CI passed implementation commit 29d8657: https://github.com/AfghanistanianHub/BursYar/actions/runs/40439754753 . Final regression commit CI must be checked separately; final status recorded in Issue #4/PR #6.
- CI now uses npm ci, honoring reviewed lockfile.

## Resume precisely
1. Fetch origin and check out feat/firebase-inference-quotas. Read docs/INFERENCE-RUNBOOK.md and this checkpoint; verify latest head and PR #6 CI. Run npm ci, npm test, npm run build. Node >=22.13 required.
2. Keep PR #6 stacked on PR #5. Do not merge older experimental engine independently or publish engine to Render static service.
3. Securely provision existing Firebase ADC, exact project ID, public web config and approved demo user (bursyarDemo=true). Enable/authorize Google login only through authorized Firebase administration; do not change production Firestore rules. No secrets in chat, Git, VITE_* or logs.
4. Securely provision Meta key and exact available model ID; verify credit, request limits and account spend cap without upgrading billing. Runtime currently has NO key/model/ADC. Use existing persistent private local disk path; do not purchase Render disk. Set explicit caps from .env.example; run node --env-file=.env engine/server.js and npm run dev.
5. Sign in with approved user; paste a real official scholarship and URL. Record response schema, provenance/unknowns and latency without sensitive headers, tokens or credentials. Test revoked/unapproved user, exhausted quota, restart persistence and provider outage. Quota units are token-work bounds, not dollar limits.
6. Review all translations and semantic evidence with Dari/Pashto speakers. Test prompt injection and conflicting dates against live model. Complete browser 320/390/768/1440 RTL/keyboard checks and Firebase emulator rules tests.
7. Only after all release gates: review persistent hosting/reverse proxy TLS and authorization. Current entrypoint only binds loopback. No publicly deployed backend yet. Single-server SQLite is not suitable for replicas or ephemeral disks.

## Constraints retained
No CTO dependency; no billing upgrades; no production Firebase rule changes; no credentials committed; no public API deployment; no human verification claims for model output.

The SHA containing this checkpoint is in Issue #4 and PR #6 milestone comments (avoids self-referential commit hash).

## Documentation consistency follow-up
Root README and engine README now point to the active Firebase route/runbook and no longer describe shared-token authentication as current. This documentation-only follow-up does not alter the tested implementation. Final commit and CI status are recorded in Issue #4/PR #6.
