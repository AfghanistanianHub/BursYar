# BursYar — FINAL SUBMIT NOW (owner action sheet, Mission 19)

Everything an agent can do is DONE. What remains needs the owner's
portal login and human judgment. Estimated owner time: 30–45 minutes.

## 0. Setup (2 min)

- Workstation with the repo at `main` ≥ `12ea353` and these files:
  `submission/2026-meta-hackathon/FINAL-SUBMISSION.md` (paste text),
  `final-assets/BursYar-Meta-Hackathon-Demo.mp4` (video),
  `final-assets/BursYar-Meta-Hackathon-Demo.srt` (captions).
- Optional: headphones for the 20-second TTS ear-check (step 2).

## 1. Portal recon (10 min, login-gated — AGENTS CANNOT DO THIS)

1. Log in at https://cerebralvalley.ai/e/meta-ai-developer-hackathon.
2. Confirm: video rules (max length? formats? direct upload vs URL?),
   team-member fields, required declarations, track selection.
3. Deadline on the public page: **Nov 4, 9:00 PM ET** — re-confirm
   inside the portal; file EARLY, not at 8:59 PM.

## 2. Video ear-check (5 min, optional but recommended)

- Play `BursYar-Meta-Hackathon-Demo.mp4` once; listen to brand nouns
  (BursYar, Dari, Pashto). If a pronunciation is embarrassing, EITHER
  file the verified silent fallback
  (`BursYar-Hackathon-Demo-Final.mp4`, same folder) OR reply to the
  agent chat for a same-day re-render — do NOT hand-edit and re-cut
  yourself under time pressure.

## 3. Video delivery (10 min)

- If the portal ACCEPTS UPLOADS: upload
  `BursYar-Meta-Hackathon-Demo.mp4` (27 MB, 2:59.50, 1080p — inside
  every common limit). Attach the `.srt` if the portal takes
  captions; otherwise the burned captions already qualify.
- If the portal REQUIRES A URL: upload the MP4 as an UNLISTED video
  to the platform the portal names (normally YouTube or Loom),
  enable captions with the `.srt`, copy the link, and STOP — do not
  publish it publicly unless the rules ask for public videos.
- Paste the resulting link into the video field. Never paste a
  guessed or placeholder URL.

## 4. Paste + file (10 min)

1. Paste every field from `FINAL-SUBMISSION.md` (title, tagline,
   description, technical summary, Meta usage, links incl. the video
   URL from step 3, limitations if the portal has the field).
2. Add every team member. Read each declaration before accepting.
3. Submit. Screenshot the portal's confirmation screen.

## 5. After filing (2 min)

- Reply to the agent chat with: portal confirmation (screenshot or
  confirmation ID) + the filed video URL. The project is NOT
  "submitted" until that confirmation exists.
- Do NOT merge, deploy, or change anything until results are out
  (production is frozen; see FINAL-OWNER-CHECKLIST.md).

## If something goes wrong

- Portal rejects the video: check length/format (ours: 2:59.50,
  MP4 H.264+AAC 1080p). If a different format is mandated, reply to
  the agent chat immediately — the reproducible pipeline
  (`M18-RECUT-MANIFEST.md`) can re-cut mechanically; do NOT start a
  redesign.
- Site looks down: check https://bursyar.vercel.app/health first
  (cold starts can take ~60 s on the free backend, then 200).
- Format-forced re-cut: the full pipeline is committed at
  `verification/video-production/m18/` (README: one re-render
  command); the agent chat can run it — same-day turnaround.
- Deadline panic: the fallback video + this sheet are sufficient to
  file in 15 minutes. File SOMETHING true before 9:00 PM ET.
