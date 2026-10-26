# BursYar — Hackathon MVP implementation brief

Status: planning baseline; production architecture and CTO-generated source code have NOT been verified.

## Mission
Help Afghan youth and women understand legitimate international scholarship opportunities in English, Dari/Persian and Pashto, on low-bandwidth devices. This hackathon feature is an AI translation and simplification engine, not a generic machine translation demo.

## Existing work to preserve
- CTO workspace/project named BursYar reportedly includes scholarship research, search filters and Dari/Pashto pages. These claims require source-code and test verification.
- The GitHub repository is currently near-empty. Recover/export CTO work **before** implementing a replacement frontend.
- FlutterFlow, Firebase, Render and Meta API accounts have been reported active; actual project links and runtime integrations remain unverified.

## MVP acceptance criteria
1. Public searchable scholarship listings with source URL, provider, deadlines, country, degree level, eligibility and last-verified date.
2. AI produces structured, source-grounded simplified English + Dari/Persian + Pashto with explicit uncertainty for unsupported claims.
3. Display authoritative source link and original excerpt; generated translations are clearly labeled as AI-assisted.
4. Human-review workflow: drafts are never published automatically. Never invent grants or infer eligibility as certain.
5. Cache approved translations in Firestore for fast reading on slow mobile networks; pagination and small payloads.
6. End-to-end language switching and correct RTL for Dari/Persian and Pashto, including dates, numbers, and mixed-language text.
7. Basic accessibility, responsive mobile design, loading/error states and offline-friendly cached reads when feasible.
8. Show a working Meta model inference through a secure server-side adapter; record model name, provider, inference timings and errors without logging secrets or personal data.
9. Test parsing, source attribution, translation quality, Firestore authorization rules and rate limiting.
10. Provide reproducible deploy instructions, demonstration flow and a clearly scoped hackathon submission.

## Preferred boundaries
- FlutterFlow: optional mobile UI builder; use its output only if code export and integration feasibility are confirmed.
- Firebase Authentication and Cloud Firestore: managed auth and persisted approved data, with least-privilege Firestore security rules.
- Backend: a single secure server-side endpoint calling the Meta model API, provider-agnostic adapter, strict schema validation, input size limits, quotas and retry ceilings.
- Render: use only if necessary after cost and capability comparison; avoid redundant hosting.
- GitHub: source of truth, feature branches and PR review.

## Security constraints
- Never include Meta API keys, service-account JSON, Firebase Admin credentials or provider tokens in frontend, Git history, logs or screenshots.
- No unauthenticated create/update/delete access to scholarship data.
- Only designated reviewers/admins can approve publication.
- Do not expose unrestricted LLM inference or allow arbitrary URL fetches without SSRF protections.
- Limit API budgets and prevent runaway calls. Start with mock output when provider integration is unverified.

## First actions
- [ ] Export CTO BursYar code, asset files and build instructions; commit to a feature branch, NOT blindly to main.
- [ ] Inventory existing features, dependencies, tests and source-of-truth data.
- [ ] Identify actual Firebase project ID and FlutterFlow project ID without transmitting credentials.
- [ ] Verify official Meta model provider/API docs and available credits before integration.
- [ ] Implement a narrow, testable end-to-end demo using one real scholarship document.
- [ ] Test security, accuracy, RTL, load/performance and finalize submission materials.

## Decisions to defer until code audit
- Whether CTO frontend, FlutterFlow output or a conventional Flutter/Next.js frontend is the primary client.
- Whether Firebase Cloud Functions, Cloud Run or Render hosts the backend.
- Whether Firebase billing upgrades are required.

No production database, credential, billing or deployment changes should be made based solely on this brief.
