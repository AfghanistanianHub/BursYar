# BursYar — video quality report

File: `BursYar-Hackathon-Demo-Final.mp4` (Mission 15 re-record from
release `dbfb054`; supersedes the Mission 09 render. SHA-256 in
`BursYar-Video-Manifest.json`).

## Verification performed

- Probe: 2:59.90, 1920×1080, H.264 High yuv420p, 30 fps, 8.5 MB.
- Full decode: clean, zero errors.
- Frames inspected at 0:25 (new hero + LIVE tag + caption in sync),
  1:10 (Meta evidence card), 2:25 (Farsi RTL with corrected copy),
  2:45 (impact card): cards legible, captions readable, LIVE vs
  REHEARSAL tags present on every app segment, rehearsal banner
  visible in rehearsal footage, fades clean at both ends.
- Assembly hardened: `vid` segments are now trimmed/freeze-padded to
  exact planned durations so captions stay in sync across re-records.
- Caption fixes applied and re-verified in v2 (Meta-card overlap
  resolved; impact-card duplication removed).
- Script accuracy: every caption matches its footage; Bristol URL
  gate, barrier answers, hypothetical isolation, and library
  persistence all show real UI behavior. No mocked frame is
  presented as live inference.

## Critical review (Mission 10)

- First 15 seconds establish the people served and the product.
- Longest static hold is the self-labeled impact card (28s).
- Weakest moment: the 5s signed-out gate slice — kept because it
  demonstrates honest access control, with an explanatory caption.
- Local TTS (legacy macOS voices, 22 kHz sample rendered) judged
  below professional narration quality; shipped video stays
  captioned-silent with a time-coded script for optional
  owner-recorded audio.

## Limitations

- Provisional 3-minute cut; re-cut from `m09/` sources if the
  portal requires another length (assembly is reproducible).
- No voiceover; judges watching with sound hear silence.
- Rehearsal scenes show simulated services honestly labeled —
  they are UI-accurate but not live-backend proof.

## Mission 18 re-verification (2026-11-03, vs production `340a5e5`)

- SHA-256 re-matched to the manifest; Chrome playback re-verified
  (179.9 s, 1920×1080, readyState 4, time advancing); frames at
  0:25/1:10/2:25/2:45 re-inspected.
- All feature claims re-checked against current production: the two
  Muse Spark runs match recorded metadata, the simulated analysis UI
  is explicitly labeled, no PDF/OCR-in-production is claimed, and the
  translation/research-lead caveats hold.
- Footage predates the production TXT-only notice and library
  auto-load (#86/#93); neither is contradicted by anything shown.
  A Mission 18 re-cut is in progress; this file stays the fallback
  until a new cut is committed and verified.
