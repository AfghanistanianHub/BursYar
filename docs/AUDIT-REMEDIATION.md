# Audit remediation register (live)

Source audit: `BursYar — Independent Expert Audit` (21 November 2026), 25 findings.
Working branch: `work/restore-approved-ai-studio-hero`. Production is **unchanged**
by this work: nothing has been merged, promoted or redeployed.

## Deployment reality (verified 21 November 2026)

| Artefact | Commit | Evidence |
|---|---|---|
| Working branch `work/restore-approved-ai-studio-hero` | `6a20b1f` | `git log` after the push |
| Production frontend `bursyar.vercel.app` | `2162be3` (deployment `dpl_7DaAvqwXK5JaMyhvjnE7gm1FH9b8`) | last promoted Vercel deployment record; the hostname still answers `302` to `vercel.com/sso-api`, so its content cannot be inspected |
| Backend `bursyar-api.onrender.com` | `7dbd75f` | `GET /health` → `capabilities.build.commit = 7dbd75f6889ea09e96c129831bec40c463b6e64e` |

Three different commits. Code on the branch is not a release, so every finding
whose acceptance depends on a deployment or an access-policy change is recorded
as **BLOCKED** here, whatever its code state.

Status vocabulary: `OPEN → IN PROGRESS → IMPLEMENTED → VERIFIED`, plus `BLOCKED`.
`VERIFIED` requires a reproduced check, not a code change.

