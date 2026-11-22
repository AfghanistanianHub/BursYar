# Deployment reconciliation — 2026-11-22

## Confirmed topology
- Single Vercel project `bursyar` (`prj_doNm7kwcWaHXg66t1bJOfEo3XRTQ`) connected to `AfghanistanianHub/BursYar`.
- Canonical integration branch: `work/restore-approved-ai-studio-hero`.
- Last checked preview: `dpl_4fqwHfH6H1f7ZZyckyjjgeqhv2Pa`, READY, commit `3a5b493385360b858baf49da2959358ddf2beca8`. Later documentation commits are not covered by that preview verification.
- Production Vercel: READY, `main` at `2162be3e21962db23bdb022586bdf0e491ffaa96`.
- Render `bursyar-api`: service `srv-dbjf1k7b9u1s73drgtqg`, `main`, auto-deploy off, free plan. Last LIVE deploy `dep-dbuephmk1f9s73a22hi0` at `7dbd75f6889ea09e96c129831bec40c463b6e64e`.
- Failed backend deploy `dep-dc0fkh4s728c73a47b40` attempted `2162be3e21962db23bdb022586bdf0e491ffaa96`. Logs 2026-11-21 01:57 UTC show `Error: Quota storage unavailable` at startup and process exit 1. Previous live deployment remained available.
- 9Router `srv-dc17cf7f3r2c73bsfb10` is a separate experimental free service, not an alternative frontend or production backend.

## Root-cause investigation — backend deployment
`engine/server.js` initializes quota storage for each enabled provider before calling `server.listen`. In `engine/remote-quota.js`, Supabase quota storage calls `bursyar_quota_initialize`; a failed or non-true result throws `Quota storage unavailable`. This explains the **failure path**, not the precise remote cause: missing credentials, RPC permissions, schema, endpoint, or availability must be checked without revealing secrets. Do not work around this by disabling quota enforcement or allowing unbounded paid inference.

### Safe resolution checklist
1. Inspect Render variable **names and presence only**, not secret values, for `BURSYAR_QUOTA_STORAGE`, `BURSYAR_DOCUMENT_SUPABASE_URL`, `BURSYAR_DOCUMENT_SUPABASE_KEY`, provider config and spending flags.
2. Verify `bursyar_quota_initialize` exists and can be executed by the intended Supabase service role; test its result with non-production credentials or a controlled safe environment.
3. If a paid provider is no longer approved, explicitly disable it in private provider config rather than bypassing quota checks.
4. Run isolated tests and startup smoke test against the candidate commit; then deploy a **preview/staging backend** or approved maintenance release. Never mutate the existing live backend without owner authorization.
5. Verify frontend and backend release contracts and health SHA before any production promotion.

## Release blockers
- Latest canonical branch commit must be retested after documentation updates.
- CI unit/build and 60 offline evaluations plus real browser/RTL/security paths have not been independently verified in this investigation.
- Google AI Studio / Freebuff uncommitted changes cannot be ruled out without inspecting/exporting those workspaces.
- Backend startup failure above must be resolved; production frontend/backend currently use different SHAs.
- Production release and any public protection changes require explicit owner approval.

**Status: HOLD.** No production deployment or provider spending authorized.
