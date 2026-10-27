# BursYar server-side inference

The active implementation is `server.js` → `http.js` with `auth.js`, `quota.js`, `meta.js` and `evidence.js`. Requires Node >=22.13 and root `npm ci`. Start from repository root, not this subdirectory.

Use [INFERENCE-RUNBOOK.md](../docs/INFERENCE-RUNBOOK.md) for exact setup and release gates. The active route is `POST /api/analyze` with a Firebase user ID token; shared internal tokens are no longer accepted. Approved demo custom claim is required. Durable SQLite reservations replace the earlier process counter.

The executable binds only 127.0.0.1 and fails startup if configuration is missing. No publicly deployed API. Missing credentials never produce fake analyses.

`engine.js` and `engine.test.js` retain the original PR #2 baseline and are not used by the active HTTP inference path. The current regression/handoff is documented in [checkpoint 04](../docs/checkpoints/04-regression-and-resume.md).
