# BursYar — Mission 42 release closure (2026-11-18)

Everything below is a result observed in this session. Anything not observed is
labelled NOT PROVEN, NOT RUN or NOT EXECUTED rather than implied.

## 1. Live backend verification

Backend commits were read from `/health` (`capabilities.build.commit`), which the
service derives from `RENDER_GIT_COMMIT`. Both the public host and the direct
Render host answered from the same build.

| Check | Path | Result |
|---|---|---|
| Health via Vercel proxy | `GET https://bursyar.vercel.app/health` | `200`, commit `7dbd75f6889ea09e96c129831bec40c463b6e64e` |
| Health direct | `GET https://bursyar-api.onrender.com/health` | `200`, same commit |
| Provider listing, unauthenticated | `GET /api/verifications/providers` | `401 Sign in with an approved account` |
| Request listing, unauthenticated | `GET /api/verifications` | `401` |
| Request creation, unauthenticated | `POST /api/verifications` | `401` |
| Foreign Origin | `POST /api/verifications` with `Origin: https://evil.example` | `403 Origin denied` |
| Proxy still authenticates | `GET /api/export` | `401` |

`scripts/verify-live-verification-api.mjs --expect-commit=7dbd75f…` reported
**5 passed, 0 failed, 1 skipped** against production: the deployed build exposes
the verification routes behind authentication (401, not 404) and rejects a
foreign Origin before authentication.

The deploy identifier `dep-dbuephmk1f9s73a22hi0` was supplied by the owner and is
not independently checked here — no Render dashboard or API access exists in this
environment. The commit served by `/health` is the evidence used.

**NOT PROVEN on production:** the authenticated create → list → withdraw leg. No
Firebase ID token or signed-in browser session is available here, so it was not
exercised and is not reported as working. The same check run against a locally
booted real engine (`createInferenceServer` + `DocumentStore` +
`VerificationStore`) passed **12/12**: providers matrix `200` with 14 issuers,
document upload `201`, create `201 PENDING`, list showed the request, withdraw
`200 NOT_REQUESTED`, withdrawal persisted, synthetic document deleted. That run
proves the code path, not the deployed deployment.

A skipped check is never counted as a pass. The script prints
`N passed, M failed, K skipped` plus a `NOT PROVEN` line, and `--require-auth`
turns a skipped authenticated leg into exit status 1. That defect was found and
fixed in this session: previously the skipped leg was recorded as `PASS`.

## 2. Source reconciliation

| Source | Status |
|---|---|
| GitHub `main` | `7dbd75f6889ea09e96c129831bec40c463b6e64e`; verification feature commit `c337011` is an ancestor |
| Mission 41 candidate | same lineage as `7dbd75f` |
| Local work branch | `7dbd75f` + `5f5b147` (docs) + `43dec23` (live-check script) + this closure commit |
| Google AI Studio source | **not present** in the workspace or repository; not used |
| ChatGPT-generated source archives | **none present**; not used |
| Deployed frontend | serves `assets/index-BBWmzBSU.js` (262 351 B) and `assets/index-BNrgtWZj.css` |

A local build of this tree emits `assets/index-D2V2hq6i.js` (261 780 B) with the
**same CSS hash**. Both bundles contain the verification UI (`verifications/providers`,
`VERIFIED_BY_ISSUER`, withdraw, PENDING strings all present), so the deployed
frontend includes the verification centre. The JS bundle is 571 bytes larger than
a local build and has a different content hash, so **byte-identity between the
deployed bundle and this commit is not established**; the difference is
consistent with a build-environment dependency resolution, but that is an
inference, not a measurement.

No older implementation was overwritten: this mission added no frontend source
changes, so the approved homepage, dashboard and document reader are the ones
already on `main`.

## 3. OCR / PDF production status

Completed and verified in this session:

- **PDF.js worker loading is self-hosted.** `src/pdf-runtime.js` imports the
  pinned `pdfjs-dist@4.10.38` worker through Vite's `?url`, and the production
  build emits it as `dist/assets/pdf.worker.min-yatZIOMy.mjs` (1 375 838 B),
  referenced by `dist/assets/pdf-runtime-BzfytgKk.js`. No CDN request is needed
  for PDF text extraction.
- **Validation limits** are unchanged and covered by the test suite: TXT 12 KB,
  PDF 5 MB / 5 pages, PNG/JPEG 5 MB with magic-byte and decoded-size checks.
- **Production binary intake remains TXT-only**, rejected client-side with a
  visible notice before any upload. This is the deliberate safe fallback, not an
  oversight.

Not completed, with the reason:

- **OCR assets are not vendored.** `src/document-extraction.js` still loads
  `tesseract.js@5.1.1` from `cdn.jsdelivr.net`. That path is reachable only in the
  local-demo/CI flow; production never requests it. Self-hosting the worker, the
  WASM core and `eng`/`fas`/`pus` language data is a multi-megabyte change that
  cannot be verified here (see below), so it was not made on release night.
- **No CSP is enforced.** `vercel.json` carries rewrites and cache headers only.
  The earlier CSP draft was withheld because it breaks Firebase's Google popup
  sign-in; enabling it requires a live sign-in test that is impossible in this
  environment.
- **Browser acceptance checks were NOT RUN.** `npx playwright install chromium`
  timed out after 295 s, so `verification/document-production-gate-browser.mjs`,
  `document-library-browser.mjs` and `document-preview-browser.mjs` were not
  executed. Mobile memory limits and real-device OCR were therefore not measured.

