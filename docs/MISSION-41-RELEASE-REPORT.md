# Mission 41 — BursYar v1.0 release-candidate report

Baseline: `origin/main` @ `797b777` (clean, no uncommitted work).
Development branch: `freebuff/c5ef0632c5ef6ac6e4c3dbd7`.
Release-candidate commit: `c337011` (single commit on top of `797b777`).
Nothing was deployed. Production (`https://bursyar.vercel.app`) was not touched.

## 1. What was verified before editing

| Check | Result |
| --- | --- |
| `git status` at baseline | clean |
| `npm ci --no-audit --no-fund` | 749 packages, exit 0 |
| `npm test` (baseline) | 406 pass / 0 fail |
| `npm run build` (baseline) | succeeds (`dist/index.html`, local `pdf.worker` + `pdf-runtime`) |
| Newest source | `origin/main` == local `main` == branch start; no newer AI Studio archive exists in the repository, and none was supplied, so no Google AI Studio source could be reconciled. |

## 2. Release blocker fixed in this mission

The v1.0 requirement for a credential-verification system was **absent from the
entire codebase** (`VERIFIED_BY_ISSUER` and friends did not exist). It is now
implemented and tested:

- `engine/verification-providers.js`: 14-issuer registry (IELTS, TOEFL, Duolingo
  English Test, Cambridge English, PTE Academic, Goethe, TestDaF, telc, ÖSD,
  DELF, DALF, TCF, TEF, MyCreds) with each issuer's official verification page,
  access type, API availability, and an explicit `canAutoVerify: false`.
- `engine/verification.js`: private SQLite store (`0600`, `O_NOFOLLOW`, private
  parent required), consent record, 25-request cap, idempotent re-submission,
  audit events, owner hashing, withdrawal rules, and issuer-only status
  promotion requiring `issuer_portal_confirmation`, `issuer_api_response`,
  `issuer_signed_document` or `issuer_letter` evidence.
- `engine/http.js`: authenticated `GET/POST /api/verifications`,
  `DELETE /api/verifications/:id`, `GET /api/verifications/providers`; guardian
  family routes are refused; verification history joins the data export and is
  erased by `/api/erase`.
- `src/verifications.js` + dashboard: verification center and privacy page
  (download data, delete everything) in English, Persian and Pashto.
- `docs/CREDENTIAL-VERIFICATION.md`: provider matrix, status model, evidence
  rules, API contract, configuration, and outstanding issuer authorisations.

## 3. Test report (after the change)

| Suite | Result |
| --- | --- |
| `npm test` (full) | **414 pass / 0 fail / 0 skipped** |
| `npm run build` | succeeds; `index` 261.78 kB (82.63 kB gzip), CSS 148.25 kB |
| `tests/verification.test.js` | 4 tests: registry integrity, evidence rejection, consent/ownership/idempotency/persistence, request cap + private-path refusals |
| `tests/verification-api.test.js` | 2 tests: auth, consent, cross-account isolation, family refusal, export inclusion, erasure, 503 when unconfigured |
| `tests/frontend-verification-copy.test.js` | 2 tests: complete en/fa/ps copy for all 6 statuses and 5 access types; dashboard route copy |

Not claimed as tested: real browser rendering of the new dashboard pages, live
Firebase sign-in, live issuer portals, real OCR accuracy, Playwright browser
jobs, emulator rules jobs, macOS helper, and any deployment.

## 4. Security findings

1. **Fixed by design in this change:** no path can mark a credential verified
   from OCR, extracted text, user declaration, screenshot, model output or
   public-web name match. Negative tests prove it.
2. **Open (documented, not silently changed):** `npm audit` reports 4 high
   advisories — `picomatch` ReDoS and its dependents (`fdir`, `tinyglobby`,
   and `vite` via those) — all in the **build toolchain**, which is not shipped
   in `dist`. The suggested fix is a Vite major change; upgrading build tooling
   without browser regression runs was judged riskier than reporting it. No
   critical advisories. Production dependencies: 1 low, 6 moderate, 4 high, 0
   critical (11 total, all transitive).
3. **Open (pre-existing, documented in `docs/DOCUMENT-PDF-OCR-RELEASE-GATES.md`):**
   PDF/image intake in production is disabled because PDF.js/Tesseract assets
   would load from a third-party CDN; a CSP that allows Firebase's Google
   sign-in script/frame plus self-hosted audited OCR assets is still needed.
   TXT intake only in production, by design.
4. **Open:** human review of Persian and Pashto copy, including the new
   verification and privacy strings (`docs/TRANSLATION-REVIEW.json` is still
   `PENDING_HUMAN_REVIEW`).

## 5. Credential-provider integration matrix

See `docs/CREDENTIAL-VERIFICATION.md` for the full table. Summary:

- Institution-account mechanisms (authorisation required, no access granted):
  IELTS, TOEFL, Duolingo English Test, Cambridge English, PTE Academic, MyCreds.
- Public lookup the student can perform: Goethe, TestDaF, telc.
- QR-only: ÖSD.
- Issuer/centre contact: DELF, DALF, TCF, TEF.

**No official issuer integration is operational.** Every request stays `PENDING`
until an operator records an issuer's own confirmation through a server-side
path that has no HTTP route.

## 6. Remaining release blockers

1. Issuer authorisation/API credentials for any automated verification adapter.
2. Self-hosted, audited OCR + PDF assets under an enforced CSP (currently TXT-only
   in production).
3. Fluent human review of Persian/Pashto (and Pashto OCR accuracy evidence).
4. Browser/emulator/macOS CI jobs not executed in this cloud environment.
5. Dependency advisories in the build toolchain (no critical).

## 7. Decision

**NO-GO for the full v1.0 public release as specified**, because production OCR
is not enabled/verified (criterion 3), issuer verification is not authorised
(credential workflow exists but only as a request/consent record), and human
translation review is outstanding.

**GO for a scoped release candidate**: the app builds, 414 automated tests pass,
authentication/ownership isolation is enforced by tested code, data export and
deletion are complete, and no capability is falsely presented as verified. Public
release should follow the four blockers above, with no deployment performed by
this mission.
