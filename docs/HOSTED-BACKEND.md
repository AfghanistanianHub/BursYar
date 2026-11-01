# Hosted backend connection

The public frontend is https://bursyar.vercel.app. Same-origin `/api/*` and
`/health` are proxied to https://bursyar-api.onrender.com. Authentication headers
and the frontend Origin reach the existing gateway; no permissive CORS is added.

The Render service is `bursyar-api` in the owner-confirmed SAM's workspace,
on the explicit free compute plan. Node 24.22.1 is pinned. Hosted startup sets
`BURSYAR_HOST=0.0.0.0`; local startup remains `127.0.0.1` unless explicitly changed.
Only those two addresses are accepted. Service creation used the integration
branch with automatic redeploys disabled; reconcile its branch before future releases.

## Deliberately unavailable until configuration is provisioned

- Google sign-in: public Firebase web app configuration (`VITE_FIREBASE_API_KEY`,
  `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_AUTH_DOMAIN`) plus the production
  hostname in Firebase Authentication authorized domains.
- Server authentication: an authorized Firebase Admin credential or workload
  identity is required for `verifyIdToken(token, true)` revocation checking.
  Knowing a Firebase project ID does not supply those credentials.
- Documents/profile: no document database is enabled on ephemeral free storage.
  Enable only with an appropriate durable private storage deployment.
- Meta: no key, provider file, policy records, spending approval or quota database
  is provisioned. No live or paid inference is enabled.

Add credentials only through provider secret settings, never a repository or chat.
Do not disable revocation, demo-claim, origin, provider-policy or spending checks
to make a deployment appear functional. A healthy `/health` is not proof of
successful sign-in, persistence or inference. Free-service cold starts can delay
requests; durable document/quota deployment remains a separate prerequisite.
