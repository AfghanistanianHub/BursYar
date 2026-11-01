# Durable hosted document adapter

The optional Supabase adapter keeps private document/profile state in the existing
BursYar project `rurgmyiiytesknsfwjjl` (Canada Central), separately from its existing
community tables. It does not buy a Render disk, enable Meta, or change Firebase
identity. No user document is written to ephemeral Render storage.

## Provisioning

1. Review/apply `database/durable-documents.sql` once to the intended project. It
   adds `bursyar_documents.owner_state` and two public SECURITY INVOKER RPCs.
   Only the existing server `service_role` may use them; anonymous and signed-in
   Supabase clients have no grants. RLS is enabled with no client policies.
2. Provision `BURSYAR_DOCUMENT_SUPABASE_URL=https://rurgmyiiytesknsfwjjl.supabase.co`
   and the existing server key as `BURSYAR_DOCUMENT_SUPABASE_KEY` using Render's
   secret environment. Never use a frontend/VITE variable, repository or chat.
   Accepted credentials are server secret keys or legacy service_role keys;
   publishable/anon keys are rejected. No key is created by this implementation.
3. Leave `BURSYAR_DOCUMENT_DB` and `BURSYAR_FAMILY_GRANTS` unset. Conflicting or
   partial configuration fails startup. A bounded read-only RPC probe must succeed
   before startup reports storage availability. Family transfer requires a cross-owner
   transaction and remains supported only by the existing SQLite deployment.
4. Deploy the tested backend commit, check health, and use synthetic text through
   an approved Firebase session. Verify reload/restart persistence, isolation and
   deletion before using real documents. Health alone is not a persistence test.

## Behavior and limits

Each request loads only the SHA-256 owner ID derived from verified Firebase
identity. Existing SQLite extraction, consent, review and provenance logic runs
in a request-scoped in-memory working copy. A successful mutation is returned
only after a revision compare-and-swap commits. Conflicts retry at most three
times; network failures never automatically retry a mutation. Export reads one
snapshot. Upstream response errors are replaced by a generic document error.

The existing ten-document, 12 KB text and twenty-history limits remain. State is
bounded to 1 MiB; RPC responses and body reads have size/deadline limits. Keys
are sent only in headers to HTTPS Supabase project endpoints, with redirects
rejected. No Firebase token is forwarded to Supabase. Private state is not
cached, logged or written to local disk.

Erasure commits an empty state while retaining the hashed owner and revision,
so a stale concurrent request cannot silently restore deleted contents. No
original text, profile or history remains in the active owner state. Normal
provider backup/retention policy applies. This is not issuer verification:
extracted facts remain unverified until the existing review workflow resolves
them, and never become officially verified through storage.

## Activation record

Implementation and synthetic verification are recorded in the PR. Hosted storage
must remain disabled until the server credential is securely provisioned and a
real authenticated synthetic-document round trip succeeds. Quota persistence,
Meta credentials and trusted provider policy records remain separate gates.


## Verified provisioning — 2026-11-01

The additive `bursyar_durable_document_state` migration succeeded in the intended
project. `database/test-durable-documents.sql` passed as the actual service_role:
first insert, duplicate-insert rejection, stale-revision rejection, successful
revision update/readback and malformed-state rejection. Permission assertions
confirmed no anonymous/authenticated schema, table or RPC access and no definer
RPCs. The transaction rolled back all synthetic test rows.

The advisor's `rls_enabled_no_policy` notice on the private table is intentional:
there are no client RLS policies, grants are service_role-only, and service_role
uses the gateway authorization boundary. Existing community-function and Auth
advisories predate this change; those unrelated features were not modified.

Local checks: 285 Node tests and production build passed. Independent review
reported no actionable findings. Hosted activation/persistence is still pending
the existing server credential being securely provisioned in Render.
