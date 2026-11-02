# Production release verification — 2026-11-02

Release merges #55 (assistant-copy style), #56 (workspace polish),
#57 (document-first workspace), #59 (paste-document input),
#58 (nav highlight fix), #60 (document network recovery) are all on
`main` at `9e00755`. No paid inference, billing change, new
infrastructure, or destructive action was taken for this verification.

## Deployed frontend

- Production URL: https://bursyar.vercel.app (HTTPS 200, HSTS
  `max-age=63072000`, existing Vercel Git integration; no new config).
- Served bundle `index-DW-rj6vO.js` (158,203 bytes) contains release
  markers for every merged PR: `workspace-overview` (#54),
  `barrier-summary`/`empty-note`/`noResults` (#56), `missingFile` /
  `unsupportedFile` / `fileTooLarge` / `invalidEncoding` / `emptyFile`
  (#57), `pasteLabel` / `pasteNote` / `pasteTitle` (#59), second
  `removeAttribute('aria-current')` (#58), and `mutationUncertain` /
  `requestTimedOut` / `requestNetworkError` (#60). CSS bundle matches
  the release build exactly. Deployed content is therefore the `main`
  tip `9e00755`; nothing newer exists to deploy.
- A filename-hash comparison against a stale local `node_modules`
  build initially misled; content markers are the authoritative
  evidence. Local builds must use `npm ci` for reproducibility.

## Hosted backend (unchanged, current)

- `engine/` is byte-identical between the deployed backend commit
  `4e272a74e65df5ccf2318f3adac312196f5db443` and `9e00755`; no
  backend redeploy was required.
- `GET https://bursyar.vercel.app/health` (rewrite) and the Render
  origin both return 200 with `ok:true`; capabilities report Meta
  `configured`, local assessment available, document storage
  available.

## Live production checks (read-only, unauthenticated)

29/29 headless Chromium checks passed against production on
2026-11-02: HTTPS status/headers, `/health` rewrite, backend
capabilities, and per-variant (en-1280, fa-390, ps-1280) RTL
direction, workspace overview, journey navigation, opportunity-card
filters (search/country/level), empty state, card detail open/close,
fictional-eligibility PathFinder status + scenario, documents/profile
panel presence, and zero page errors. Screenshots read back for each
variant. No sign-in, upload, analysis request, or Meta call was made.

## Live Meta inference

No new live inference was run: the release changes nothing in the
inference path (`engine/` identical to the verified backend), and the
recorded hosted run (`5a58bff8-0885-42c3-a707-60ce1fe4a8e9`,
6089 reserved units under the owner-confirmed USD 50 ceiling,
HOSTED-META.md) already proves integration. A further run would
consume budget for zero new signal.

## CI

- PR #58 exact head `e664299`: verify/emulator/browser/macos-helper
  SUCCESS, MERGEABLE/CLEAN, no blocking reviews → merged `503f365`.
- `main` `9e00755`: BursYar web checks completed/success.
- Independent runs on the merged trees: 304/304 unit, build,
  60/60 evaluation, 15/15 mocked browser with axe clean.

## Remaining limits

- Authenticated production flows (Google sign-in, document upload,
  live analysis) were not exercised here: no approved demo
  credentials in automation, and live analysis needs fresh explicit
  approval per run. The mocked suites cover these paths.
- fa/ps strings remain UNREVIEWED (`TRANSLATION-REVIEW.json`).
- Submission logistics (portal, rules, assets, deadline) unverified;
  no submission filed by this work.
