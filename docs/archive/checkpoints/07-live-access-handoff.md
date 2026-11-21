# Milestone 7 — verified independent work; live access handoff

Date: 2026-10-26 America/Vancouver
Verified implementation: b0b0c7ef8620234916f384417bfa7fed755af94c
Branch: feat/demo-verification, draft PR #7 stacked on #6

## Verified results
- Full CI succeeds at b0b0c7e: https://github.com/AfghanistanianHub/BursYar/actions/runs/40441611215 . All jobs pass: verify (29 tests/build), emulator, browser.
- Local Node24.22.1/npm11.9 clean install succeeded. Original26 tests preserved and3 regressions added;29 pass.
- Local Java21 Auth/Standard Firestore emulators40 checks pass, including Google emulator IdP, unauthorized/disabled access, published-only reads, denied privilege/quota spoofing, concurrency and cross-user quotas. Fake model; no live Firebase/OAuth verification claim.
- Local Chromium+axe12 cases pass across3 languages ×4 widths, no overflow/detected WCAG A/AA violations; keyboard/loading/error/English-alongside-RTL/PathFinder/source retention/analysis reuse verified. Auth/API intercepted. Automated axe is not a full manual accessibility audit.
- npm audit: zero reported vulnerabilities. git diff --check passes.
- Oxford official source retrieved successfully;5098 normalized chars, source digest4495f33629ce1aedf5c705a3b6ef8193c938aac7ee6e9e4031af6ce42116da19. Live smoke runner implemented but real run BLOCKED; no Meta key/model/ADC/approved ID token present.
- Human translation/semantic review remains pending in docs/TRANSLATION-REVIEW.json.
- Render has only older static preview9626269; no backend, auto deploy off. No deploy/billing/production rules/claims changes made.

## Exact owner action required now
Securely provision server process environment outside repository: META_API_KEY or MODEL_API_KEY; exact account-enabled META_MODEL_ID; FIREBASE_PROJECT_ID and authorized Firebase ADC (GOOGLE_APPLICATION_CREDENTIALS pointing to private file outside checkout, or platform ADC). Confirm existing Meta credit and hard spend cap; no billing upgrade.
Provide public VITE_FIREBASE_API_KEY/PROJECT_ID/AUTH_DOMAIN as frontend build/dev environment. Verify Google provider/localhost domain and approved Google demo user with bursyarDemo=true claim via authorized Firebase admin. No production Firestore rules deployment is needed. Never send secrets in chat, GitHub, repository files (even ignored .env), screenshots or browser logs.

## Exact next steps
1. Fetch feat/demo-verification, read docs/LIVE-DEMO-GATES.md and docs/INFERENCE-RUNBOOK.md. Use Node>=24.12/npm11.9, Java21 for emulator tests.
2. With secure environment and existing persistent private SQLite directory/caps configured: npm run start:engine; npm run dev. Approved user signs in through real Google popup. Paste official university source; one result carries all3 languages and switching does not spend again.
3. Optionally run npm run test:live with BURSYAR_LIVE_TEST=1 and approved short-lived BURSYAR_TEST_ID_TOKEN from secure environment, gateway localhost8080. Script uses real gateway, retrieves official source and writes only redacted report/public analysis into ignored verification/artifacts. No simulated fallback.
4. Record actual latency/schema/evidence; verify live disabled/revoked/wrong-project identity and quota persistence/outage behavior. Human reviewers assess source interpretation, negative/optional document conditions, course-specific deadlines, historic funding figures and Dari/Pashto semantics. Do not auto-approve review status.
5. Public hosting remains deferred until live auth, abuse protection, spending cap, TLS/proxy and persistent single-instance store are verified. No paid resource provision or security-rule deployment authorized.

This checkpoint commit is documentation-only after the verified implementation. Its SHA is recorded in Issue4/PR7 comments. All executable independent work above is saved and reviewable; real integration is not called successful.
