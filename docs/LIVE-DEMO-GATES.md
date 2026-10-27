# Exact remaining user intervention / live demo gates

No routine approval is needed for local emulator, mocked integration, unit or browser tests. None of these prove live Meta inference or production Google sign-in.

## Secure provisioning needed from account owner
Use the machine/process secret environment or an existing hosting secret manager. Do not put secrets in chat, GitHub issues, any repository files (including ignored .env files), screenshots or browser logs. This session has no Firebase/Meta connector or credentials.

| Configuration | Where / action | Secret? |
|---|---|---|
| META_API_KEY or MODEL_API_KEY | Existing Meta developer account, server-only process environment | Yes |
| META_MODEL_ID | Exact model enabled for your account; official docs list muse-spark-1.3, but account access is not verified | No |
| Account credit and spend cap | Confirm existing Meta credit and hard account/project limit; do not upgrade billing | Account-owner action |
| FIREBASE_PROJECT_ID | Existing intended Firebase project ID; same project as frontend | No |
| GOOGLE_APPLICATION_CREDENTIALS | Private pre-existing credential file outside checkout, or authorized application-default credentials | File contents secret; do not upload here |
| VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID | Existing Firebase Web app public config | Public identifiers only |
| Google Auth provider and domain | Verify existing Google provider enabled and localhost allowed; authorized Firebase admin if missing | Configuration action, no production rules change |
| Approved demo user | Existing Google account with bursyarDemo=true custom claim via trusted authorized admin, preserving other claims | Admin intervention; no account created/changed by this session |
| Persistent quota path and caps | Existing private local persistent directory plus explicit user/global/lifetime limits from .env.example | No purchase or Render disk provision needed for local demo |

After provisioning, launch the loopback server and Vite as described in INFERENCE-RUNBOOK.md, sign in with the approved Google account and submit official public scholarship text. This is the preferred demonstration and requires no manual token copying.

## Reproducible official-source live smoke test
`npm run test:live` is opt-in: requires BURSYAR_LIVE_TEST=1, BURSYAR_TEST_ID_TOKEN from a secure environment (never browser console/logs/chat), and local real gateway on port8080. It fetches Oxford's official Clarendon applicant page, checks required source markers/size, sends one request through actual authenticated/quota gateway, checks source digest/excerpts, funding evidence, course-specific deadline and all three translation fields. JSON reports and public model output remain in ignored verification/artifacts for human review. One response contains all three languages; this avoids three billable requests. The normal frontend can switch languages without another API request.

The test never supplies fake identity/provider replies. It fails rather than skips when preconditions are missing. Current result: BLOCKED, not passed. A token from the Auth emulator is not acceptable to the production verifier. A schema pass does not approve semantics or translations.

## Official references checked 2026-10-26
- https://dev.meta.ai/docs/protocols/chat-completions: POST https://api.meta.ai/v1/chat/completions; developer/user messages; choices[0].message.content; finish_reason stop; bounded max_completion_tokens.
- https://dev.meta.ai/docs/models: documented muse-spark-1.3 Standard mode (no fallback to Contributor mode).
- https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants: source fetched successfully, 5098 normalized characters, SHA256 4495f33629ce1aedf5c705a3b6ef8193c938aac7ee6e9e4031af6ce42116da19 at 2026-10-27T02:53:26.629Z. Course deadlines vary; do not invent a calendar date. Stipend amounts may refer to a historical year. This is a retrieval record, not institutional approval of BursYar interpretations.

Human English/Dari/Pashto review tracked in TRANSLATION-REVIEW.json. Never mark it complete automatically.

## Hosting status
Confirmed SAM's workspace: only static bursyar-web-preview, auto deploy off, live commit9626269. No inference backend exists. Local demo is the immediate path without new spending. Public hosting remains blocked pending verified live authentication/revocation, abuse/spend limits, persistent storage, TLS/proxy and human review. No deployment or billing change made.
