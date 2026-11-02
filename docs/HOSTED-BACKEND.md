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

Backend code: `4e272a74e65df5ccf2318f3adac312196f5db443`, Render deployment
`dep-dbjooe0u01pc7383tj2g` (verified live). The storage implementation passed
293 Node tests, production build and all four CI jobs. The subsequent consent
wording release also passed all four CI jobs and is READY in production.

Deploy-ID note: PR #47 recorded earlier preparation deploy
`dep-dbjoi5k9v7es73angf1g` for the same commit `4e272a7`; the later verified
live record used here, in HOSTED-META.md, and in PR #48 is
`dep-dbjooe0u01pc7383tj2g`. No live hosting state was probed to write this
note; actually-serving SHAs remain unverified from the repository.

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

Open https://bursyar.vercel.app/health directly. The earlier authentication-only release returned `ok: true`, deterministic
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
