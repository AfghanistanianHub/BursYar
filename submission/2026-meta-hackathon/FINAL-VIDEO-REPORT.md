# BursYar — final video report (Mission 19, 2026-11-03)

## Selection: the Mission 18 re-cut (unanimous on evidence)

FINAL FILE: `submission/2026-meta-hackathon/final-assets/BursYar-Meta-Hackathon-Demo.mp4`

- 26,998,566 bytes · 179.50 s · 1920×1080 · H.264 High yuv420p 30 fps
  + AAC-LC 48 kHz stereo · faststart · SHA-256
  `84e204016e5e0087df322204258399a02696629c79a7ebf7b75534f356143147`
- Narration: system TTS (Reed US-English), full-length, peak −1.5 dB,
  no clipping, −20.2 LUFS integrated. Captions: burned (36 cues) +
  sidecar `BursYar-Meta-Hackathon-Demo.srt` (37 cues).
- Produced by the Mission 18 video agent from authentic footage
  (LIVE public production + bannered local-stack rehearsal with
  synthetic fixtures); pipeline + QA + evidence map copied alongside
  as `M18-RECUT-*.md` (originals frozen in the producer's directory).

## Independent verification (this mission, not the producer's word)

- Container/codecs/duration/resolution measured with a full-codec
  ffmpeg; full decode to null clean, exit 0.
- Chrome playback verified (metadata, readyState, advancing time);
  audio decodes full-length with healthy speech dynamics.
- 9 frames independently extracted and inspected (0:05/0:30/0:45/
  1:00/1:30/2:00/2:12/2:15/2:30/2:55): acts, transitions, Farsi +
  Pashto RTL, run-metadata chip, end card.
- Claims audited against production `340a5e5` and submission
  evidence: two Muse Spark runs match recorded metadata exactly
  (`d1bb0e0f` local 4+2, `5a58bff8` hosted 1+1); simulated analysis
  UI disclosed in narration and captions; LIVE vs REHEARSAL vs
  Synthetic-fixture banners correct in every inspected frame; no
  PDF-in-production claim; no issuer-verification claim; no fake
  live AI; no human faces, stock, or personal data; Afghan
  students incl. women/girls centered in narration and captions.

## Why it beats the fallback

The fallback (`BursYar-Hackathon-Demo-Final.mp4`, 179.9 s, silent,
footage from `dbfb054`) remains verified and claim-accurate and is
RETAINED in the same folder. The re-cut is selected because it is
demonstrably better on every acceptance axis: narrated (fallback is
silent), recorded against current production (fallback predates the
TXT-only notice and library auto-load), fuller act coverage with
exact run metadata in-frame, and a sidecar SRT — with zero new
claims and zero banned content.

## Residual notes (no action required)

- TTS proper-noun ear-check pending owner (timing/levels verified
  instrumentally; product claims unaffected).
- Integrated loudness −20.2 LUFS is quiet-side; dialogue consistent.
- No editable CapCut project; the reproducible FFmpeg pipeline
  (`M18-RECUT-MANIFEST.md`) is the editable source.
- Do NOT commission a third cut: both committed files are
  submission-grade; only the portal's format rules can force a
  change, and the pipeline can re-cut mechanically.
