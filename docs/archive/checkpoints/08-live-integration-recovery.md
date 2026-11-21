# Live integration recovery — 2026-10-27 (America/Vancouver)

Base: 0d854e00fc2652380e8d8c50f10c105b951730ae, current feat/firebase-inference-quotas integration branch. PR #7 was already merged into that branch; main remains behind the integration stack. Recovery work uses feat/live-integration-recovery and a new draft PR. Original ~/Documents/BursYar checkout and PID 14985 remain untouched.

## Root-cause evidence

The old engine/http.js swallowed every provider and normalizeEvidence error into HTTP 502. The provider adapter discarded HTTP status and all error categories. Consequently the reported historic authenticated 502 cannot be distinguished retrospectively between credentials/entitlement, provider validation/availability/timeout, malformed/truncated output or rejected evidence. Approximately 25 seconds is not proof of timeout. No original request payload, provider status or redacted diagnostic was available in this session.

Official Meta documentation confirms https://api.meta.ai/v1/chat/completions, Bearer authentication, developer messages, max_completion_tokens and choices[0].message.content/finish_reason. No speculative endpoint/protocol/model replacement was made. https://dev.meta.ai/docs/models documents authenticated GET /v1/models for account model availability. Account-enabled model cannot be verified from this agent shell: key, model, ADC path, project environment and approved ID token are not inherited. Connected Firebase MCP also has no authenticated user. No process environment, memory, history, private credential contents or existing Terminal output was extracted.

Original gateway still returns HTTP 200 {ok:true}; unauthenticated inference returns 401. These are liveness/auth-denial checks, not proof of provider connectivity. Original frontend was no longer listening on 5173. User-reported completed Google sign-in, demo claim and Firebase Admin setup are accepted as prior evidence and were not undone/repeated.

## Changes

Typed finite provider/evidence failures; structured allowlisted stderr fields only; timeout 504 versus provider busy/billing 503 versus invalid response/configuration/evidence 502; generic user error remains. No retries. Bounded optional server timeout (existing 20-second default, maximum 60 seconds) and coordinated 70/75-second gateway/client limits. Exact excerpt, funding, deadline and translation validation retained. Existing token verification/revocation, anonymous/claim/project guards and transactional SQLite reservations retained. Failure quota remains charged.

One-terminal launcher checks exact account-enabled model via GET /models, inherits existing credentials/quota path, recovers public web config through read-only existing ADC when possible, refuses occupied ports without killing them, and serves both services only on loopback. No real inference is automatic.

## Verification

- Clean npm ci succeeded with the locked dependencies; Node 24.13.0.
- Unit/security regression suite: 35 tests pass (29 existing plus 6 added).
- Production frontend build passes.
- Firebase Auth/Firestore emulators with isolated Java 21: 40 checks pass, fake provider only. Rules/Google emulator protocol/disabled and unapproved identities/cross-user and concurrent quotas verified. No production rule/IAM/claim changes.
- npm audit: zero reported vulnerabilities.
- Local browser suite attempted after installing matching Chromium in workspace; browser exits SIGTRAP before tests. CI browser/axe suite is required; now also checks safe 502/503/504 UI recovery for each language and width.
- Oxford source: direct Node/curl retrieval returns HTTP 403 from this environment. Official page is readable through web browsing and confirms course-specific December/January timing, full course fees, conditional full/part-time living support and historical 2025–26 stipend. No fixture or bypass substituted for a live request. https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants
- Live smoke runner refuses to run without explicit live-test gate/approved token; passed=false. No paid request or live success claim.
- Launcher syntax and missing-environment fail-closed path checked. Successful startup, catalog entitlement and remote config recovery remain credential-dependent and unverified.
- Human semantic/Dari/Pashto review remains PENDING_HUMAN_REVIEW with no invented reviewer approval.

## Consolidated owner action

In the existing Terminal that already holds the backend credentials, press Ctrl+C to stop only that BursYar backend, then run the prepared recovery launch command (provided with the handoff). Do not re-enter secrets or send them in chat. The launcher reuses the persistent quota database and starts both services. If account access succeeds, sign in through the existing Google flow and submit the official Oxford text once; the single result supplies all three languages. Preserve the safe failure record if it fails. Qualified reviewers must still complete the pending translation/semantic review. If the shell no longer retains an existing value, recover it only through its original secure credential mechanism; no new keys or setup are requested here.