| ID | Sev | Status | Correction | Evidence |
|---|---|---|---|---|
| BY-01 | P0 | **BLOCKED** (owner) | Deployment protection is a Vercel project setting; this worktree has no credentials and changing it needs explicit owner approval. A release smoke check was added so a release fails if `/` is not 200 without cookies. | `scripts/release-smoke.mjs` |
| BY-02 | P0 | IMPLEMENTED | `GET /api/me` capability probe; `403 {code:'account_not_enrolled'}` distinct from `401`; sign-in block explains the closed pilot, offers “Check again”, and an optional `VITE_ACCESS_REQUEST_URL`. The `bursyarDemo` gate was **not** removed. | `engine/auth.js`, `engine/http.js`, `src/auth.js`, `src/sign-in-action.js`, `tests/account-capability.test.js` |
| BY-03 | P0 | **VERIFIED** | Stale timeout tests aligned to the hardened contract; falsy-body test added; missing `GET /api/verifications/:id` implemented (was the 405); CI runs on every branch and runs `npm audit --omit=dev`. | `npm test` exit 0; `npm run test:evaluation` exit 0; `.github/workflows/web-checks.yml` |
| BY-04 | P0 | **BLOCKED** (deployment) | Repository side is reconciled: `main` merged into the branch (`0b62a79`), branch 0 behind / 96 ahead of `main`, one candidate (`6a20b1f`) and a `RELEASE.md` manifest. The finding is **not** resolved: the deployed artefacts still differ — branch `6a20b1f`, Production frontend `2162be3`, backend `7dbd75f`. Merging to `main`, promoting Production and redeploying the backend all require owner approval, so acceptance (“Production and `/health` report the same commit”) cannot be met here. | `git rev-list --left-right --count`, `RELEASE.md`, `curl /health`, `scripts/release-smoke.mjs` |
| BY-05 | P1 | IMPLEMENTED | First-request budget 60 s; timeouts and 503s map to “service is starting / temporarily unavailable”, never to an account diagnosis; profile uses the same bounded request path. | `src/document-request.js`, `src/profile-form.js` |
| BY-06 | P1 | **VERIFIED** | Signed-out document panel mounts the in-panel sign-in action before any upload; file input and upload are disabled; extraction cannot start. | browser: `.sign-in-action` present, upload `disabled` |
| BY-07 | P1 | IMPLEMENTED | Browser-session persistence by default, explicit “Keep me signed in” opt-in to local persistence, redirect fallback for blocked popups, redirect result consumed on load, sign-out clears the preference. | `src/auth.js`, `src/sign-in-action.js` |
| BY-08 | P1 | PARTIAL | Staleness badge and 30-day recheck window already existed on `main` and survive the merge. The underlying dates are **still stale**: refreshing them without reading each official page would fabricate freshness, so the data is untouched and the rows remain visibly marked. | `src/research-catalog.js`, `src/research-explorer.js` |
| BY-09 | P1 | PARTIAL | Duplicate navigation destination removed (“Resources” now points at its own section); one visible `<h1>` per view. The three-task route split (`#/find`, `#/check`, `#/prepare`) is not done. | browser: `dupNav` empty |
| BY-10 | P1 | IMPLEMENTED | Operator-only decision CLI with mandatory issuer evidence, append-only audit event, `--confirm` gate and no document access; runbook added. The verification service can now be constructed without document storage, and the API still cannot decide a request. | `scripts/verification-decision.mjs`, `docs/VERIFICATION-OPERATIONS.md`, `tests/verification-operator.test.js` |
| BY-11 | P1 | **VERIFIED** | Storage faults on local routes return 503 (client-shape errors keep their status); sanitised failure record with a request id; per-class capacity with a 2 s queue and `Retry-After` instead of a global two-request ceiling. | `tests/gateway-resilience.test.js` |
| BY-12 | P1 | OPEN | Guided field-mapping review is not built. | — |
| BY-13 | P1 | **VERIFIED** | 0 controls below 24×24 CSS px at 320/390/768/1440 with all disclosures open (was 26–28); the `min-height:0` reset that shrank workspace links was corrected at its source. | browser measurement |
| BY-14 | P2 | OPEN | Full-app re-render on keystroke remains. | — |
| BY-15 | P2 | OPEN | CSS layers not consolidated. | — |
| BY-16 | P2 | IMPLEMENTED | Dashboard `<h1>` always carries its view title instead of rendering empty; duplicate nav destination removed. | `src/student-dashboard.js`, `src/main.js` |
| BY-17 | P2 | OPEN | Bundle still eager (≈298 kB raw / 94 kB gzip JS). | build output |
| BY-18 | P2 | IMPLEMENTED | HSTS and Permissions-Policy added; CSP unchanged (inline styles still allowed, backend host still literal). | `vercel.json` |
| BY-19 | P2 | IMPLEMENTED | Boot failures render a recovery card with reload; sanitised `client_error` records (stage + message, no identity, token or document text); auth-init failure is logged instead of swallowed. | `src/main.js` |
| BY-20 | P2 | **VERIFIED** | `body !== undefined` (already fixed upstream at `9479c8f`) plus a regression test for `false`, `null`, `{}`, `0`, `''`. | `tests/document-request.test.js` |
| BY-21 | P2 | OPEN | New `fa`/`ps` strings are marked UNREVIEWED; native review still required. | `docs/TRANSLATION-REVIEW.json` |
| BY-22 | P2 | IMPLEMENTED | `<noscript>` explains the JavaScript requirement and offers a help path. | `index.html` (markup verified; visual rendering not) |
| BY-23 | P2 | OPEN | Dashboard still teleports panel nodes. | — |
| BY-24 | P2 | IMPLEMENTED | Remaining document slots shown, upload disabled at the limit with an explicit message. | `src/documents.js` |
| BY-25 | P2 | **BLOCKED** (deployment) | Repository side is done: `render.yaml` already describes the API service (build/start command, health check, every secret `sync: false`) and `RELEASE.md` records the frontend and backend SHAs separately. Reproducibility is still unproven, because the running backend is `7dbd75f` deployed by hand — no deploy has yet been made *from* this manifest, so the procedure is untested rather than verified. | `render.yaml`, `RELEASE.md`, `curl /health` |

## Checks run for this register

- `npm test` — exit 0 (full suite, Node 24 target; run on Node 26 here).
- `npm run test:evaluation` — 60/60 fixture checks pass, no live-model claim.
- `npm run build` — exit 0.
- Browser (Cloud browser, dev server): target sizes, duplicate destinations,
  `<h1>` count, signed-out document gate, Farsi RTL, axe WCAG 2.0/2.1/2.2 A+AA
  (0 violations in English and Farsi), horizontal overflow at 320/390/768/1440.
- Deployment facts re-checked on 21 November 2026 after the push: the branch is
  `6a20b1f`, `/health` still reports `7dbd75f`, and the production hostname still
  redirects to SSO. No deployment was performed in this batch.
- Not verified: signed-in journeys (no enrolled account), Production behaviour
  (still behind SSO), real OCR quality, native translation quality, thumb test.
