# BursYar — final evidence index (Mission 19, 2026-11-03; release pointers refreshed 2026-11-04)

Every claim in the submission resolves to one of these artifacts.
Paths are repo-relative unless noted; SHAs are SHA-256.

## Release & deployment

- Production app: https://bursyar.vercel.app — release `main`
  `342d7db` (PRs #109/#111; supersedes the `340a5e5` /
  `index-cslf-rZ1.js` record); bundles `index-CyL0ZQ5P.js` /
  `index-5BE0k3Lv.css` (JS carries `noteProduction` /
  `fileProduction` markers unique to `342d7db`; CSS name identical
  to the local build). Fingerprint proof:
  `submission/2026-meta-hackathon/RELEASE-RESCUE-2026-11-04.md`;
  prior proof `docs/MISSION-18-RELEASE-VERIFICATION.md` §1.
- Backend health: https://bursyar.vercel.app/health (`ok:true`,
  rechecked 2026-11-04).
- CI: PR #111 run 41913126191 (7/7 green); PR #109 merged with all
  checks green; no PRs open.
- Release verification records:
  `submission/2026-meta-hackathon/RELEASE-VERIFICATION.md` (M18)
  and `RELEASE-RESCUE-2026-11-04.md` (rescue mission).

## Product verification

- Live production QA 185/185 (en/fa/ps × 1440/768/390/320) + axe +
  link sweep: method and results in
  `docs/MISSION-18-RELEASE-VERIFICATION.md` §2 (logs/screenshots
  were verification-time artifacts, available on request).
- Shipped-tree authenticated document workflow (consent, auto-load,
  reload, selection, review, isolation, deletion, lost-response,
  idempotent retry, no exfil): same report §3–§4.
- Production TXT-only gate: live QA (12/12 cells) + CI test
  `verification/document-production-gate-browser.mjs`.
- Unit/eval/emulator/browser/macOS suites: standard CI; totals in
  the §10 report (361 / 60 / 47 / 15+).

## Meta Muse Spark evidence

- `submission/2026-meta-hackathon/META-INTEGRATION-EVIDENCE.md` —
  run table + spending controls (TWO runs, no more).
- Local run `d1bb0e0f-6f23-40d6-88f6-915f4f759d5c` (28 Oct):
  `docs/checkpoints/15-live-inference-verified.md`.
- Hosted run `5a58bff8-0885-42c3-a707-60ce1fe4a8e9` (1 Nov):
  `docs/HOSTED-META.md` + `docs/checkpoints/18-*.md`.
- Inference-path stability: all of `engine/` except `documents.js`
  byte-identical from backend `4e272a7` to `342d7db`
  (`git diff 4e272a7 342d7db -- engine/`; zero drift since `340a5e5`).
- No-prompts-retained policy + per-request gates:
  `docs/HOSTED-META.md`, `docs/INFERENCE-RUNBOOK.md`.

## Video

- Final: `submission/2026-meta-hackathon/final-assets/BursYar-Meta-Hackathon-Demo.mp4`
  (26,984,833 bytes, SHA-256 `e954bbb4…28bc` — full value in
  FINAL-VIDEO-REPORT.md) + 46-cue `.srt` + `M18-RECUT-*.md`.
  Reproducible pipeline (footage, audio, labels, scripts):
  `verification/video-production/m18/` (README inside).
- FALLBACK (retained, verified): `.../final-assets/BursYar-Hackathon-Demo-Final.mp4`
  (8,878,877 bytes, SHA-256 `731016d5…c347`) + narration script +
  `VIDEO-QUALITY-REPORT.md` + `BursYar-Video-Manifest.json`.
- Selection rationale: `FINAL-VIDEO-REPORT.md` (this folder).

## Submission text & portal

- Paste-ready fields: `FINAL-SUBMISSION.md` (this folder).
- Owner action sheet: `FINAL-SUBMIT-NOW.md` (this folder).
- Owner checklist: `FINAL-OWNER-CHECKLIST.md` (this folder).
- Portal: https://cerebralvalley.ai/e/meta-ai-developer-hackathon —
  deadline Nov 4, 9:00 PM ET reconfirmed on the public page
  2026-11-04 (see FINAL-SUBMIT-NOW.md for the login-gated rest).
  Submission status: **NOT SUBMITTED** (owner files in portal).

## Open items (tracked, none submission-blocking)

- Issue #88 (PDF/OCR production enablement): OPEN by design;
  production safely TXT-gated with CI proof.
- Issue #91 (library reload): CLOSED by #93, verified live.
- Translations pending fluent review: `docs/TRANSLATION-REVIEW.json`.
