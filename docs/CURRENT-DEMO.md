# Current BursYar demo — start here

This file supersedes historical release status in earlier handoffs. It records observed scope, not a claim that every planned feature or the hackathon submission is complete.

## Open and identify the release

- App: https://bursyar.vercel.app
- Last verified production code: `35fa856` (PR #81; serves bundles
  `index-C3_hpZE2.js` / `index-yzGWkncG.css` containing the #69/#71
  markers (`skip-link`, `hero-actions`, `empty-note`,
  `summary::marker`), #72 markers (`glyph-doc`,
  `glyph-search`, `eligibility-example`), M14 markers
  (`hero-visual`, `how-it-works`, `chain-verdicts`), and M16 markers
  (`nextEmpty`, `nextEmptyCta`). Previous: `c9eaa04` (PR #80).
- CI: PR #81 — verify, emulator, macos-helper, and browser jobs all
  green (browser pinned to ubuntu-24.04; see PR #79).
- 343 Node tests, production build, full mocked browser journey,
  research/document browser checks, emulator and macOS-helper checks
  passed. Network failure injection is local, not a production
  interruption.
- Render backend remains `4e272a74e65df5ccf2318f3adac312196f5db443`; later changes have not changed its engine/database code. No backend redeploy was needed for these UI changes.

## Short demonstration without new paid inference

1. Open Account and use the existing approved Google demo account. Do not create another account or change Firebase claims.
2. Overview → Explore opportunities. Search, filter by country/funding/degree and save a reference. These are historical research leads; open status and eligibility are not verified.
3. Choose Review this source. Its public URL enters the real source form; previous source approval/results are invalidated. Nothing is fetched or analyzed automatically.
4. Review profile & documents → Paste educational text instead. Use only the public synthetic fixture below, check the displayed storage consent and choose Upload and inspect.
5. Each extracted claim starts undecided. Choose Reject for the synthetic degree, then approve the reviewed decisions. This exercises review without adding a fake degree to the saved profile.
6. Reload, sign in again, refresh the private document library and open the clearly labeled synthetic record. Its original text and Reviewed—not verified state should return from the server.
7. Show the explicitly labeled local/deterministic assessment and next steps as the AI-free path. Do not present its fictional example as an assessment of a real research listing.
8. Switch English/Farsi/Pashto and show RTL. Language switching does not authorize another model request.

Synthetic input (never a real certificate):

```text
SYNTHETIC STORAGE TEST ONLY - NOT A REAL CERTIFICATE OR STUDENT RECORD
Degree: bachelor
```

One record with this public synthetic text was retained in the approved demo library after live testing. Its degree claim was rejected; no synthetic degree fact was applied. Use the existing record for repeat demonstrations rather than repeatedly uploading duplicates.

## What has actually worked online

- Real Google sign-in with the owner-selected existing demo account.
- Discovery → source-form handoff and en/fa/ps switching.
- Real hosted pasted-text ingestion, bounded extraction, explicit review, private storage and readback after full page reload and fresh sign-in (PR #59).
- A previous authorized Meta Standard Muse Spark 1.3 request succeeded: `5a58bff8-0885-42c3-a707-60ce1fe4a8e9`; see HOSTED-META.md. This was manually supplied public Oxford text, partial and human-unreviewed. No new inference was made during PRs #54/#57/#59/#60.

## Boundaries and remaining work

- Native file selection/upload was tested locally with synthetic TXT files; the separate live file test remains unverified because browser-managed fixture transfer timed out. Pasted-text verification does not establish file-upload verification.
- TXT/UTF-8 text only, 12 KB; no PDF/image extraction or issuer authentication. Accepting a claim never establishes authenticity.
- After a lost write response, inspect the library before resubmitting. Requests allow 45 seconds and never retry automatically. Server-side upload idempotency is not implemented.
- Meta health/configuration is not new inference evidence. A new live request needs applicable authorization and a valid trusted policy record; do not manufacture or renew attestations. The previous one-request authorization was consumed. Keep Standard/Contributor, age and geography gates intact.
- Fluent human fa/ps and semantic review, current official-source re-verification, and assistive-technology/real-device review remain pending. Automated axe checks are not a blanket accessibility-compliance claim.
- No hackathon entry was submitted. Confirm official portal requirements and obtain explicit submission authorization before filing.

## Continue efficiently

Fetch current main and check newer PRs before editing. Preserve uncommitted work and retained Muse worktrees. Reuse the connected application and existing MagicPath references; do not rebuild a parallel app. Never treat an old handoff's “unmerged”, “no deployment” or “Meta never worked” statement as current status. Run checks appropriate to actual changes; do not repeat paid inference to recreate already-recorded integration evidence.
