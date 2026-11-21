# Release manifest

One commit, one product. This file records exactly what a release contains so
the frontend, the backend and the evidence can be checked against each other.

## Release candidate

| Item | Value |
|---|---|
| Frontend commit | `b3947e5` on `work/restore-approved-ai-studio-hero` (merge of `main` + remediation batches 0–2) |
| Branch relation to `main` | `main` is an ancestor; the branch is 95 commits ahead, 0 behind |
| Backend commit deployed today | `7dbd75f` (reported by `GET /health`) — **not** this commit |
| Production deployment | unchanged (`dpl_7DaAvqwXK5JaMyhvjnE7gm1FH9b8`, commit `2162be3`) |
| Preview | not created for this candidate yet (a push to the branch produces one) |
| Database migrations | none in this batch: no schema change in `engine/documents.js` or `engine/verification.js` |
| Accessibility gate | 0 controls below 24×24 px at 320/390/768/1440; axe 0 violations (EN expanded, FA RTL) |
| Quality gate | `npm test` exit 0, `npm run test:evaluation` 60/60, `npm run build` exit 0 |

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
2. Deploy the backend from this same commit, then record its `/health` commit
   here. Frontend and backend must match before the release is called done.
3. Deploy the frontend, then:
   ```bash
   node scripts/release-smoke.mjs https://bursyar.vercel.app
   ```
   A 302 to `vercel.com/sso-api` fails the check; that is BY-01, an owner
   setting in Vercel → Settings → Deployment Protection.
4. Record the deployed SHA and the smoke output in this file.

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
- BY-08: scholarship dates are still stale and visibly marked; a human must
  re-check each official page.
- BY-12: documents without recognisable labels still need manual transcription.
- BY-21: new Farsi/Pashto strings await native review.
