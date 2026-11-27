# Capability matrix

What the product actually does, what proves it, and what is still missing. A
component existing is not evidence: each row names the check that exercised the
capability end to end, or says plainly that nothing did.

Statuses: **Fully implemented and verified** · **Implemented but partially
verified** · **Incomplete** · **Externally blocked** · **Outside approved scope**.

| # | Capability | Status | Implementation | Verification | Residual gap |
| --- | --- | --- | --- | --- | --- |
| 1 | Student onboarding | Implemented but partially verified | Guided entry with three routes (find / check / prepare), task-route hash handling, header account control, dashboard entry after sign-in (`src/main.js`, `src/task-routes.js`, `src/dashboard-route.js`) | `verification/browser.mjs` 15/15 cases across 3 languages × 5 widths; `npm run test:workspace` restores a real emulator session and lands on the dashboard | The live Google popup/redirect round trip needs the owner's Firebase project; only the emulator IdP is exercised here |
| 2 | Profile management | Implemented but partially verified | Consent-gated profile form with per-field provenance (`src/profile-form.js`), academic evidence form (`src/academic-evidence-form.js`), `GET/POST /api/profile`, reviewed-document facts written with `not_verified` | `tests/profile-schema-regression.test.js`, `tests/academic-evidence-ui.test.js`, engine tests in `tests/documents.test.js`; rendered in workspace scenes `02`, `04b`–`04d` | Persistence across a live hosted reload is owner-blocked (same account as #1) |
| 3 | Document processing | Fully implemented and verified | TXT, text PDF, scanned PDF, PNG/JPEG with local OCR, manual transcription, guided mapping, unsupported/corrupt/encrypted/oversize/too-many-pages rejection, replacement, deletion, lost-response retry, conflicting claims, duplicate copies (`src/documents.js`, `src/document-extraction.js`, `src/pdf-runtime.js`, `src/ocr-runtime.js`, `engine/documents.js`) | `verification/document-ocr-integration.mjs` (real PDF.js and self-hosted Tesseract, no mocks) covers 19 numbered cases; `npm run test:workspace` scenes `02`–`04d` cover conflict, duplicate and deletion through the authenticated UI; `tests/documents.test.js` 12/12 including the duplicate marker | Nothing known |
| 4 | Evidence review | Fully implemented and verified | Claim fieldsets with the cited source line, extraction-method label, accept/correct/reject decisions, guided field mapping tied to document lines (`src/documents.js`) | Workspace scenes `03`, `03b`, `04`; `verification/document-review-browser.mjs`; `tests/document-mapping.test.js` | Nothing known |
| 5 | Eligibility assessment | Fully implemented and verified | Local rule assessment against the reviewed catalog, `unknown` when coverage is incomplete, cited requirement kept beside the verdict (`src/local-workflow.js`, `engine/eligibility.js`, `engine/default-catalog.js`) | Workspace scene `05b` (result states `Missing, conflicting or unsupported evidence`, keeps the excerpt, says `Unknown is not a rejection`); `tests/local-workflows.test.js`, `tests/pathfinder-assessment.test.js`; `npm run test:evaluation` 60 offline checks | The AI-assisted analysis path is cost-gated and deliberately not exercised; the local path is the verified one |
| 6 | Scholarship matching | Implemented but partially verified | Country/level/funding facets, confirmed-only fee and no-IELTS filters that fail closed, past-deadline handling, search normalisation for fa/ps keyboard forms (`src/research-catalog.js`) | `tests/research-catalog.test.js` 17/17; `verification/research-browser.mjs` | There is no eligibility-based matching because no shipped row has reviewed eligibility; the card now says so instead of implying a match (see #7) |
| 7 | Scholarship discovery | Fully implemented and verified | 12 research leads with official HTTPS sources, check date, provenance, freshness state, deadline state, and now an explicit Afghan-eligibility position per card (`src/research-explorer.js`, `src/research-catalog.js`, `src/research-data.js`) | `npm run check:research`: 12 rows, 0 overdue, structural gate passes as of 2026-11-27; `verification/research-browser.mjs`; rendered `en`/`fa` in `verification/artifacts/research/` | Every row still needs a re-read before this code ships again; the recheck window is earned per provenance (14 days automated, 30 days human) |
| 8 | Saved opportunities | Fully implemented and verified | Public IDs only in local storage, saved list on the dashboard, JSON export (`src/research-catalog.js`, `src/student-dashboard.js`) | Workspace scenes `06`, `06b`, `14`; `tests/research-catalog.test.js` export tests | Nothing known |
| 9 | Application readiness | Incomplete | Documented as a narrative capability and partly present: the dashboard home reports what is ready (documents to review, assessment ready), and the PathFinder lists Discover → Document → Qualify → Apply → Follow up with next actions from the assessment (`src/student-dashboard.js`, `src/gap-actions.js`, `src/pathfinder.js`) | Workspace scenes `01`, `05b`, `05c`; `tests/gap-evidence-versus-competence.test.js`, `tests/local-pathfinder-wiring.test.js` | There is **no per-application readiness tracker**: no way to mark which requirements a student has collected for a specific award, and no deadline-driven checklist. Building one safely needs issuer-verified requirements, which is #11 |
| 10 | PathFinder guidance | Fully implemented and verified | Next actions derived from the assessment, localized, with provenance preserved and no completion claimed without evidence (`src/gap-actions.js`) | Workspace scene `05b` (`Next: obtain missing documents` in `#next-actions`); `tests/pathfinder-assessment.test.js`, `tests/pathfinder-language.test.js`, `tests/pathfinder-provenance.test.js` | Nothing known |
| 11 | Document verification | Externally blocked | Panel, issuer selector, request list, provider outage state (`src/verifications.js`, `engine/verification-providers.js`) | Only the unavailable state is verified locally: workspace scene `07` asserts the honest outage copy, the saved document staying selectable, and no sign-in wording; `tests/verification-api.test.js`, `verification/emulator.mjs` 58 checks for rules and isolation | No issuing-organisation integration or credentials exist, so no verification can actually be performed; `/api/verifications` answers 503 by design |
| 12 | Account and privacy management | Implemented but partially verified | Sign out, language switch, per-document delete, download all data, delete all data with double confirmation (`src/student-dashboard.js`) | Engine/API: `tests/verification-api.test.js` and `tests/remote-documents.test.js` exercise `/api/export` and `/api/erase` including failure and retry states; rendered buttons and the destructive-vs-primary styling are asserted in workspace scene `08`; per-document deletion is exercised in `04d` and `verification/document-library-browser.mjs` | The export download and the delete-all confirmation have not been clicked through in a rendered browser (the harness has no hosted account to delete); that remains owner acceptance |

## How this matrix was produced

- Every "verified" claim names a check that ran in this workspace on 2026-11-27.
  `npm test` is 584/584; `npm run test:workspace` is
  27 scenes with 0 axe violations, 0 overflow and 0 unexpected errors;
  `verification/document-ocr-integration.mjs` and `verification/research-browser.mjs`
  are part of the standing suite list in `docs/EXECUTION-STATE.md`.
- Anything not exercised end to end is marked partial even where unit coverage is
  strong, because unit coverage cannot show that a screen renders, a focus target is
  reachable, or a failure state is understandable.
- Rows 9 and 11 are the only capabilities that are not fully deliverable from this
  repository alone, and both are named with what would unblock them rather than
  quietly described as done.

## Constrained-device measurement (2026-11-27)

Production build, Chromium, 390×844, network emulated at 1.6 Mbit/s down / 750 kbit/s
up with 150 ms latency:

| Metric | Value |
| --- | --- |
| First contentful paint | 704 ms |
| DOMContentLoaded | 682 ms |
| Load event | 1395 ms |
| Transferred (all resources) | 176 KB over 8 requests |
| JavaScript before any interaction | 2 chunks: entry 106 KB + workspace start card 4 KB |
| JavaScript after opening the research library | 3 chunks |
| JS heap after load | 9.5 MB |

This is a measurement, not a benchmark comparison: it shows the landing page stays
usable on a slow connection because every workflow below the fold is a separate chunk
loaded on approach or on opening its disclosure. Nothing was optimised in this batch
because nothing measured badly.
