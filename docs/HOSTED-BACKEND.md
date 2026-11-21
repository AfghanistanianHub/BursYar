# Hosted backend connection

The public frontend is https://bursyar.vercel.app. Same-origin `/api/*` and
`/health` are proxied to https://bursyar-api.onrender.com. Authentication headers
and the frontend Origin reach the existing gateway; no permissive CORS is added.

## Configuration sources

Two files and this page describe one topology; change them together.

| Concern | Source |
| --- | --- |
| Frontend hosting, proxy target, CSP and headers | `vercel.json` |
| Backend service definition (build, start, health check, env names) | `render.yaml` |
| Gateway variables and limits | `.env.example`, `docs/INFERENCE-RUNBOOK.md` |
| Verified live state | this page, in the dated sections below |

The API hostname appears once in configuration: the rewrite target in
`vercel.json`. `render.yaml` documents the `bursyar-api` service so the backend
can be recreated from the repository; it is **not** connected as a Render
blueprint, so syncing it never creates or replaces the live service. Automatic
deploys are disabled: the intended, tested `main` commit is deployed explicitly
twice (the frontend from Vercel, the backend from Render).

## Current check — 2026-11-21 01:55 UTC

| Check | Result |
| --- | --- |
| Frontend deployment | `dpl_tPWATMGR1HdpMaWqGYnjaBGinwAa`, commit `e7e35b7` (`main`), `READY` / `PROMOTED`, alias `bursyar.vercel.app` assigned, build ready in 38.9 s |
| `GET https://bursyar.vercel.app/` | `200`, `text/html`, serving `/assets/index-DBXbGdmG.js` (263 505 B) and `/assets/index-B_4771W4.css`; CSP and `X-Content-Type-Options: nosniff` present |
| Journey fixes in the served bundle | `Sign in to continue`, `Opening sign-in` and `bursyar:identity` present; the previously served bundle did not contain them |
| Retired bundle | `/assets/index-DLHPgfbd.js` now `404`, retired with the previous deployment |
| `GET https://bursyar-api.onrender.com/health` | `200`, `capabilities.build.commit` = `7dbd75f` |
| `GET https://bursyar.vercel.app/health` | `200`, same build `7dbd75f`, same capabilities |
| Capabilities reported | deterministic assessment and document storage available; Meta configured but gated per request; `inferenceVerified: false` |
| `GET /api/export`, `/api/verifications`, `/api/verifications/providers` | `401 Sign in with an approved account` |
| Foreign `Origin` on `POST /api/verifications` | `403 Origin denied` |
| `npm run verify:live-verification --base=https://bursyar.vercel.app` | 5 passed, 0 failed, 1 skipped (authenticated create/list/withdraw not exercised) |

### Deployment history — 2026-11-21

| Time (UTC) | Event |
| --- | --- |
| 01:51 | Project `bursyar` (`prj_doNm7kwcWaHXg66t1bJOfEo3XRTQ`) found paused; every frontend route answered `503 DEPLOYMENT_PAUSED`, including `/health`. Pause cleared. |
| 01:51:49 | Previously promoted deployment `dpl_HBW3E6KMhzwTBJH3LY8JUBMLuzLz` (`926237a`) serving again with `200`. |
| 01:53:38 | New production deployment `dpl_tPWATMGR1HdpMaWqGYnjaBGinwAa` created from `main` @ `e7e35b7`; the paused-time build `dpl_67Hft9PTyxftx76wNAqSYgMisDmn` (`e7e35b7`) remains `BLOCKED` with `buildSkipped: true` and was not revived. |
| 01:54:18 | Deployment `READY`, alias assigned, new bundle `index-DBXbGdmG.js` serving. |

The backend was unaffected throughout and continued to serve `7dbd75f`.

### Resuming and redeploying the frontend

1. Vercel dashboard → team **AfghanHub's projects** → project **bursyar** →
   **Settings → General → Pause Project**, and turn pausing off (the same state
   is reachable through the Vercel API `unpause` action); the project's
   `paused` flag must read `false`.
2. Confirm the previously promoted deployment serves: `curl -I
   https://bursyar.vercel.app/` returns `200` and `/health` returns the backend
   build commit.
3. Deploy `main` explicitly, because a paused-time build is skipped rather than
   queued: either **Deployments → Redeploy** on the latest `main` entry, or
   create a new production deployment for `main`. Vercel's git integration has
   `createDeployments: disabled` for this project, so a merge alone does not
   deploy.
4. Re-run `npm run verify:live-verification -- --base=https://bursyar.vercel.app
   --expect-commit=<backend sha>` and check `/health` `capabilities.build.commit`.
   A `200` on `/` is not proof of sign-in, persistence or inference.

The Render service is `bursyar-api` in the owner-confirmed SAM's workspace,
on the explicit free compute plan. Node 24.22.1 is pinned. Hosted startup sets
`BURSYAR_HOST=0.0.0.0`; local startup remains `127.0.0.1` unless explicitly changed.
Only those two addresses are accepted. The service now tracks `main`, with automatic redeploys disabled.
For code changes, deploy the intended tested main commit explicitly; a GitHub
merge alone does not deploy the backend. Configuration updates can trigger a
Render deployment, so check deployment history before starting another one.

## Verified hosted authentication — 2026-11-01

Firebase project `afghanistanian-scholarships` supplies the three public
`VITE_FIREBASE_*` settings. Google sign-in is enabled, and the owner-approved
`bursyar.vercel.app` hostname is in Authentication authorized domains.
Google sign-in and an authenticated scholarship catalog request both succeeded
through the production UI. These are separate checks from process health.

