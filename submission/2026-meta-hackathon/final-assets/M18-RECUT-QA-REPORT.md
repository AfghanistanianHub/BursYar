# M18 technical QA report — BursYar-Meta-Hackathon-Demo.mp4

File: BursYar-Meta-Hackathon-Demo.mp4 (179.5s, 1920x1080, H.264 High
yuv420p, 30 fps, AAC 48 kHz stereo, faststart). Sidecar:
BursYar-Meta-Hackathon-Demo.srt (37 cues, last ends 178.381s).

## Spec verification (measured, imageio-ffmpeg 9.0.2 probe)
- Duration 179.50s (<= 180 required). Resolution 1920x1080, SAR/DAR 16:9.
- Video: h264 High, yuv420p, 30 fps. Audio: AAC-LC, 48000 Hz, stereo.
- Full decode to null: clean, zero errors, exit 0.
- Audio: peak -1.5 dB (no clipping), RMS -20.7 dB, integrated -20.2 LUFS,
  LRA 4.6 LU, crest 9.1 (healthy speech dynamics, consistent levels).
- Narration pacing: 358 words / ~161s speech ~= 133 wpm, calm documentary
  pace; per-sentence synthesis gives exact caption sync (no aligner drift).

## Frame inspection (19 frames across all acts, cuts, end card)
- Acts: t=5 (A1 search+LIVE+caption), 25 (A2), 45 (A3 Bristol gate, caption
  in sync), 75/90 (A4 criteria+run chip+REHEARSAL), 110 (A5 verdicts),
  135 (A6 Farsi RTL readable), 160 (A7 hero), 177 (end card).
- Cuts: 0.3/10.5/11.4/11.7/20.2/40.2/48.5/58.5/69.8/70.2/100.2/130.2/
  154.8/155.2/155.2 — all land on painted content; fades clean at both ends.
- Labels verified in-frame: LIVE, REHEARSAL, Synthetic-fixture, run
  metadata (both request-ID prefixes + counts match submission evidence),
  end card. Burned captions readable (Arial 52, boxed); final line shown by
  end card only (kept in SRT).
- No human imagery; no clipped UI text beyond standard caption overlap;
  Farsi/Pashto rendered by real Chromium (correct shaping/RTL).

## Defects found and fixed
1. End-card/caption duplication + muddy text over busy UI -> dim band
   behind end card; final cue removed from burned captions (kept in SRT).
2. Blank white heads at clip-start cuts (page load in recordings) ->
   measured first-content frame per clip (signalstats luminance floor) and
   re-trimmed all heads; freeze pads preserve the 179.5s runtime.
3. assemble_edit.py: -vf/subtitles complex-graph conflict, fontsdir colon
   escaping, Arial location (/System/Library/Fonts/Supplemental) — fixed.

## Playback review
Full-file decode review passed; 19 extracted frames reviewed across every
act and boundary. No dropped/corrupt frames. No player available for a
real-time watch; frame-level review is the inspection record.

## Residual limitations (unresolved, for owner review)
- TTS narration (Reed US-English, macOS system voice): timing/levels
  verified instrumentally, but pronunciation ear-check by a human is still
  pending — especially brand/proper nouns (BursYar, Dari, Pashto).
- No editable CapCut project: CapCut is the owner's running process
  (protected state) and GUI automation is unreliable; the reproducible
  FFmpeg pipeline (edit/assemble_edit.py + capture scripts) is the editable
  source per the mission's authorized fallback. Owner may import the MP4
  into CapCut for finishing.
- OBS Studio evaluated but unused: OBS WebSocket is disabled (enabling needs
  owner action in OBS settings) and scripted Playwright capture proved more
  deterministic; no screen-recording permission was required.
- Preview-SSO note: PR preview deployments sit behind Vercel SSO; all live
  footage is from public production (bursyar.vercel.app), verified 200.
- Integrated loudness -20.2 LUFS is on the quiet side of streaming norms;
  dialogue is consistent and unclipped — boosting left to owner taste.
