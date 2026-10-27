# Milestone 3 — authenticated HTTP inference and client contract

Date: 2026-10-26 (America/Vancouver)
Previous milestone: 278df5d893a4dbee5f9f3331092533d8ba42117e
Branch: feat/firebase-inference-quotas (PR stacked on feat/evidence-grounded-analyzer)

## Completed
- Active server replaces shared-token auth with Firebase ID-token verification, approved demo claim and non-anonymous identity.
- Durable user/global quota reservations precede inference. Storage failure blocks inference; provider failures consume reserved quota. Bound active requests, body size, request/header timeouts and exact Origin.
- Fixed Meta endpoint, redirects disabled, no retries, 4000 completion cap, 128KiB response cap and 20s timeout; rejects incomplete/non-JSON results. Source evidence validation remains mandatory.
- In-memory Firebase Google sign-in client passes user ID token to same-origin endpoint, never Meta/shared token. Vite development proxy targets loopback engine. No public backend bind.
- Added .env.example without values, Node minimum and detailed INFERENCE-RUNBOOK.md.

## Evidence
`npm test`: 24/24 pass locally (Node 24.22.1).
`npm run build`: passes (Vite 6.4.5). Empty Firebase configuration build is not a configured login verification.
HTTP tests: authenticated mocked identity/provider + real SQLite; evidence response, translations, quota exhaustion; unauthenticated/cross-origin/malformed/oversized/unsafe-URL rejection; storage failure prevents provider use; provider errors sanitized and quota retained.
Adapter tests: fixed URL/completion cap/no redirects; non-JSON, oversized, truncated and failed responses rejected.

## Blockers and exact next steps
1. Check PR CI on Node 22 (SQLite runtime compatibility) and run clean install/build; add process-concurrency quota regression.
2. Live Firebase signature/revocation verification is NOT yet tested. Obtain credentials through secure environment provisioning, enable approved Google provider/domain, assign bursyarDemo claim via authorized admin. Never paste secrets into chat or commit.
3. Configure exact live Meta model/key and account credit/spend cap through secure environment. No credentials currently present. Run single official-source request with approved user; record redacted status/latency/schema only.
4. Human-review Dari/Pashto against original official source, including missing/conflicting deadlines and source injection tests. Run browser 320/390/768/1440 + keyboard/RTL.
5. Production deployment remains blocked: persistent disk must exist without billing change; single-server SQLite only, no ephemeral/replicated deployment. Do not modify Firebase production rules.

No production settings, claims, rules, secrets, billing or deployments changed. Commit SHA is recorded in Issue #4 and the draft PR milestone comment.
