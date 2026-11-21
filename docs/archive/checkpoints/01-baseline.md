# Milestone 1 — verified baseline

Date: 2026-10-26 (America/Vancouver)
Repository: AfghanistanianHub/BursYar
Source: PR #5, feat/evidence-grounded-analyzer at a4b224762ac77509fa53a092d2d5b7fbc3450dfd
Tracking: Issue #4
Continuation branch: feat/firebase-inference-quotas (stacked on PR #5)

## Evidence
- Fetched branch from GitHub; working tree clean; no AGENTS.md in checkout.
- `npm test`: 16/16 passed on Node 24.22.1.
- `npm run build`: Vite 6.4.5 passed.
- PR #5 draft/mergeable; no changes to original scope or production systems.

## Findings
- Active engine only supports shared server token, no Firebase user identity.
- Rate and process call counters reset on restart; no durable budget.
- Frontend same-origin API contract has no authentication implementation.
- Evidence excerpts are exact-match checked but semantics/translations are not human verified.

## Exact next steps
1. Implement Firebase Admin verifyIdToken(token, true), project pinning and demo access claim.
2. Replace in-memory quota with transactional SQLite reservations: per-user minute/day, global day/lifetime, bounded units reserved before inference; no refunds on errors.
3. Test restart persistence, multiple connections, rejected authentication and failed storage/provider.
4. Add Meta adapter bounds, client auth integration and mock-provider end-to-end test.

## Remaining external blockers
No Meta key/model ID or Firebase ADC available in runtime. Live inference, real Firebase verification, official-source evaluation and human translation review remain unverified. No billing/rules/deploy changes authorized or performed. SQLite requires a persistent local volume and one server instance; multi-host requires shared durable store.
