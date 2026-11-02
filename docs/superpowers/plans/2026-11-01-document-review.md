# Document-first review completion

Continue the approved existing document flow; no new extraction provider or storage architecture.

- Add precise local text-file validation and bounded, localized request errors.
- Require an explicit accept/correct/reject decision for every extracted claim; preserve correction provenance and all server gates.
- Explain bounded parser format, show original excerpts and distinguish conflicts from unsupported text.
- Prevent duplicate document requests while an action is in flight.
- Verify invalid files never reach the API; explicit decisions are required; correct/accept/reject, reload, deletion and identity clearing still work in en/fa/ps.
- Run existing tests/build and relevant browser checks, integrate and deploy the tested revision.
