# Hosted backend connection

The public frontend is https://bursyar.vercel.app. Same-origin `/api/*` and
`/health` are proxied to https://bursyar-api.onrender.com. Authentication headers
and the frontend Origin reach the existing gateway; no permissive CORS is added.

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

Backend code: `81372715e81f2099c319f1b99616d38b7e1b1c0a`, Render deployment
`dep-dbjo0049v7es73alsr9g` (verified live). The storage implementation passed
285 Node tests, production build and all four CI jobs. The subsequent consent
wording release also passed all four CI jobs and is READY in production.

## Durable document/profile storage

The existing BursYar Supabase project now provides private owner-state storage;
no documents are written to ephemeral Render disk. The existing server key was
provisioned in Render with owner approval. An authenticated synthetic profile
write, database readback and UI reload after a backend redeploy succeeded. The
synthetic record was cleared with CAS. No real student data was used. The full
file-upload/review UI smoke test remains pending after a browser file-transfer
timeout. See DURABLE-DOCUMENTS.md for the exact verification scope.

## Remaining provisioning gates
- Meta: no key, provider file, policy records, spending approval or quota database
  is provisioned. No live or paid inference is enabled.

Add credentials only through provider secret settings, never a repository or chat.
Do not disable revocation, demo-claim, origin, provider-policy or spending checks
to make a deployment appear functional. A healthy `/health` is not proof of
successful sign-in, persistence or inference. Free-service cold starts can delay
requests. Durable spending quotas remain a separate prerequisite for Meta.


## Read-only release check

Open https://bursyar.vercel.app/health directly. The earlier authentication-only release returned `ok: true`, deterministic
features available, storage disabled and `inferenceVerified: false`. The current
storage adapter must pass a real read-only RPC probe at startup before reporting
`documentStorage.available: true`. Meta remains disabled and inference unverified.
The route matches `/health` exactly. A deployment inspection tool that appends
its own authentication query parameters can receive 404; that response is not
evidence that the exact public health URL is broken.

Storage owner isolation and document deletion passed automated checks; actual
synthetic profile persistence across a deployment was verified separately. A
later Meta release must retain trusted policy checks and durable atomic quotas,
provision the server-only key, and use the separately authorized spending limit.
No paid inference or real student document has been exercised on this deployment.
