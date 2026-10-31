# Mission 01 — Final engineering acceptance review

**Scope:** BursYar Secure Architecture Reconciliation, independently assessed against Issue #28 and the initial engineering assignment. This is a technical handoff, **not** approval to merge, deploy, or activate restricted providers.

## Evidence and acceptance criteria

| Required work | Result | Evidence |
| --- | --- | --- |
| Review PR #21, #25, #26, #27; select one secure architecture | **COMPLETE** | #26 chosen as baseline, preserving #21 ancestry; incompatible #25 routes and destructive delete not imported; architectural decision record in `MISSION-01-RECONCILIATION.md` |
| Server-controlled age, model, provider, consent and region policy | **COMPLETE IN CODE / EXTERNAL TERMS UNAPPROVED** | `engine/provider-policy.js`, `engine/trusted-policy.js`, `engine/http.js`; deny-before-prompt/quota tests; hosted under-18 flows fail closed |
| Prevent personal/student information from entering Contributor mode | **COMPLETE IN CODE** | `authorizeAnalysisContext` requires `user_content` on `/api/analyze`; Meta Contributor models denied by provider allowlist; policy tests |
| Guardian data isolation, IDOR, revocation and consent | **COMPLETE IN CODE / REAL LEGAL AUTHORITY UNVERIFIED** | family grant checks, guardian-only offline routes, transfer source tombstones and tests |
| Prevent loss on transfer at age of majority | **COMPLETE AS INTERNAL SERVICE / NOT EXPOSED** | `engine/majority-transfer.js`; SQLite atomic migration and durable tombstone; destination collision, rollback, interruption, idempotence and history migration tests |
| Offline deterministic scholarship evaluation | **COMPLETE IN CODE** | reviewed catalog with expiration and source digest, conservative tri-state, coverage-incomplete unknown, no model dependency |
| Port GPA/TOEFL and preserve curated Oxford/IELTS logic | **COMPLETE IN CODE** | exact-line compiler, bounded eligibility tests and profile validation; no blind source PR merge |
| GPA/TOEFL profile UI with en/fa/ps and RTL compatibility | **IMPLEMENTED; VERIFY EXACT-HEAD CI** | `src/academic-evidence-form.js`, `src/main.js`; entries are user-declared/unverified; consent, private profile API, no external inference |
| Controlled glossary/PathFinder alternatives | **COMPLETE AS SAFE FALLBACK** | unreviewed en/fa/ps glossary, alternative claims rejected without curator provenance; user directed to official institution |
| CI on combined integration head | **REQUIRED ON FINAL SHA** | GitHub Actions on the branch; do not cite earlier successful runs as proof for new commits |

## Remaining external conditions (explicit blockers, not hidden tasks)

1. Provision a trustworthy independent service to establish adult recipient identity, legal majority in applicable jurisdiction, recipient consent, lawful guardian authority, expiry and revocation before real transfer activation. Do not trust client self-attestations.
2. Human fluent Farsi/Dari and Pashto review of the controlled glossary, UI copy, RTL and factual translation with signed review records.
3. Official scholarship source curation including accepted alternatives and dated source evidence. If source coverage is incomplete or unverified, return `unknown`.
4. A current formal provider-contract, privacy, age, regional and training-use assessment. Minor-targeted hosted-model use and personal-data Contributor mode remain prohibited.
5. Separate owner approval, threat model and release review before changing Draft, merging protected branches, deploying or changing billing.

## Non-actions

No `main` merge, no edits to original PR branches, no deployment, no paid/live Meta inference, no real minors' data and no credentials or billing changes.

## Delivery

Engineering changes are in [Draft PR #30](https://github.com/AfghanistanianHub/BursYar/pull/30). Issue #28 remains the review gate. The final CI result must be checked against the exact last commit before claiming automated acceptance. External gate sign-offs must come from authorized humans and cannot be manufactured by an assistant.
