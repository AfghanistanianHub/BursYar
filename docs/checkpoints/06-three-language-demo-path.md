# Milestone 6 — three-language demo path and real-source smoke preparation

Date: 2026-10-26 America/Vancouver
Previous checkpoint: 47e9faa10a423ce349876b68034ebc677582dcaa
Branch: feat/demo-verification; draft PR #7 stacked on #6

## Completed
- Analyzer now shows funding, unknowns, source URL/digest, analysis time, unreviewed status and original English alongside Dari/Pashto.
- PathFinder labels/actions localized across all three languages. Only explicitly mandatory criteria (required=true) can flag missing documents; optional/exempt/unknown requirements cannot. No eligibility probability or unsupported alternatives.
- Ephemeral typed source and completed analysis survive language/search rerenders. Switching language reuses the returned three-language analysis, avoiding new inference charges. Source/answers/results are not persisted to storage.
- Source URL and long digest layout constrained; small text contrast corrected; loading, quota/401/503/general errors localized. Sign-out aborts request and clears result.
- Browser suite uses actual app with test-only intercepted auth/API and axe; no production bypass flags. Browser CI added.
- Oxford official Clarendon source loader and opt-in real-gateway live smoke runner implemented. No fake success fallback. Source retrieved successfully (5098 normalized chars, digest in LIVE-DEMO-GATES.md). Runner checks all three translation fields, excerpts, course-specific deadline, funding and provenance. Human semantic/translation review remains explicitly pending in TRANSLATION-REVIEW.json.

## Evidence
- `npm test`: 29 tests pass (original26 preserved plus source parser/language/exemption regressions).
- `npm run build`: passes.
- Browser suite: 12 cases across en/fa/ps × 320/390/768/1440, no overflow, zero detected WCAG A/AA violations, keyboard label/order, loading/error states, original English, PathFinder and source retention. Test auth/API are mocked, not live OAuth/Meta. A further final CI/local regression verifies analysis reuse.
- Actual Auth/Firestore emulators: 40 checks passed at milestone5 (fake model), proposed production rules unchanged.
- Live smoke runner executed without opt-in/credentials: exits1 and records BLOCKED, not passed. No real Meta request sent.
- Meta documentation verifies endpoint/response and documented muse-spark-1.3 availability; account-specific access/credit remain unverified.
- Render inspection unchanged: static preview at9626269, auto deploy off, no backend.

## CI issue and correction
First expanded CI run40441279695 failed during npm ci, before tests: Node22/npm10 + scoped transitive override lock mismatch, plus current Firebase SDK13/rules-testing6 require Node>=24.12. Current source/CI/docs now require Node>=24.12 and npm11.9, matching local Node24.22.1/npm11.9 clean install. All jobs pinned to npm11.9. No failing CI is represented as passing; final CI results recorded in Issue4/PR7 comments.

## Exact next steps and owner action
1. Check latest PR7 CI (unit/build, Java21 emulators, Chromium browser); fix any actual failures, keep draft.
2. Account owner securely provisions existing Meta key/model and confirms hard spending cap/credit; existing Firebase ADC/project/public Web config, enabled Google provider/local domain, approved demo user custom claim. Exact variables/actions in docs/LIVE-DEMO-GATES.md. Never send values in chat/GitHub or put server credentials in VITE_*.
3. Run loopback real engine + Vite; approved user signs in and submits official source. No need to copy tokens for frontend demo. Optional `npm run test:live` additionally needs opt-in and approved ID token in secure environment. One request yields all3 languages.
4. Record redacted status/latency/provenance; test live revocation/quota/provider outage; human-review English/Dari/Pashto output and deadline/funding limitations. Browser mock tests do not satisfy these gates.
5. Public deployment remains blocked: verify abuse/currency limits, persistent hosting and TLS/proxy; no new paid resources or production rule changes. Local demo needs no hosting purchase.

This commit's SHA is in Issue4/PR7 milestone comments. No deployment, billing, production rules or user-claim mutation performed.
