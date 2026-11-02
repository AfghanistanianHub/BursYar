# BursYar — hackathon submission package

Prepared 2026-11-02 from verified in-repo evidence at main `9e00755`
(PRs #50–#60 merged). This package files nothing and claims no
organizer compliance: portal, official rules, required assets and the
official deadline are **UNVERIFIED** (owner-supplied deadline on
record: before November 4, 2026). Anything not confirmed against an
authoritative source is labeled as such. No user numbers, deployment
status, or institutional partnerships are claimed.

## 1. Project description

BursYar helps Afghan students — particularly women and girls facing
closed doors — turn a scholarship page into a personal action plan.
Paste an official requirements page: BursYar retrieves it, interprets
the requirements with Meta Muse, and binds every machine claim to an
exact quotation from the source. A consent-based profile (degrees,
scores, language evidence, private documents that never leave the
student's control) is compared against that evidence by a conservative
evaluator that answers MET, NOT MET, or honestly UNKNOWN — never a
guess. Missing evidence becomes practical next steps in the student's
own language: English, Dari, or Pashto, with full right-to-left
support. Where a scholarship cannot be assessed, BursYar says what is
missing and what to do about it, instead of inventing an answer.

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
eligibility, or admission.

## 6. Limitations and pending requirements

- All fa/ps strings are UNREVIEWED; no fluent human review recorded.
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
- Hosted serving SHAs unverified here; production deploy verification
  is handled by separate owner-directed release work.
- Submission logistics (portal, rules, assets, official deadline)
  unverified; no submission filed by this work.

## 7. Release checklist — genuinely outstanding only

- [ ] Fluent Dari/Pashto + semantic review recorded; public metadata
      in TRANSLATION-REVIEW.json (now `PENDING_HUMAN_REVIEW`).
- [ ] Source ledger bound to dated captures (now all
      `needs_reverification`).
- [ ] Live policy-window re-issue + fresh explicit inference approval
      if any further live run is wanted (none is required for the
      recorded milestones).
- [ ] Serving SHAs confirmed against the deploy verification.
- [ ] Submission logistics confirmed with the owner (portal, rules,
      assets, deadline); video recorded per VIDEO-SCRIPT.md rules.
- [ ] Owner merges this PR, reruns CI on the integration head, and
      files the submission through the official portal.
