# Durable hosted documents

The existing free BursYar Supabase project is the candidate durable store; no
new service or paid plan is required. Its existing community tables are outside
this change. Private documents must remain accessible only through the Firebase
verified gateway, never via browser Supabase credentials.

Use a private Postgres owner-state table and service-role-only SECURITY INVOKER
RPCs with revision compare-and-swap. Keep the existing consent, extraction,
review, provenance and deletion logic by applying each operation to an in-memory
SQLite copy of only that owner's state, then committing the resulting snapshot
atomically. No private data is written to Render's ephemeral disk. Read/write
requests have bounded size and deadlines. Conflicts retry at most three times;
network errors never retry mutations. No cache or stale-success fallback.

Alternative: paid Render disk keeps SQLite unchanged but adds recurring cost.
Rewriting all workflows in PL/pgSQL duplicates extraction and review logic.
The selected adapter retains those already tested rules.

Family transfer needs a cross-owner transaction and is not supported by this
adapter; startup must reject combining it with family grants. Local SQLite and
its existing family transfer service remain available. Quotas and Meta are a
separate later release and are not enabled by document storage.

Activation requires the existing BursYar Supabase server key in Render secret
environment, isolated schema, SQL privilege/atomicity tests, full Node/build
checks, and independent review. Never create/export keys or print private
credentials. Live verification uses synthetic documents only.