Claim that remains accurate: students can submit TXT for review in production;
PDF/image extraction runs on-device in the demo path and is not a production
capability yet. Text extraction never authenticates a document.

## 4. Credential-verification workflow

`listVerificationProviders()` returns **14** issuers; `autoVerificationAvailable`
is `false` for all of them, so no issuer approval can be inferred or displayed.

| Access mechanism | Issuers |
|---|---|
| `institution_account` (requires issuer authorisation) | IELTS, TOEFL iBT, Duolingo English Test, Cambridge English, PTE Academic |
| `public_lookup` | Goethe-Zertifikat, TestDaF, telc |
| `qr_app` | ÖSD |
| `issuer_contact` (requires authorisation) | DELF, DALF, TCF, TEF |
| `signed_document` (requires authorisation) | MyCreds |

The UI provides the full path: provider selection, the official verification URL,
the mechanism-specific guidance text (`access.*`), consent, submission, status
tracking, withdrawal and the standing note that this release has no authorised
issuer connection. `VERIFIED_BY_ISSUER` can only be reached by a server-side
issuer decision; there is no HTTP route that sets it.

## 5. Dependency exposure

`npm audit` — production view (`--omit=dev`): 0 critical, 4 high, 6 moderate,
1 low. Full tree: 0 critical, 10 high, 12 moderate, 1 low.

The four high advisories are all in the build/CI toolchain:

| Package | Advisory | Real exposure |
|---|---|---|
| `vite` | via `fdir`/`picomatch`/`tinyglobby` | build-time only; never imported by `engine/` or `src/`, and `picomatch`/`tinyglobby` occur **0** times in the shipped bundles |
| `fdir` | `>=5.2.1` | transitive of `vite` |
| `picomatch` | range `*` (no fixed version published) | transitive of `vite`/`firebase-tools` |
| `tinyglobby` | range `*` (no fixed version published) | transitive of `vite` |

`npm audit fix` offers **no safe fix**: every suggestion is a semver-major
downgrade (`vite` → `6.2.7`, `firebase-tools` → `13.11.2`), and two advisories have
no fixed version at all. A major downgrade of the build tool on release night was
rejected as untested risk. Nothing in the served frontend or the running backend
executes these packages, so the production request path is unaffected.

Remaining production-dependency advisories are transitive of `firebase-admin`/the
Firebase SDK (`fast-xml-parser` low, `gaxios`, `google-gax`, `gcp-metadata`,
`rimraf` moderate) and were not force-upgraded.

## 6. Security checks performed

- Unauthenticated access to every protected route returns `401` (live).
- A foreign `Origin` is rejected with `403` before authentication (live and local).
- Ownership isolation, listing scope, withdrawal and deletion: exercised by the
  12/12 local end-to-end run and by `tests/verification.test.js`,
  `tests/verification-api.test.js`, `tests/frontend-verification-copy.test.js`.
- `/api/export` includes verification requests; `/api/erase` cascades to them.
- No secret, token or student document was used, printed or committed.

## 7. Tests actually run (2026-11-18)

| Command | Result |
|---|---|
| `npm ci --no-audit --no-fund` | exit 0, 749 packages |
| `npm test` | exit 0 — **414 pass, 0 fail, 0 skipped** |
| `npm run test:evaluation` | exit 0 — **60 checks**, mode `OFFLINE_EXCERPT_FIXTURES_NOT_LIVE_META`, `liveMetaVerified: false` |
| `npm run build` | exit 0 — `index-D2V2hq6i.js` 261.78 kB (82.63 kB gzip), CSS 148.25 kB, PDF worker 1.37 MB |
| `npm audit` (prod / full) | 0 critical / 4 high / 6 moderate / 1 low — full: 0 / 10 / 12 / 1 |
| `scripts/verify-live-verification-api.mjs` production | 5 passed, 0 failed, 1 skipped (exit 0); `--require-auth` exit 1 |
| same script, local real engine | 12 passed, 0 failed, 0 skipped |
| `npm run test:emulator`, `test:browser`, macOS jobs | **NOT RUN** (Firebase emulator and Chromium unavailable in this environment) |

Earlier session results are not restated as if they were rerun.

## 8. External authorisations still required

Ten of the fourteen issuers require an issuer-controlled mechanism:
IELTS, TOEFL iBT, Duolingo English Test, Cambridge English, PTE Academic, DELF,
DALF, TCF, TEF, MyCreds. Goethe, TestDaF, telc and ÖSD expose a public lookup or
app check that the student completes themselves; BursYar still cannot state the
outcome.

Also outstanding: fluent Persian/Dari and Pashto review of the verification
strings (`docs/TRANSLATION-REVIEW-WORKSHEET.md`, new section, all rows PENDING),
and a human judgement on Pashto OCR accuracy, which has never been measured.

## 9. Decision

**GO** for the public v1.0 release of the scope described here: TXT-only document
review, request-only credential verification, no issuer auto-verification, no
credential claims.

**NO-GO** for anything beyond that scope: no claim that BursYar verifies
credentials, no production PDF/image OCR, no marketing of Pashto/Farsi accuracy,
until the authenticated production leg is run with a real account, human
translation review lands, and OCR assets are vendored with a tested CSP.

The authenticated production run is one command once an ID token exists:
`BURSYAR_VERIFY_TOKEN=… npm run verify:live-verification -- --require-auth`.
