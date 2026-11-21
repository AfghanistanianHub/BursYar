# Verification operations (operator runbook)

BursYar never verifies a credential by itself. A request created in the student’s
verification centre stays `PENDING` until an operator records what the **issuer**
said. This runbook is the operation that closes that loop.

## What the product promises

- Only an issuer decision can change a status to `VERIFIED_BY_ISSUER`.
- Extraction, OCR, profile declarations and any client-supplied field are refused
  as authenticity evidence by `engine/verification-providers.js`.
- There is no HTTP route that sets a verified status. The API can create, list,
  read and withdraw a request; it cannot decide one.

## Prerequisites

1. Access to the host that holds the private verification database
   (`BURSYAR_VERIFICATION_DB`, owner-only `0600` file in a `0700` directory).
2. An operator secret of at least 32 characters in `BURSYAR_OPERATOR_SECRET`.
   This guards against accidental invocation; it is **not** an authentication
   boundary. The real boundary is shell access to the private database.
3. The issuer’s own confirmation: an official portal screen, a signed document,
   or a written statement. Record where it came from.

## Recording a decision

```bash
BURSYAR_OPERATOR_SECRET=... \
BURSYAR_VERIFICATION_DB=/var/lib/bursyar/verifications.db \
node scripts/verification-decision.mjs \
  --uid <firebase-uid> \
  --request <request-uuid> \
  --status VERIFIED_BY_ISSUER \
  --kind issuer_portal_confirmation \
  --issuer "IELTS (British Council)" \
  --authenticated-at 2026-11-21T10:00:00Z \
  --statement "TRF verification page confirms overall band 6.5 for this candidate." \
  --reference TRF-0001 \
  --confirm
```

Allowed statuses: `VERIFIED_BY_ISSUER`, `REJECTED_BY_ISSUER`,
`MANUAL_REVIEW_REQUIRED`, `UNAVAILABLE`. The two issuer statuses require an
allowed evidence `kind`, the issuer name, the decision time and a statement.

Allowed evidence kinds: see `ISSUER_EVIDENCE_KINDS` in
`engine/verification-providers.js` (for example `issuer_portal_confirmation`,
`issuer_signed_document`). Reference must match the reference on the request.

The command writes the status, the evidence record and an append-only
`verification_events` row in one SQLite transaction. It refuses to run without
`--confirm`, and it cannot read documents: the service is constructed without
document storage.

## What the student sees

The request appears with its new status the next time the verification centre
loads. No notification is sent; the product makes no promise it cannot keep.

## Audit and retention

- `verification_events` is append-only and erased only by the student’s own
  account erasure.
- The command prints a JSON receipt (`issuer_decision_recorded`) that can be
  pasted into the release log. It contains no document text and no token.
- A `VERIFIED_BY_ISSUER` status is terminal: further decisions are refused
  (409), and a withdrawal is refused (409).

## Environment note

The database is on the hosted backend’s private disk; this runbook therefore
requires running the command on that host (SSH or the platform shell). It is
deliberately not exposed over the network.
