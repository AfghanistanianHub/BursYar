# BursYar AI engine — independent MVP foundation

Node 20+ HTTP service for simplified scholarship guidelines in English, Dari/Persian, and Pashto. This branch is isolated from CTO's paused project. Do not deploy publicly yet.

## Local setup

```bash
cd engine
npm test
export BURSYAR_INTERNAL_TOKEN="$(openssl rand -hex 32)"
npm start
```

To test actual Meta inference, set `MODEL_API_KEY` and `META_MODEL_ID` as **server-only** environment variables (never commit these values). API URL is fixed to the documented `https://api.meta.ai/v1/chat/completions`. Confirm the available model ID in the Meta dashboard; do not assume availability. The engine deliberately returns HTTP 503 if credentials are missing.

`GET /health` shows readiness. `POST /v1/analyze` requires bearer authentication and JSON with `text` (30–12000 characters) and `language` (`en`, `fa`, `ps`). Results are always flagged `requiresHumanReview: true`.

## Verified development tests

Three local unit tests passed with Node v22 on October 26, 2026. Tests cover request validation, prompt boundaries, and output parsing. **Live Meta inference, Firestore integration, deployment and end-to-end behavior have not been tested.**

## Security and release blockers

- Shared internal bearer token is **server-to-server only**; do not put it in FlutterFlow client apps or browser JavaScript.
- Current in-memory rate limiter is only one-process protection, not durable user-level budget enforcement.
- Implement Firebase ID token verification or a secure authenticated BFF, per-user quotas, distributed rate limits and spending limits before connecting real clients.
- Add official scholarship source attribution and human approval of all generated content.
- Add integration tests with Meta model and multilingual evaluation with real scholarship sources.
- Keep API keys and Firebase credentials out of GitHub and logs.
- The original CTO-generated code is not yet accessible. Evaluate and recover it before designing a replacement UI.

Meta documentation: https://dev.meta.ai/docs/protocols/chat-completions

This is a development milestone, not a released product.
