# BursYar — video quality report

File: `BursYar-Hackathon-Demo-Final.mp4` (copied byte-identical from
the Mission 09 verified render; SHA-256 in
`BursYar-Video-Manifest.json`).

## Verification performed

- Probe: 2:59.87, 1920×1080, H.264 High yuv420p, 30 fps, 8.4 MB.
- Full decode: clean, zero errors.
- Frames inspected at 0:05, 0:25, 0:47, 1:10, 1:30, 1:34, 1:52,
  2:05, 2:25, 2:45: cards legible, captions readable, LIVE vs
  REHEARSAL tags present on every app segment, rehearsal banner
  visible in rehearsal footage, fades clean at both ends.
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