The backend uses public `FIREBASE_WEB_API_KEY` mode: SDK signature validation
followed by mandatory caller-account lookup for disabled/revoked status.
No private Admin key was created or exported. See KEYLESS-FIREBASE-AUTH.md.
The project ID and public key alone do not authorize a caller; the existing
project, issuer, nonanonymous identity and `bursyarDemo` checks remain required.

Backend code: `3e7432a0a670d884135b970bfe97c9e521e8610c`, verified live via
`/health` reporting `capabilities.build.commit` of `3e7432a` (outside-dashboard
check, no Render access used). Superseded on 2026-11-18 by `7dbd75f`, see below. The storage implementation passed 293 Node tests,
production build and all four CI jobs. The subsequent consent wording release
also passed all four CI jobs and is READY in production.

Deploy-ID note: PR #47 recorded earlier preparation deploy
`dep-dbjoi5k9v7es73angf1g` for commit `4e272a7`; the later verified live record
used here, in HOSTED-META.md, and in PR #48 was `dep-dbjooe0u01pc7383tj2g`
for the same `4e272a7` commit. Both are superseded: the current live backend
build is `3e7432a` (squash-merge PR #121 of the build-SHA feature branch),
confirmed serving by its own `/health` response. Actually-serving SHAs are
now verifiable from the repository via `capabilities.build.commit`.

## Live frontend — 2026-11-12

Vercel project `bursyar` (`prj_doNm7kwcWaHXg66t1bJOfEo3XRTQ`) serves
https://bursyar.vercel.app from deployment `dpl_4VyvcQ4MDosUmthP7a2xREgu7aSz`
(git push of `main` @ `05d6994`, READY + PROMOTED). Commit `05d6994` only
refreshed the ETH-ESOP `checkedAt` timestamp and its ledger evidence; no
frontend logic changed since `3e7432a`, whose auto-deployed production build
(`dpl_AJRvtu4X7F21Jw6WmVBEZTXqfTSY`) it replaced. Homepage `200`, all
protected APIs `401` without token, verified live.

## Durable document/profile storage

The existing BursYar Supabase project now provides private owner-state storage;
no documents are written to ephemeral Render disk. The existing server key was
provisioned in Render with owner approval. An authenticated synthetic profile
write, database readback and UI reload after a backend redeploy succeeded. The
synthetic record was cleared with CAS. No real student data was used. The full
file-upload/review UI smoke test remains pending after a browser file-transfer
timeout. See DURABLE-DOCUMENTS.md for the exact verification scope.

## Meta demo activation

Meta Standard Muse Spark 1.3 is configured for the owner-approved adult Canadian
demo account. A dedicated server-only key, short-lived policy record, durable
atomic quota budget and USD50 spending ceiling are provisioned. One authorized
public-source request passed real inference and evidence validation. See
HOSTED-META.md for the exact request ID, live deploy and verification limits.
Unverified accounts and expired/restricted policy records remain denied.

Add credentials only through provider secret settings, never a repository or chat.
Do not disable revocation, demo-claim, origin, provider-policy or spending checks
to make a deployment appear functional. A healthy `/health` is not proof of
successful sign-in, persistence or inference. Free-service cold starts can delay
requests. Spending quotas are durable in the existing private Supabase project.


## Read-only release check

After a backend deploy that should include the credential-verification workflow,
run `node scripts/verify-live-verification-api.mjs --base=https://bursyar.vercel.app
--expect-commit=<deployed sha>` (also `npm run verify:live-verification`). It
needs no credentials for the deploy evidence: a 401 on `/api/verifications` and
`/api/verifications/providers` proves the routes exist behind authentication, a
404 means the deployed build predates them, and a foreign `Origin` must be
rejected with 403. Set `BURSYAR_VERIFY_TOKEN` to a real ID token to also exercise
create/list/withdraw with a synthetic document that it deletes again. A skipped
check is never counted as a pass: the summary prints `N passed, M failed, K
skipped` and names what the run did not prove. Exit status is 0 only when every
executed check passes; add `--require-auth` to make an unverified authenticated
leg fail instead.

## Verified backend release — 2026-11-18

The backend now serves `7dbd75f6889ea09e96c129831bec40c463b6e64e` on both
`bursyar.vercel.app/health` and `bursyar-api.onrender.com/health`, which
supersedes the `3e7432a` build recorded above. Live run of the release check:
5 passed, 0 failed, 1 skipped — the verification routes answer `401` behind
authentication, a foreign `Origin` gets `403`, and `/api/export` still
authenticates through the proxy. The authenticated create/list/withdraw leg was
**not** exercised against production (no ID token in this environment) and is
reported as not proven; the same script passes 12/12 against a locally booted
engine. See `docs/MISSION-42-RELEASE-CLOSURE.md` for the full evidence table.

Open https://bursyar.vercel.app/health directly. Its `capabilities.build.commit` is the git SHA Render built (`RENDER_GIT_COMMIT`, override `BURSYAR_BUILD_SHA`, else `"unknown"`), so outside-dashboard deploy verification is `curl .../health` and comparing that SHA to the intended commit. The earlier authentication-only release returned `ok: true`, deterministic
features available, storage disabled and `inferenceVerified: false`. The current
storage adapter must pass a real read-only RPC probe at startup before reporting
`documentStorage.available: true`. Meta is now configured. Startup `inferenceVerified: false` remains intentional;
actual per-request evidence is recorded separately in HOSTED-META.md.
The route matches `/health` exactly. A deployment inspection tool that appends
its own authentication query parameters can receive 404; that response is not
evidence that the exact public health URL is broken.

Storage owner isolation and document deletion passed automated checks; actual
synthetic profile persistence across a deployment was verified separately. The
live Meta demo retains trusted policy checks, durable atomic quotas, server-only
credentials and the owner-approved spending cap. One public-source inference
succeeded; no real student document was used.
