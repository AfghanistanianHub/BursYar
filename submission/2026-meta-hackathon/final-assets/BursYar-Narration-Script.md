# BursYar — narration script (time-coded, optional)

For `BursYar-Hackathon-Demo-Final.mp4` (2:59.87). The shipped video is
captioned and silent; this script is timed to its 18 segments at a
natural ~150 wpm so the owner — or a future voice track — can narrate
without re-editing. A evaluated TTS sample exists at
`/tmp/m09cuts/narration-sample.aiff` (legacy macOS Daniel voice,
22 kHz); it was judged below professional narration quality and is
NOT part of the submission. Owner-recorded narration remains optional.

| Time | Narration |
|---|---|
| 0:00–0:22 | Across Afghanistan, talented students — especially women and girls facing closed doors — must navigate foreign scholarship systems in a second or third language. Deadlines hide in dense pages. Requirements get lost in translation. BursYar turns a scholarship page into a personal, evidence-based action plan. |
| 0:22–0:29 | This is BursYar, running live. A guided workspace takes you from possibility to a plan — discover, review, assess, act. |
| 0:29–0:39 | Start with discovery. The research library searches and filters historical leads — every record honestly labeled as needing re-verification. |
| 0:39–0:44 | Then, read the official source — never a rumor. |
| 0:44–0:49 | Signed-out visitors meet a clear sign-in gate. Nothing is fetched silently. |
| 0:49–0:57 | With approval, BursYar fetches the official page and shows exactly what it retrieved — before anything is analyzed. |
| 0:57–1:02 | AI interprets. Evidence decides. |
| 1:02–1:22 | Meta Muse Spark 1.3 reads the approved text and selects candidate evidence. Two live runs are on record — four criteria and two funding excerpts validated locally, one and one on hosted infrastructure. But the model is never trusted blindly: every quotation is re-checked against the source, byte for byte. |
| 1:22–1:36 | This illustrative screen shows the analysis interface with a simulated response. Criteria carry exact source quotations, a source digest, and an explicit warning: no human review yet. |
| 1:36–1:40 | Every machine claim stays bound to its quotation. |
| 1:40–1:45 | Met. Not met. Or honestly unknown. |
| 1:45–1:56 | The conservative compiler compares your reviewed profile against the evidence. What it cannot prove, it calls unknown — and unknown is never treated as eligible. |
| 1:56–2:00 | What-if scenarios never touch your real facts. |
| 2:00–2:11 | Documents stay private. You consent, review each extracted claim, reject what is wrong — a rejected degree never enters your profile. |
| 2:11–2:15 | Reviewed by you. Never verified for you. |
| 2:15–2:20 | In your own language. |
| 2:20–2:30 | English, Dari, and Pashto — with full right-to-left support. Translations are machine-drafted and still await human review. |
| 2:30–2:59 | BursYar: evidence-first AI, conservative eligibility, actionable guidance, private by design. Built for the students who need clarity most — so they can understand what a scholarship demands, gather the right proof, and take the next step themselves. From possibility to a plan. |

Muxing a finished 180-second WAV onto the master:

```sh
ffmpeg -i BursYar-Hackathon-Demo-Final.mp4 -i narration.wav \
  -c:v copy -c:a aac -shortest BursYar-Hackathon-Demo-Narrated.mp4
```
