# Hosted Meta prerequisites

Goal: durable atomic inference reservations on the existing Supabase project,
without enabling paid requests until credentials and trusted policy are provisioned.
Use existing private Supabase transport, preserve local SQLite, await reservations
at the gateway. Limits are registered once and cannot silently change/reset a
provider budget. The database clock sets minute/day buckets. Serialize reservations
on the provider budget row; denied/failed reservations never reach a model.

- [x] RED: tests for remote initialization, exhaustion/failure and asynchronous
  reservation ordering at the real HTTP gateway.
- [x] GREEN: shared bounded private RPC transport, remote quota factory, awaited
  gateway, optional bounded server-only JSON configuration for hosted settings.
- [x] SQL: invoker service-only RPCs, private RLS tables, immutable limits,
  atomic counters; synthetic rollback tests for caps and privilege denial.
- [ ] Verify Node/build/evaluation and independent review, publish and merge.
- [ ] Provision Meta only with the existing server key, reviewed Standard model
  price, confirmed spending cap, and fresh genuine adult/region/consent evidence.
  No invented verification flags; no inference during automated checks.
