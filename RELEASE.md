# Release manifest

One commit, one product. This file records exactly what a release contains so
the frontend, the backend and the evidence can be checked against each other.

## Verified deployment inventory (2026-11-22; branch re-measured 2026-11-23)

| Item | Verified value |
|---|---|
| Canonical development branch | `work/restore-approved-ai-studio-hero` |
| Last verified development commit before this documentation update | `15c2fcb137d0ac170c57f709eef11414484120d0` — measured on the remote branch, 2026-11-23 |
| Development preview | `dpl_4fqwHfH6H1f7ZZyckyjjgeqhv2Pa` — READY; `https://bursyar-pn491xkbk-afghan-hub-s-projects.vercel.app` |
| Production frontend branch and commit | `main` — `2162be3e21962db23bdb022586bdf0e491ffaa96` |
| Production frontend deployment | `bursyar-otgc3du9d-afghan-hub-s-projects.vercel.app` — READY |
| Frontend build stamp | `<meta name="bursyar-build">`, written by `vite.config.js` from `VERCEL_GIT_COMMIT_SHA`, `GITHUB_SHA` or `git rev-parse HEAD`; `unknown` fails the smoke check |
| Branch relationship | 181 commits ahead, 0 behind `main` at `15c2fcb` — measured 2026-11-23 |
| GitHub combined commit status | Vercel success only; does not prove unit, evaluation, browser, or backend integration tests |
| Backend production SHA | `7dbd75f6889ea09e96c129831bec40c463b6e64e` — read from `/health` `capabilities.build.commit` on 2026-11-22 |
| 9Router | Separate free Render experimental service, not part of production application |
| Release decision | HOLD — no production deployment authorized |

**This inventory supersedes older candidate and production SHA statements below.** A successful Vercel build is not a release acceptance test. Do not infer that AI Studio / Freebuff workspaces are synchronized; compare their actual exports before claiming full reconciliation.

### Required pre-release reconciliation

1. Export and diff any outstanding Google AI Studio and Freebuff changes against the canonical development branch; do not overwrite approved Hero or newer work.
2. Verify current development HEAD and run unit, evaluation, build, browser, accessibility, RTL, authentication, document-processing, scholarship, and security checks on the **same** commit.
3. Verify Render backend deployment SHA and API health against the release candidate. Align frontend/backend contracts without changing production prematurely.
4. Resolve Vercel SSO/protection and pilot enrolment policy intentionally; never disable protection silently.
5. Obtain explicit owner approval to deploy both components, verify production SHAs, and run post-release smoke tests.

## What is in this candidate

- Batch 0: capability model and 401/403 distinction, single-request read,
  branch-wide CI with `npm audit`, green test suite, `main` merged in.
- Batch 1: durable sessions with redirect fallback, enrolment-aware sign-in,
  60 s first-request budget with cold-start copy, document capacity, single
  labelled view heading, HSTS and Permissions-Policy, render recovery card,
  `<noscript>`.
- Batch 2: operator issuer-decision CLI and runbook, per-route capacity with a
  short queue, retryable 503 for storage faults, WCAG 2.2 target sizes,
  one navigation label per destination, release smoke check.

The full per-finding status is in [`docs/AUDIT-REMEDIATION.md`](docs/AUDIT-REMEDIATION.md).

## Release procedure (requires owner approval)

1. Run the gates on the candidate commit:
   ```bash
   npm ci
   npm test
   npm run test:evaluation
   npm run build
   BASE_URL=http://127.0.0.1:3006 node verification/audit-remediation-browser.mjs
   ```
2. Confirm the research freshness gate. `npm test` runs the unit suite and then
   `scripts/check-research.mjs`, so the suite itself is date-independent while
   the gate fails when any shipped scholarship row is outside the recheck window
   its provenance earns: 14 days for an automated source read, 30 days for a
   human source check (unknown provenance gets 14). The gate prints its own
   report — every overdue row with its recorded date, provenance window and how
   far past it is — so the failure is not another anonymous unit test. For each one, re-read the official page, update
   `lastCheckedAt` and `lastCheckedBy` in `src/research-data.js`, and record the
   evidence in a dated `docs/RESEARCH-RECHECK-<date>.md`; then re-run the gates.
   `npm run research:recheck` fetches each source and drafts that record with a
   per-row verdict (`deadline_found`, `deadline_not_found`, `no_recorded_deadline`,
   `unreachable`). It never writes a check date: a row it cannot confirm is the
   one to read by hand, and the draft is not evidence until someone signs it.
   Never skip, silence or re-date the check to unblock a release — the dates on
   the cards are the only freshness claim the product makes. To see what needs
   re-reading without running the suite, use `npm run check:research` (add
   `--now=YYYY-MM-DD` to preview a future date); it exits non-zero while any row
   is overdue. A weekly scheduled workflow (`.github/workflows/research-freshness.yml`)
   runs the same check for today and one week ahead and opens or updates a
   tracking issue, so expiry is reported before it fails a branch. As of 22 November
   2026 all 12 rows are automated reads dated 2026-11-22, so the gate blocks
   releases from 7 December 2026 until they are re-read.
3. Deploy the backend from this same commit, then record its `/health` commit
   here. Frontend and backend must match before the release is called done.
4. Deploy the frontend, then:
   ```bash
   node scripts/release-smoke.mjs https://bursyar.vercel.app
   ```
   The smoke check now requires the frontend build stamp, the backend
   `/health` commit and the two commit rows below to agree, so a release cannot
   be called done while two commits are live. Where the host hides an artefact
   (the SSO redirect, an unreachable `/health`) parity is reported as
   unmeasurable rather than mismatched — the SSO line is still the failure. A 302 to `vercel.com/sso-api`
   fails the check; that is BY-01, an owner setting in Vercel → Settings →
   Deployment Protection. The `/health` probe is bounded at 45 s
   (`BURSYAR_SMOKE_HEALTH_TIMEOUT_MS` overrides it), so a sleeping free-plan
   backend fails the run with `no answer within … ms` instead of hanging it,
   and the parity lines stay unmeasurable.
5. Record the deployed SHAs in this inventory and the smoke output here, then
   re-run the smoke check. This file is bookkeeping: updating it adds a commit
   but changes no artefact, so the deployed pair stays what step 4 verified.

## Rollback

- Frontend: promote the previous Vercel deployment (`dpl_7DaAvqwXK5JaMyhvjnE7gm1FH9b8`)
  in the Vercel dashboard; no database change to undo.
- Backend: redeploy the previous backend commit (`7dbd75f`) from the Render
  dashboard; documents, profiles and verification records are unaffected because
  this batch changes no schema.
- If a release fails the smoke check, leave Production on the previous
  deployment rather than unpublishing the hostname.

## Known gaps before a public release

- BY-01: Production is still behind Vercel Authentication (owner action).
- BY-02: the pilot stays closed; accounts must be enrolled by an operator.
- BY-08: the 12 scholarship check dates are automated source reads dated
  2026-11-22 and expire on 6 December 2026. Expiry fails `npm test` (release
  step 2), so a human must re-read each official page before the next release.
- BY-12: documents without recognisable labels still need manual transcription.
- BY-21: new Farsi/Pashto strings await native review.
