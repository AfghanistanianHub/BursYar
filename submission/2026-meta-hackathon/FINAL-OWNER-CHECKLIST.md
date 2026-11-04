# BursYar — final owner checklist (Mission 19, 2026-11-03)

Single chronological list. Agent-verified items are checked; the rest
are owner-only in portal order.

## Verified by agents (do not redo)

- [x] Production serves release `cb9eff1` (PRs #109–#112):
      https://bursyar.vercel.app — fingerprinted live 2026-11-04
      (supersedes the `340a5e5` record).
- [x] Live QA 185/185 (en/fa/ps × 1440/768/390/320), axe clean,
      zero console errors, links intact (Mission 18 + §C recheck).
- [x] Production TXT-only document gate enforced and CI-proven;
      PDF/image intake stays disabled (Issue #88 open by design).
- [x] Meta evidence honest: exactly two recorded `muse-spark-1.3`
      runs (`d1bb0e0f`, `5a58bff8`); simulated film UI labeled;
      no other live AI claimed.
- [x] Final video selected and independently verified:
      `final-assets/BursYar-Meta-Hackathon-Demo.mp4` (2:59.50,
      1080p, narrated + captioned, SHA-256 in FINAL-VIDEO-REPORT.md);
      fallback cut retained in the same folder.
- [x] Submission text locked: `FINAL-SUBMISSION.md` (+ limitations).
- [x] CI green on all release PRs (#109, #110, #111, #112) and main; no PRs open.
- [x] Deadline reconfirmed on the public portal page 2026-11-04: Nov 4, 9:00 PM ET.

## Owner-only (in order, before Nov 4, 9:00 PM ET)

- [ ] 1. Log in to the portal; confirm video rules, team fields,
         declarations (FINAL-SUBMIT-NOW.md step 1).
- [ ] 2. Optional: TTS ear-check on the MP4 (step 2).
- [ ] 3. Upload the MP4 in-portal, or host unlisted + attach `.srt`
         (step 3). Real URL only — never a placeholder.
- [ ] 4. Paste fields, add team, accept declarations, submit, and
         screenshot the confirmation (step 4).
- [ ] 5. Report confirmation + video URL back to the agent chat
         (step 5). Project is NOT submitted until this exists.

## Freeze rules (until results)

- Do NOT merge, deploy, or edit production code.
- Do NOT change Firebase/Meta credentials, policies, or spending.
- Docs-only fixes allowed via PR with green CI.
- If the portal forces a video format change: agent re-cut via the
  reproducible pipeline only — no redesign under deadline.
