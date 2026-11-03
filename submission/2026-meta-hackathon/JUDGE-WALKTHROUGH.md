# BursYar — judge walkthrough (5 minutes, live site)

Open https://bursyar.vercel.app. No account needed except where
marked OWNER (approved demo account, interactive Google sign-in).

## First 30 seconds

BursYar turns a scholarship page into an evidence-based action plan
for Afghan students. Every AI claim is bound to an exact source
quotation; eligibility answers MET, NOT MET, or honestly UNKNOWN;
missing evidence becomes next steps — in English, Dari, and Pashto.

## The tour

1. **Hero + workspace** (0:30–1:00). The hero previews the real
   chain (source → requirements → eligibility verdicts, sample-tagged);
   the 4-stage band below links to live sections. Journey steps on the
   left; start cards route to evidence or a new source. Note the honest
   labels: research leads need re-verification; sample listings are not
   active scholarships.
2. **Discovery** (1:00–1:45). Open “Examples and about BursYar” →
   research library. Search “Gates”, filter Canada, save a
   reference. All records are historical leads, never presented as
   open opportunities.
3. **Source** (1:45–2:30). “Review this source” prefills the real
   source form (approval still required). Signed-out visitors meet
   a clear sign-in gate — nothing is fetched silently. OWNER: with
   the demo account, fetch Bristol Think Big and approve the text.
4. **Analysis** (2:30–3:15). Show the video (1:22–1:36) for the
   illustrative UI, or the recorded-run evidence below. Criteria
   carry exact quotes, digest, uncertainties, and the
   not-human-reviewed warning. Live runs on record: `d1bb0e0f`
   (local), `5a58bff8` (hosted) — metadata only, never
   re-triggered for show. A fresh live run needs separate owner
   authorization plus a valid policy window — do not click Analyze
   live during judging.
5. **Eligibility** (3:15–4:00). Open the fictional example (works
   without sign-in): pick a degree, declare IELTS, watch MET / NOT
   MET / UNKNOWN render with evidence. Change the hypothetical
   score — real facts stay untouched. (After a real analysis,
   barrier answers also populate §4 “My next steps”; before that
   the section honestly explains the prerequisite.)
6. **Documents** (4:00–4:30). OWNER: paste the synthetic fixture
   from `docs/CURRENT-DEMO.md`, consent, upload, reject the degree
   claim, approve the rest. Library persists across reload;
   provenance stays “Reviewed — not verified”.
7. **Languages** (4:30–5:00). Switch English → Dari → Pashto: full
   RTL, retained state, quotations untranslated and distinct.
   Translations are UNREVIEWED — stated in the UI notes and docs.

## If anything is offline

The deterministic path (Assessment without AI, fictional example,
local workflow) always works. Unknown is a valid answer everywhere.
