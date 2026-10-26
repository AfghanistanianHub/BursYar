# BursYar AI engine (isolated MVP)

A minimal Node.js server foundation for scholarship guideline simplification and translation. This is **not yet production ready**. It does not fetch external URLs, write Firestore, authenticate Firebase users, or publish any scholarship automatically.

## Run locally
Use Node 20+:
```sh
cd engine
npm test
BURSYAR_INTERNAL_TOKEN="$(openssl rand -hex 32)" npm start
```
GET `/health` checks readiness. POST `/v1/analyze` expects:
```json
{"text":"At least 30 characters of official scholarship text...","language":"fa"}
```
with `Authorization: Bearer <BURSYAR_INTERNAL_TOKEN>`. Without provider configuration it returns 503 rather than presenting fabricated AI output.

## Provider adapter
Configure `META_MODEL_ENDPOINT`, `META_API_KEY`, and `META_MODEL_ID` **server-side only**. The current adapter expects an OpenAI-compatible chat completions request/response. **Do not assume Meta's actual endpoint is compatible**: verify the official API specification and adapt the request/response format before any real inference. Never expose this endpoint directly to browsers or FlutterFlow with a shared secret. Place Firebase ID-token verification, per-user quotas and Firestore security controls in front of it first.

## Required before deploy
- Verify official Meta API request shape, authentication, supported response-format options, model and cost.
- Add Firebase Auth JWT verification with correct issuer, audience and signature checks (or use Firebase Admin SDK securely).
- Add per-user and per-IP rate limits, spend caps, observability and abuse controls.
- Add approved-source provenance and a human review workflow, then Firestore storage with least-privilege rules.
- Add real-world accuracy tests in English, Dari/Persian and Pashto plus accessibility testing.
- Do not deploy publicly until reviewed.

This engine is intentionally isolated to avoid replacing CTO's earlier BursYar work if that source becomes available.
