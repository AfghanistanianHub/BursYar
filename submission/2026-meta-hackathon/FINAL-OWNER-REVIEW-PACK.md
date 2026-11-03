# BursYar — FINAL OWNER REVIEW PACK (Mission 18, 2026-11-03)

Single approval document. Release is FROZEN unless a P0/P1 defect is
reproduced. Submission status: **NOT SUBMITTED**.

- Release: `main 340a5e5` (PRs #86, #92, #93 incl. document PDF/OCR
  code TXT-gated in production, library reload fix, production gate
  tests; supersedes the `f9edf1e` / `59fb81f` freeze record).
- Live URL: https://bursyar.vercel.app (`index-cslf-rZ1.js`,
  `index-yzGWkncG.css`; SHA fingerprinted live 2026-11-03).
- Backend: https://bursyar-api.onrender.com/health → 200 `ok:true`.
- Repository: https://github.com/AfghanistanianHub/BursYar (public).
- Video: `submission/2026-meta-hackathon/final-assets/BursYar-Hackathon-Demo-Final.mp4`
  (2:59.90, 1080p H.264, captioned silent, 8.5 MB, decode-clean,
  SHA-256 `731016d5ca3d948eac96b415860b3ae1e853117c05db5953eb4a25c276fac347`).

```sh
open "submission/2026-meta-hackathon/final-assets/BursYar-Hackathon-Demo-Final.mp4"
```

## Project description (paste-ready, accuracy-fixed)

Tagline: Review scholarship evidence and build a practical action
plan — in English, Dari, and Pashto.

Full text: `submission/2026-meta-hackathon/FINAL-SUBMISSION.md`
(evidence-matching language, no "verified requirements" claim, no
guaranteed retrieval, documents as access-controlled library).

## Meta integration (honest levels)

- Configured: YES (`/health` reports `meta.configured`).
- Reachable right now: UNVERIFIED (no probe without inference).
- Historical inference: YES — `d1bb0e0f` (local), `5a58bff8`
  (hosted), both validated downstream, `requiresHumanReview=true`.
- Fresh live inference: NOT verified (no spend by design).
- Boundary (code-verified): provider receives only public source
  text — not the URL, identity, profile, documents, or quota.
  Standard models only, no retries, quota reserved before inference.

## Capability evidence (frozen release)

| Capability | Level | Note |
|---|---|---|
| Google auth | RECORDED HOSTED (PR #59) | Re-check needs your sign-in: `verification/OWNER-AUTHENTICATED-ACCEPTANCE.md` |
| Profile persistence | RECORDED HOSTED + MOCKED | Same acceptance procedure |
| TXT upload + claim review | RECORDED HOSTED (paste) + LOCAL (file input) | Hosted file-picker check in acceptance §C |
| PDF/image upload | DISABLED IN PRODUCTION (TXT-only notice + picker filter + extractor refusal, CI-gated) | Merged PR #86 ships the pipeline TXT-gated; enablement needs audited self-hosted assets (Issue #88 open) |
| Issuer authenticity | NOT IMPLEMENTED (always `not_verified`) | UI + docs state this everywhere |
| Retry idempotency | LOCAL VERIFIED (PR #83) | Served bundle carries it; hosted dedupe needs your check §D |
| Source fetch + approval | HOSTED VERIFIED (signed-out gate) | Authenticated fetch needs your session |
| Meta inference | RECORDED (2 runs) | See levels above |
| Evidence validation | LOCAL VERIFIED (60 eval checks) | Deterministic |
| Eligibility MET/NOT MET/UNKNOWN | HOSTED VERIFIED (demo) | Signed-out demo works; live path needs analysis |
| PathFinder | HOSTED (empty state) + LOCAL (populated) | M16 fix verified live |
| Privacy/consent/guardian/jurisdiction | LOCAL VERIFIED (tests) | Gates intact; no bypasses |
| Research discovery | HOSTED VERIFIED | 12/12 `needs_reverification`, labeled |
| Trilingual UI + RTL | HOSTED VERIFIED (layout) | 401+401 strings PENDING human review |

## Localization

No new corrections in M18 (nothing confidently wrong found).
Reviewer worksheet: `docs/TRANSLATION-REVIEW-WORKSHEET.md` (44
judge-facing rows, all PENDING). Do not claim human approval.

## Owner-only actions (in order)

1. Optional but valuable: run `verification/OWNER-AUTHENTICATED-ACCEPTANCE.md`
   (§A–E, ~15 min) and report PASS/FAIL per section.
2. Log in at https://cerebralvalley.ai/e/meta-ai-developer-hackathon;
   confirm video rules, team fields, declarations (all login-gated).
3. Upload the MP4 above; paste fields from FINAL-SUBMISSION.md.
4. Accept declarations yourself; submit before Nov 4, 9:00 PM ET.

## Risks

- P0: none. P1: none open. P2: 6 (hosted-auth age, fa/ps review debt,
  device/AT coverage, portal unknowns, hosted-dedupe check, video
  footage one release behind current production UI).
- Merged PR #86 ships in the frozen release with production binary
  intake DISABLED (TXT-only); #91 reload fix (#93) included.
- Deadline may shift at Meta's discretion — recheck the dates page
  (Nov 4, 9:00 PM ET confirmed on the public page 2026-11-03).

## Submission status: NOT SUBMITTED
