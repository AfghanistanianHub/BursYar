# BursYar — hackathon submission package

Prepared 2026-11-02, serving state re-verified 2026-11-04 at main
`cb9eff1` (rescue mission: PR #109 provenance/eligibility explainer,
PR #110 storyboard hero, PR #111 production TXT-only document
labels, and docs #112 merged after green CI; Issues #91 fixed, #88
TXT-gate intact, zero `engine/` drift since `340a5e5`). This package
files nothing by itself; the owner
files through the official portal (§7). Event identity, deadline,
tracks, and judging criteria below are verified against authoritative
sources; submission asset formats remain gated behind participant
login. No user numbers or institutional partnerships are claimed.
Production serving state is verified in §7.

## 1. Project description

BursYar helps Afghan students — particularly women and girls facing
closed doors — turn a scholarship page into a personal action plan.
Provide an official scholarship URL for source retrieval and review,
or paste public source text when retrieval is blocked. With an
authorized analysis, Meta Muse interprets that text and BursYar checks
supporting quotations against the supplied source — evidence matching,
not official verification. A consent-based profile (degrees,
scores, language evidence, private documents kept in an
access-controlled user library) is compared against that evidence by a
conservative
evaluator that answers MET, NOT MET, or honestly UNKNOWN — never a
guess. Missing evidence becomes practical next steps in the student's
own language: English, Dari, or Pashto, with full right-to-left
support. Where a scholarship cannot be assessed, BursYar says what is
missing and what to do about it, instead of inventing an answer.

Who it serves: Afghan applicants navigating foreign scholarship
systems in a second or third language — especially women and girls
whose educational paths face the steepest barriers. Every assessment,
explanation, barrier question, and next step is available in Dari and
Pashto as well as English (machine-drafted, human review pending),
so a student can understand what a scholarship demands, what evidence
she still needs, and what to do next without relying on an
English-only intermediary.

Distinguishing features (see DIFFERENTIATORS.md): evidence-first
exact-excerpt validation with source digests; a conservative 3-valued
compiler that fails closed to UNKNOWN; fail-closed trusted-policy
gates with no provider fallback; URL-first retrieval with honest
blocked-page recovery; a privacy-minimal provider boundary (public
source text only); and trilingual evidence planning with quotations
kept untranslated and visibly distinct.

## 2. Verified feature inventory

Status key: **Operational** = works against real inputs within stated
limits. **Demo** = works with fixtures or curated data only.

| Feature | Status | Evidence |
|---|---|---|
| Trilingual UI (en/fa/ps) with RTL, local fonts, Persian numerals | Operational UI; all fa/ps strings **UNREVIEWED** | i18n parity tests; 15-case browser matrix incl. axe; desktop/mobile screenshots |
| Workspace overview + journey navigation | Operational | research-browser link assertions; render review at 320–1440px |
| Scholarship source fetch, preview, explicit approval | Operational for reachable official pages | source/fetch/provenance tests; recovery flows in browser suite |
| Blocked-page recovery (URL retained, paste/import labeled) | Operational | browser recovery cases; URL-FIRST-RECOVERY.md |
| Meta interpretation with exact-excerpt/digest validation | Integration verified on 2 recorded runs; not continuously verified | checkpoint 15 (`d1bb0e0f`); HOSTED-META.md (`5a58bff8`) |
| Conservative 3-valued eligibility compiler | Operational, deterministic | 60 offline evaluation checks; eligibility tests |
| Consented profile + academic score declarations | Operational (private storage) | profile/score tests; browser save/reload cases |
| Document-first onboarding (TXT upload or paste, explicit review, library, deletion) | Operational within TXT-only 12 KB limit | document-review browser suite en/fa/ps; unit tests |
| Barrier guidance + isolated hypothetical scenarios | Operational, deterministic | pathfinder/scenario tests; browser cases |
| PathFinder next-step guidance | Operational UI, deterministic content | pathfinder tests; render review |
| Research explorer (12 curated records, filters, save/export/prepare) | Demo metadata, all `needs_reverification`; prepare only prefills the source URL, approval still required | research-browser suite, zero POST; SOURCE-TRACEABILITY.md |
| Sample opportunity listings | Synthetic demo rows, labeled unverified; must never be presented as real opportunities | labeled in UI (`unverified` pill, `sourceMissing`) |
| Deterministic offline fallback (no-AI assessment path) | Operational | browser fallback cases; readiness tests |

## 3. Technical architecture

```
Browser (vanilla JS, Vite) — en/fa/ps + RTL
  → Firebase ID token (approved demo accounts)
  → Loopback/hosted gateway: revocation, project, demo-claim checks
  → Policy gate (adult caller/subject, consent, jurisdiction, Standard-only)
  → Atomic quota reservation (SQLite local / Supabase remote)
  → Meta chat-completions adapter (text-only, strict JSON schema,
     timeout + size caps, no retry, no fallback model)
  → Exact-substring excerpt validation + source SHA-256 digest
  → Conservative requirements compiler (MET / NOT MET / UNKNOWN)
  → Consented profile comparison → barrier guidance → PathFinder
  → Isolated counterfactual scenarios (real facts immutable)
```

