# Firebase account status without an administrator key

Optional `FIREBASE_WEB_API_KEY` mode uses the Firebase project's public web API
key. It does not grant administration or mint tokens. Without this setting,
the existing Admin SDK `verifyIdToken(token, true)` mode remains unchanged.
Blank settings are treated as absent. Invalid nonblank settings fail startup.

## Required verification sequence

1. Await Firebase Admin SDK cryptographic ID-token verification. The SDK still
   validates the Google signature, issuer, audience and token lifetime. Emulator
   mode remains forbidden. No REST lookup runs if this verification fails.
2. Send that exact caller ID token in a POST body to the fixed HTTPS Firebase
   `accounts:lookup` endpoint with the public web API key. No arbitrary URL,
   redirect, token-in-query, administrator credential or client-supplied UID.
3. Require exactly one matching account. Reject disabled accounts, deleted users,
   UID mismatch, unexpected tenants and malformed or absent revocation evidence.
   `disabled` omitted is protobuf's default false, matching Admin SDK behavior.
4. Compare signed `auth_time` with the account's `validSince`, both seconds:
   reject when auth_time < validSince. Missing/invalid boundaries reject rather
   than being silently treated as not revoked. No account-status cache is used.
5. Existing gateway authentication still requires expected project issuer/audience,
   `bursyarDemo === true`, a valid UID, and no anonymous provider. Provider policy,
   document ownership, guardian, consent and spending gates are unchanged.

Lookup has a five-second deadline covering headers and body, a 64 KiB response
limit and JSON-only response handling. Transport, API, schema and timeout failures
return only a generic authentication rejection. Account response fields are not
logged, persisted or returned to the browser. The extra round trip is an account
status read for this caller, not a model request or credential creation.

## Sources checked

- https://firebase.google.com/docs/reference/rest/auth#section-get-account-info
  documents ID-token POST lookup, `disabled`, and `validSince` as the revocation
  boundary in seconds.
- https://firebase.google.com/docs/auth/admin/manage-sessions documents revocation.
- Installed firebase-admin 14.5.0 `lib/auth/base-auth.js`,
  `verifyDecodedJWTNotRevokedOrDisabled`, compares `auth_time` against
  `tokensValidAfterTime`. `lib/auth/user-record.js` maps `validSince` into that
  date and defaults an omitted disabled flag to false.

## Verification limits

Offline tests cover account matching, disabled/deleted/revoked/tenant cases,
missing and malformed status, exact boundary, project binding, unsigned tokens
before lookup, error redaction, response bounds and both timeout phases.
A valid live Google sign-in plus successful authenticated catalog request must
be observed separately before claiming the deployed authentication path works.
A healthy endpoint, public API key or account checker unit test is insufficient.
Live destructive revocation/disable operations are not part of this check.

No private document database or Meta inference is enabled by this mode.
