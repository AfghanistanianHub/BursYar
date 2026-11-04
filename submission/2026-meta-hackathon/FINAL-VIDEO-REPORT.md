# BursYar — final video report (Mission 19, 2026-11-03)

## Selection: the Mission 18 re-cut (unanimous on evidence)

FINAL FILE: `submission/2026-meta-hackathon/final-assets/BursYar-Meta-Hackathon-Demo.mp4`

- 26,984,833 bytes · 179.50 s · 1920×1080 · H.264 High yuv420p 30 fps
  + AAC-LC 48 kHz stereo · faststart · SHA-256
  `e954bbb4769ae2afa9b937a5307f7ed9b42e43d637deb1576fc0d38be1328bc1`
- Narration: system TTS (Reed US-English), full-length, peak −1.5 dB,
  no clipping, −20.2 LUFS integrated. Captions: burned (45 dialogues)
  + sidecar `BursYar-Meta-Hackathon-Demo.srt` (46 cues) — every
  narrated word present (see Caption fix below).
- Produced by the Mission 18 video agent from authentic footage
  (LIVE public production + bannered local-stack rehearsal with
  synthetic fixtures); pipeline + QA + evidence map copied alongside
  as `M18-RECUT-*.md` (originals frozen in the producer's directory).

## Independent verification (this mission, not the producer's word)

- Container/codecs/duration/resolution measured with a full-codec
  ffmpeg; full decode to null clean, exit 0 — re-run on the fixed
  render with identical streams.
- Chrome playback verified (metadata, readyState, advancing time);
  audio decodes full-length with healthy speech dynamics — re-run on
  the fixed render (identical audio metrics).
- 9 frames independently extracted and inspected (0:05/0:30/0:45/
  1:00/1:30/2:00/2:12/2:15/2:30/2:55): acts, transitions, Farsi +
  Pashto RTL, run-metadata chip, end card — plus fixed-caption
  spot frames proving complete sentences in-frame.
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

## Mission 19 caption fix (review-driven, re-rendered)

Codex (P2) and Vercel review correctly found the producer's caption
generator wrapped each narration cue to at most 2 lines and silently
dropped the rest — 12 of 37 cues lost trailing words (e.g. the
hosted-run half of the evidence sentence) in both burned captions
and the SRT. Fixed in `verification/video-production/m18/` (the
committed pipeline): cues that fit keep byte-identical line breaks;
longer cues split into additional timed dialogues proportionally
within their spoken window. Re-rendered from the producer's
byte-identical footage/audio/labels/timings: same 179.50 s streams,
46 SRT cues / 45 burned dialogues, zero dropped words (verified
programmatically: every timeline sentence present verbatim) and
spot-checked in-frame. This report's specs above describe the fixed
render; the producer's `M18-RECUT-QA-REPORT.md` otherwise still
applies (specs, honesty audit, evidence map).

## Residual notes (no action required)

- TTS proper-noun ear-check pending owner (timing/levels verified
  instrumentally; product claims unaffected).
- Integrated loudness −20.2 LUFS is quiet-side; dialogue consistent.
- No editable CapCut project; the reproducible FFmpeg pipeline
  (`M18-RECUT-MANIFEST.md`) is the editable source.
- Do NOT commission a third cut: both committed files are
  submission-grade; only the portal's format rules can force a
  change, and the pipeline can re-cut mechanically.
