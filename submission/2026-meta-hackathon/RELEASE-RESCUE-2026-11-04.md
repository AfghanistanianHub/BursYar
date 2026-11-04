# BursYar — rescue-mission release verification (2026-11-04)

Dated record for the final pre-deadline pass. Earlier Mission 18/19
records (`RELEASE-VERIFICATION.md`, `docs/MISSION-18-RELEASE-VERIFICATION.md`)
remain valid for their releases; this file supersedes only their
release pointers.

## Release

- Main: `cb9eff155d70fd113dd5a14043b0d2138879c582`
  (`docs(submission): refresh release pointers to production 342d7db (#112)`)
- Production: https://bursyar.vercel.app serves `cb9eff1` — bundles
  `index-zQcavhRk.js` / `index-B5HKycc2.css`. The JS bundle contains
  #110 `story-board` / `story-index` / `heroCaption` markers (from
  `22724b1`) plus #111 `noteProduction` / `fileProduction` markers;
  Vercel status on the merge commit is success.
- PR #109 (provenance/eligibility explainer) and PR #110 (storyboard
  hero, visual-only + honest illustration caption) merged earlier
  with all checks green; PR #111 merged after run 41913126191 and
  PR #112 after run 41915465486 (verify, emulator, macos-helper,
  browser, Vercel, Vercel Agent Review, Vercel Preview Comments —
  7/7 green each). No PRs open.
- `git diff 340a5e5 cb9eff1 -- engine/` is empty: no inference-path
  drift; the two recorded Muse runs (`d1bb0e0f`, `5a58bff8`) remain
  the only live-inference evidence and no new inference was made.

## Live verification (2026-11-04, no mocks)

- Production journeys A–G (`verification/production-journeys.mjs`):
  21 passed, 0 failed, 1 untested (Google sign-in completion —
  no test credentials used, by policy). Re-run green on both
  `342d7db` and `cb9eff1` deployments.
- Responsive/keyboard/console probe at 320/390/768/1024/1440 px ×
  en/fa/ps: 105/105 (no overflow, correct lang+dir, nav intact,
  keyboard reachability, zero console errors). Re-run green on
  `cb9eff1`.
- CTA/anchor sweep: 38/38 in-page anchors resolve (incl. the 5 new
  story-index links); trust explainer, guided fictional example,
  how-it-works, and PathFinder empty-state CTA present in all three
  languages.
- TXT-only production gate: document note and file label read
  TXT-only in en/fa/ps on live production; file `accept` stays
  `.txt`; binary pipeline remains local-dev-only.
- Backend: `GET /health` 200 `ok:true` via the Vercel rewrite and
  direct; Meta `configured` with per-request policy authorization
  required (no standing inference approval — expected).
- Video: `final-assets/BursYar-Meta-Hackathon-Demo.mp4` hash
  re-verified (`e954bbb4…28bc1`); extracted frames confirm real
  product footage with LIVE/REHEARSAL/synthetic-fixture banners,
  eligibility verdicts, and captions — not slides. Recorded against
  an earlier production UI; no claim in it depends on newer UI.
- Deadline rechecked on https://dev.meta.ai/events/global-hackathon
  (Key Dates): "Nov 4 Project submissions due by 9:00 PM ET".
  Tracks (Indie/Startup) and themes (Build for Your World /
  Push the Frontier) confirmed present.

## Submission status

**NOT SUBMITTED.** The owner files through the official portal
before November 4, 9:00 PM ET using `FINAL-SUBMISSION.md`. Two OWNER
placeholders remain: video hosting link and team roster. Portal
asset formats are login-gated and must be confirmed inside the
portal before upload.
