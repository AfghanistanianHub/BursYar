# Milestone 5 — stack review and executable Firebase emulator validation

Date: 2026-10-26 America/Vancouver
Baseline: d20d11573f80626bd2c067d4f25156b149dcabbc (PR #6)
Continuation: feat/demo-verification, stacked on feat/firebase-inference-quotas

## Completed
Reviewed PR #2/#3/#5/#6 heads and dependency stack; see docs/PR-INTEGRATION-REVIEW.md. #2 is superseded and must not be merged independently. No PR merged/closed. Baseline 26 tests and Node22 CI run 40440091335 pass.

Added local-only Standard Firestore/Auth emulator config using demo-bursyar. No real project selected, no production Firebase edition/rules changed. Added CI job with Java21.

## Executed evidence
`PATH=<Java21>/bin:$PATH npm run test:emulator`: 40 checks pass against real local Firestore/Auth emulators, with fake model only. Includes public published-only read/query; denied anonymous/authenticated draft reads, unfiltered query, writes/update/delete, private logs, profile privilege spoofing and quota document writes; emulator Google IdP sign-in for three users; unapproved/disabled identity denial; concurrent same-user quota enforcement; ignored client UID/quota spoofing; independent second-user allowance. Actual transactional SQLite quota file is used.

SDK emulator tokens intentionally lack production signatures. These checks do NOT verify live Google OAuth popup, production Firebase project, real signed Google tokens, or Meta inference. Production createFirebaseVerifier continues to forbid Auth emulator environment.

Tool setup initially failed on Java17; downloaded Temurin JRE21 in scratch and reran successfully. An initial test-harness unhandled rejection from eagerly created denied promises was corrected to await each operation; final suite succeeds. No application rule changes were needed. Proposed rules audit is in docs/FIRESTORE-RULES-ASSESSMENT.json, not a production audit.

Added local verification dev dependencies and scoped patched uuid/OpenTelemetry overrides for Firebase CLI. npm audit reports zero vulnerabilities after fixes. Java21 is required for CLI15 Firestore emulator. Runtime engine still Node>=22.13.

## Next steps / blockers
Complete analyzer rendering and local browser suite; publish live official-source smoke runner. Real source retrieval from Oxford succeeded independently; real Meta request still blocked by absent API key/model/approved Firebase token/ADC/account spending caps. Human Dari/Pashto review pending. Latest Render service inspection still finds only static preview, auto deploy off, live commit 9626269; no backend or billing change.

SHA containing milestone is recorded in Issue #4 and draft PR comments; scripts reproducible from npm ci and Java21. No user action needed for emulator tests.