Private documents and profile data live in owner-scoped storage
(local SQLite; durable private Postgres on hosted) behind the
authenticated gateway. The provider boundary is minimal: Meta
receives only pasted public source text — never the URL, identity,
profile, documents, or quota state. Any policy, quota, network, or
validation failure fails closed to the deterministic offline path.

Security approach (see SECURITY-PRIVACY-REVIEW.md): verified Firebase
identity with demo-claim checks before any analysis or storage;
per-request trusted-policy records (adult caller, active consent,
allowlisted jurisdiction, Standard models only); atomic quota
reservations with spending confirmation gates; bounded, timeout-guarded
transports with no retries on inference; explicit user approval before
every analysis and document mutation; consent-scoped private storage
with export and deletion; exact-evidence validation so model prose
can never fabricate a quotation, a digest, or an eligibility verdict.

## 4. Demonstration walkthrough (deterministic, no live calls)

Run `./start-bursyar.command`, open http://localhost:5173. The mocked
rehearsal banner marks fixture mode; label every screen shown.

1. Workspace overview → start cards route to profile/documents or a
   new scholarship source; journey steps track progress.
2. Paste an official scholarship URL → fetch → review extracted text
   → approve the source (progression steps stay visible throughout).
3. If the page refuses (as central Oxford Clarendon does), the URL is
   retained and paste/import is offered with supplied-vs-fetched
   labels — no silent substitution.
4. Request analysis (mocked provider in rehearsal) → criteria with
   exact quotations, deadline, funding excerpts, uncertainties, source
   digest, and the not-human-reviewed warning.
5. Answer barrier questions (transcripts, language test, travel
   document) → per-requirement MET/NOT MET/UNKNOWN with evidence and
   honest counts; explore one hypothetical change in isolation.
6. Save a consented profile and academic scores; upload or paste a
   synthetic education text → review each pending claim → publish,
   correct, or delete; show unverified provenance is preserved.
7. Explore research records (filter, save, export, prepare-to-source);
   switch English → Dari → Pashto showing RTL and retained state.
8. For the one recorded live result, show only the retained Oxford
   output or its diagnostic record; never click Analyze live on
   camera. Recording rules: VIDEO-SCRIPT.md.

## 5. Meta Muse's actual contribution

