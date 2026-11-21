# BursYar

Scholarship clarity for Afghan applicants, in **English, Dari/Persian and Pashto**.

BursYar reads a scholarship's published requirements, shows what each rule actually asks for, and compares it with the applicant's own declared evidence. When a requirement cannot be decided from the available text, it says *unknown* instead of guessing. Every result is labelled for human review.

- Frontend: framework-free JavaScript SPA built with Vite (`src/`).
- Backend: Node ≥24.12 HTTP gateway (`engine/`) for authenticated analysis, quotas, source retrieval and private document/profile storage.
- Model providers are optional. Without one, the deterministic assessment path still works.

**Version:** 1.0.0 · **Licence:** MIT · **Node:** ≥24.12 · **Package manager:** npm 11.9

---

## Current state (verified 2026-11-21)

| Surface | Status |
| --- | --- |
| Backend `https://bursyar-api.onrender.com/health` | `200`, build `7dbd75f`, deterministic + document storage available, `inferenceVerified: false` |
| Frontend `https://bursyar.vercel.app` | **paused** — Vercel answers `503` with `x-vercel-error: DEPLOYMENT_PAUSED`; resume the deployment in the Vercel dashboard |
| Repository `main` | `e7e35b7` (post-`release/v1.0-closure` merge #122) |
| Test suite | 419 tests pass locally (`npm test`) |
| Production build | passes (`npm run build`) |

The paused frontend is a hosting state, not a code defect: the last deployment is READY and can be resumed. The backend health response above is the only live evidence recorded in this file; dated verification detail lives in [docs/HOSTED-BACKEND.md](docs/HOSTED-BACKEND.md).

## Scope of the 1.0 release

Shipped and verified:

- Trilingual reader with RTL layout, language persistence and a skip link.
- Evidence-first analysis: source excerpt → criterion → three-valued verdict (`met` / `not_met` / `unknown`), with signed source receipts and per-criterion provenance.
- Deterministic reviewed-scholarship assessment that needs no model provider.
- Private document and profile workflow (TXT only in production), with review history, export and erase.
- Credential-verification **requests** for 14 issuers, status tracking and withdrawal. No issuer connection exists; nothing is auto-verified.
- Durable quotas and private storage through SQLite (local) or Supabase (hosted).

Deliberately not claimed:

- No reviewed production scholarship catalog — listings are sample data and labelled as such.
- No production PDF/image OCR; binary intake is rejected client-side, TXT is the supported path.
- No issuer-authenticated credential verification.
- Dari/Persian and Pashto strings have **not** had fluent human review.
- No general claim of successful live model inference. One owner-approved Meta request is recorded; startup reports `inferenceVerified: false` by design.
- No offline mode and no server-side rendering.

## Architecture

```
Browser (Vite SPA, src/)
  │  same-origin /api/*, Bearer Firebase ID token
  ▼
Vercel static hosting + rewrite (vercel.json)
  │
  ▼
Render Node gateway (engine/, bursyar-api.onrender.com)
  ├── Firebase ID-token verification (aud, iss, demo claim, account status)
  ├── provider policy + spending/unit quotas (SQLite or Supabase)
  ├── source retrieval (SSRF-guarded, signed receipts)
  ├── evidence validation and three-valued evaluation
  └── private documents / profiles / verification requests
        │
        └── optional model provider (Meta Muse / Gemini / self-hosted)
```

## Repository map

| Path | Contents |
| --- | --- |
| `src/` | Frontend modules, copy tables (`i18n`, journey, dashboard, research) and styles |
| `engine/` | HTTP gateway, auth, quota, documents, verification, provider adapters |
| `tests/` | Node test suite (`node --test`), unit and integration |
| `verification/` | Browser, emulator, typography, PDF/OCR and live-API evidence scripts |
| `database/` | SQL schemas for the durable SQLite/Supabase adapters |
| `data/` | Checked scholarship source facts |
| `public/` | Editorial images, PDF.js licence |
| `docs/` | Current reference docs; `docs/archive/` holds the historical mission trail |
| `firestore.rules` | Read-only public catalog rules (not deployed) |

## Local development

Requires Node ≥24.12 and npm 11.9.

```bash
npm ci
npm run dev            # Vite on :5173, proxies /api to 127.0.0.1:8080
npm run start:engine   # gateway on :8080 in a second terminal (optional)
```

The engine starts in deterministic-only mode when no provider configuration exists. It refuses to start with incomplete configuration rather than serving fake analyses. Copy `.env.example` to `.env` for the frontend's public `VITE_FIREBASE_*` values; server variables belong in the process environment, never in `VITE_*`.

Without a backend, the deterministic pages still render; analysis and document routes report that the service is unavailable.

## Tests and checks

| Command | What it covers | Needs |
| --- | --- | --- |
| `npm test` | 419 unit/integration tests across `tests/` and `engine/` | Node only |
| `npm run test:evaluation` | 60 deterministic evaluation fixtures, explicitly not live inference | Node only |
| `npm run build` | Production bundle | Node only |
| `npm run test:emulator` | Firestore rules + auth emulator | Java 21 |
| `npm run test:browser` | Playwright UI, RTL, axe accessibility | Chromium |
| `npm run verify:live-verification` | Read-only production route/origin/commit check | Network |
| `npm run test:mac` / `check:mac` | macOS Keychain helper | macOS |

CI runs the verify/build job, the emulator job, the Playwright job and the macOS helper job (`.github/workflows/web-checks.yml`).

## Deployment

The topology has two hosts and one origin. `docs/HOSTED-BACKEND.md` is the reference; `vercel.json` and `render.yaml` are the configuration.

- **Frontend — Vercel.** Static build of `dist/`. `vercel.json` rewrites `/api/:path*` and `/health` to the backend and sets the CSP and security headers. The API hostname appears in that file and nowhere else in configuration.
- **Backend — Render.** Node service `bursyar-api`, built from this repository with `npm ci` and started with `npm run start:engine`. `render.yaml` documents the service (build/start commands, health check, environment variable names); it is not connected as a blueprint, and automatic deploys are disabled so a tested `main` commit is deployed deliberately.
- **Secrets** live in each host's environment settings. `.env.example` lists every variable name; no key, token or credential belongs in the repository, in `VITE_*` variables, or in a chat message.

To deploy: merge to `main`, confirm CI is green, deploy the intended backend commit from Render, then check `https://bursyar.vercel.app/health` → `capabilities.build.commit` matches it.

## Documentation

Start with the repository map above, then:

| Document | Purpose |
| --- | --- |
| [docs/HOSTED-BACKEND.md](docs/HOSTED-BACKEND.md) | Hosts, proxies, environment and live verification records |
| [docs/INFERENCE-RUNBOOK.md](docs/INFERENCE-RUNBOOK.md) | Provider configuration, spending gates, local inference |
| [docs/PRODUCT-REQUIREMENTS.md](docs/PRODUCT-REQUIREMENTS.md) | Product scope and requirements |
| [docs/SECURITY-PRIVACY-REVIEW.md](docs/SECURITY-PRIVACY-REVIEW.md) | Data handling, auth and privacy posture |
| [docs/DURABLE-DOCUMENTS.md](docs/DURABLE-DOCUMENTS.md) | Document storage adapters and limits |
| [docs/CREDENTIAL-VERIFICATION.md](docs/CREDENTIAL-VERIFICATION.md) | The request-only verification workflow |
| [docs/OCR-PIPELINE.md](docs/OCR-PIPELINE.md) | Local PDF/OCR pipeline and its release gates |
| [docs/TRANSLATION-REVIEW-WORKSHEET.md](docs/TRANSLATION-REVIEW-WORKSHEET.md) | Outstanding Dari/Pashto review |
| [docs/archive/](docs/archive/README.md) | Historical mission, checkpoint and release records (not current state) |

## Contributing and security

There is no contribution guide yet; keep changes small, keep `npm test` green, and do not weaken the authentication, origin, provider-policy, spending or evidence checks. Report security issues privately to the maintainers rather than in a public issue.

## Licence

MIT — see [LICENSE](LICENSE).
