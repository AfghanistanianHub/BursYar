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

Backend code: `1e77c53f85b3569b3acb8f7ae3d41984cbd1aaf7`, Render deployment
`dep-dbjfet0u01pc73faneu0` (verified live). The implementation head passed
275 Node tests, production build and all four CI jobs before release.

## Remaining provisioning gates
- Documents/profile: no document database is enabled on ephemeral free storage.
  Enable only with an appropriate durable private storage deployment.
- Meta: no key, provider file, policy records, spending approval or quota database
  is provisioned. No live or paid inference is enabled.

Add credentials only through provider secret settings, never a repository or chat.
Do not disable revocation, demo-claim, origin, provider-policy or spending checks
to make a deployment appear functional. A healthy `/health` is not proof of
successful sign-in, persistence or inference. Free-service cold starts can delay
requests; durable document/quota deployment remains a separate prerequisite.


## Read-only release check

Open https://bursyar.vercel.app/health directly. The production response was
rechecked on 2026-11-01: `ok: true`, deterministic features available,
`documentStorage.available: false`, Meta disabled and `inferenceVerified: false`.
The route matches `/health` exactly. A deployment inspection tool that appends
its own authentication query parameters can receive 404; that response is not
evidence that the exact public health URL is broken.

A later storage release must demonstrate owner isolation, deletion and persistence
across a process restart/deploy. A later Meta release must retain the existing
trusted policy checks and durable atomic quotas, provision the server-only key,
and use the separately authorized spending limit. Neither private documents nor
paid inference has been exercised on this hosted deployment.