Model `muse-spark-1.3` (Standard access) via
`POST api.meta.ai/v1/chat/completions`: text-only input, low
reasoning effort, strict `json_schema bursyar_evidence_v1`
(≤4 criteria, ≤2 funding excerpts, exact quotes, en/fa/ps
explanations). Its job is semantic interpretation of diverse
scholarship prose — selecting relevant evidence, flagging uncertain
obligations, drafting provisional trilingual explanations — which
deterministic code cannot do across free text. Two runs are recorded
with downstream validation (`d1bb0e0f` local, `5a58bff8` hosted under
the owner-confirmed $50 ceiling); billed dollars are unknown and no
reliability distribution is claimed. Everything the model returns is
re-checked locally (exact quotations, digests, supported rule syntax,
contradictions, provenance) before it can influence any assessment,
and model prose is never presented as certification of authenticity,
eligibility, or admission. The two recorded runs are sufficient
evidence of integration: all of `engine/` except `documents.js`
is byte-identical from the verified backend commit `4e272a7`
through release tip `cb9eff1` (`git diff 340a5e5 cb9eff1 -- engine/`
is empty), so nothing in the inference path
changed after the hosted proof; no further inference run is needed
for the submission. Only `engine/documents.js` evolved since
(`+40/−2`: additive manual transcription provenance plus stricter
idempotency 409s from PR #86) — document handling, which sits
outside the `/api/analyze` inference chain. The Render backend's exact
deployed SHA is not agent-visible (no version endpoint); owner may
confirm it on the Render dashboard, but no inference-path drift is
possible from the document-only delta.

## 6. Limitations and pending requirements

- All fa/ps strings are UNREVIEWED (exact scope in §7); no fluent
  human review recorded.
- Compact AI selections (≤4 criteria, ≤2 funding excerpts) never imply
  complete policy coverage; `coverageComplete=false` stands.
- Compiler coverage is deliberately narrow (explicit degree/IELTS
  sentences); all other conditions stay UNKNOWN by design.
- Research records and sample listings are not verified opportunities;
  every ledger record is `needs_reverification`.
- TXT-only educational ingestion (12 KB); no PDF/OCR, no issuer
  integration, no award/admission prediction.
- Live inference needs fresh owner authorization plus policy-window
  re-issue; prior approvals are superseded.
- Hosted serving state is verified (§7); deeper prod-e2e evidence
  lives in
  [18-production-release-verification.md](checkpoints/18-production-release-verification.md).
- Submission asset formats stay gated behind participant login (§7);
  no submission filed by this work.

## 7. Official requirements, serving state, and review scope

Verified 2026-11-02 against authoritative public sources:

- Event: Meta Global AI Developer Hackathon, virtual and worldwide,
  $1M prize pool. Portal: https://cerebralvalley.ai/e/meta-ai-developer-hackathon.
- Deadline: project submissions due **November 4, 9:00 PM ET**
  (judging Nov 4–8, finals Nov 9). Sources: the Key Dates sections
  of https://dev.meta.ai/events/global-hackathon and the Cerebral
  Valley event page (identical dates; both note dates may change at
  Meta's discretion — recheck the page before filing).
- Tracks: Indie developer (individuals/students; judged on
  creativity, technical ambition, whether it works) and Startup
  (teams/founders; technical execution, holds up in production).
  BursYar enters Indie. Themes: Build for Your World (BursYar's
  theme) and Push the Frontier.
- Participation is selection-capped (20,000); application review is
  separate from project judging.
- NOT publicly published (participant-login-gated): submission asset
  formats (video length/format, repo/demo-link requirements) and the
  Official Rules text. One fellow participant's public build log
  reports a three-minute demo video, public repo, event-period-only
  work, and judging weights (impact 30 / Meta tooling 25 / demo 25 /
  depth 20) — useful leads, explicitly **UNVERIFIED**. BursYar is
  structurally ready for all of them: repo is PUBLIC, meaningful
  history starts 2026-10-26, Meta models are used via the Meta Model
  API, and VIDEO-SCRIPT.md carries both the four-minute plan and a
  provisional three-minute cut. The owner must confirm formats inside
  the portal before recording.

Serving state (verified by direct inspection 2026-11-02,
re-verified Mission 18 on 2026-11-03, re-verified rescue mission
on 2026-11-04):

- Frontend https://bursyar.vercel.app serves the release tip
  `cb9eff1`: production bundles `index-zQcavhRk.js` /
  `index-B5HKycc2.css` contain the #110 markers (`story-board`,
  `story-index`, `heroCaption` — from `22724b1`), the #111 markers
  (`noteProduction`, `fileProduction` — unique to `342d7db`), the
  #109 `trust-explainer` marker, the post-#92 `enableScripting` flag,
  pinned vendor markers, the TXT-only notice, and all earlier
  markers (#69/#71 `skip-link`, `hero-actions`, `empty-note`,
  `summary::marker`; #72 `glyph-doc`, `glyph-search`,
  `eligibility-example`; M14 `hero-visual`, `how-it-works`,
  `chain-verdicts`; M16 `nextEmpty`, `nextEmptyCta`). SHA proven by
  Vercel success status on the merge commit plus marker fingerprint.
  Post-merge smoke: 21/21 live production journeys (1 auth step
  untested), 105/105 responsive probe, 38/38 anchors, TXT-only
  document labels confirmed live in en/fa/ps.
- Backend is current and compatible: `engine/` unchanged except
  `documents.js` (+40/−2 document handling) from `4e272a7` through
  `cb9eff1` (zero drift since `340a5e5`); `/health` returns 200
  `ok:true` with local assessment,
  source retrieval, document storage, and configured Meta
  available. Render deployed SHA is owner-visible only.

Fluent-review scope (recounted from source 2026-11-04; all
UNREVIEWED, review NOT complete): 387 Dari + 387 Pashto
Arabic-script strings in the exported copy tables alone (method:
leaf-string count over the copy modules covered by
tests/frontend-i18n.test.js plus catalog/glossary/research-data),
including the 2 new production TXT-only document strings per
language from PR #111 and 7 storyboard strings per language from
PR #110 — plus inline main-shell, workspace-overview,
glossary, catalog-label, and research-name strings (the older
401+401 figure predates PRs #86/#103/#109/#110/#111 additions).
Record rule: TRANSLATION-REVIEW.json (still `PENDING_HUMAN_REVIEW`).

## 8. Release checklist — genuinely outstanding only

- [ ] Fluent Dari/Pashto + semantic review recorded over the §7
      scope; public metadata in TRANSLATION-REVIEW.json.
- [ ] Source ledger bound to dated captures (now all
      `needs_reverification`).
- [ ] Submission asset formats confirmed inside the participant
      portal; canonical video is
      `submission/2026-meta-hackathon/final-assets/BursYar-Meta-Hackathon-Demo.mp4`
      (2:59.50, narrated, burned captions + 46-cue SRT,
      SHA-256 `e954bbb4…28bc1`, hash re-verified 2026-11-04; shows
      real product footage with LIVE/REHEARSAL/synthetic banners,
      recorded against an earlier production UI) — re-cut only if
      the portal mandates another length.
- [ ] Owner files the submission through the official portal before
      November 4, 9:00 PM ET (deadline reconfirmed on the public
      event page 2026-11-04; judging Nov 4–8, finals Nov 9). Code is
      merged through PR #112 (main `cb9eff1`, serving live); no
      engineering PR is pending.
