# BursYar — submission form handoff (paste-ready)

Source of truth for portal fields. All text below is assembled from
verified in-repo evidence (see HACKATHON-SUBMISSION.md). Owner: paste
into https://cerebralvalley.ai/e/meta-ai-developer-hackathon before
November 4, 9:00 PM ET, confirm asset formats inside the portal
first, and fill the two OWNER placeholders (video link, team).

## Track and theme

- Track: **Indie developer** (individual builder; judged on
  creativity, technical ambition, whether it works).
- Theme: **Build for Your World**.

## Title

BursYar — evidence-based scholarship guidance for Afghan students

## Tagline

Paste a scholarship page, get verified requirements and a personal
action plan — in English, Dari, and Pashto.

## Description (paste)

BursYar helps Afghan students — particularly women and girls facing
closed doors — turn a scholarship page into a personal action plan.
Paste an official requirements page: BursYar retrieves it, interprets
the requirements with Meta Muse Spark, and binds every machine claim
to an exact quotation from the source text. A consent-based profile
(degrees, scores, language evidence, and private documents that never
leave the student's control) is compared against that evidence by a
conservative evaluator answering MET, NOT MET, or honestly UNKNOWN —
never a guess. Missing evidence becomes practical next steps in the
student's own language, with full right-to-left support, so a student
can see what a scholarship demands, what proof she still needs, and
what to do next. Where a scholarship cannot be assessed, BursYar says
what is missing instead of inventing an answer. Document-first
onboarding (upload or paste educational text, explicit claim-by-claim
review, private library, deletion), blocked-page recovery that never
silently substitutes sources, isolated what-if scenarios, and a
curated research explorer with honest needs-reverification labels
complete the journey from possibility to a plan.

## Technical summary (paste)

Vanilla-JS frontend (Vite) with English/Dari/Pashto UI and RTL →
Firebase verified identity (approved demo accounts) → authenticated
gateway (revocation, project, and demo-claim checks) → per-request
trusted-policy gate (adult caller, active consent, allowlisted
jurisdiction, Standard models only) → atomic quota reservations
(SQLite locally, Supabase remotely) → Meta chat-completions adapter
(text-only, strict JSON schema, timeout and size caps, no retries, no
model fallback) → exact-substring excerpt validation plus source
SHA-256 digests → conservative requirements compiler (MET / NOT MET
/ UNKNOWN) → consented profile comparison, barrier guidance, and
PathFinder next steps, with counterfactual scenarios kept isolated
from real facts. Private documents and profiles live in owner-scoped
storage behind the gateway with export and deletion. The provider
sees only pasted public source text — never the URL, identity,
profile, documents, or quota state. Every failure mode fails closed
to a deterministic offline assessment path.

## How Meta Muse is used (paste)

Meta Muse Spark 1.3 (Standard access) performs the one task
deterministic code cannot: semantic interpretation of diverse,
free-text scholarship pages. Per analysis it selects relevant
evidence, flags uncertain obligations, and drafts provisional
English/Dari/Pashto explanations under a strict schema (≤4 criteria,
≤2 funding excerpts, exact quotes). Integration is proven by two
recorded runs with downstream validation; every model output is
re-checked locally (exact quotations, digests, supported rule syntax,
contradictions, provenance) before influencing any assessment, and
model prose is never presented as certification of authenticity,
eligibility, or admission.

## Links (paste)

- Live demo: https://bursyar.vercel.app
- Repository (public): https://github.com/AfghanistanianHub/BursYar
- Demo video: OWNER — upload the recorded video and paste its link
  here (confirm required length/format in the portal first; scripts:
  docs/VIDEO-SCRIPT.md four-minute plan + provisional three-minute
  cut; public-flow footage:
  verification/artifacts/demo-public-flows.webm, re-recordable via
  `node verification/record-public-demo.mjs`).
- Team: OWNER — add every team member in the portal.

## Minimum video scenes (all verified functionality)

Scenes 1–2 and 7 are covered by the public-flow footage; scenes 3–6
need the owner's approved demo account (bursyarDemo claim) plus
interactive sign-in — see CURRENT-DEMO.md. No new live inference is
needed for any scene.

1. Workspace overview + journey steps (establish the app).
2. Discovery: research search, country/funding filters, empty state,
   save/export, prepare-to-source (approval still required).
3. Source fetch → preview → explicit approval; blocked-page recovery
   with retained URL (progression steps visible).
4. Analysis result: criteria with exact quotes, deadline, funding,
   uncertainties, digest, not-human-reviewed warning (use the
   retained Oxford result or labeled mock; never start a new live
   request for the camera without fresh explicit approval).
5. Profile + documents: consent → paste synthetic fixture → review
   each claim → approve → library reload proving persistence.
6. Eligibility: barrier answers → MET/NOT MET/UNKNOWN pills +
   PathFinder actions → one isolated hypothetical change.
7. Trilingual close: Dari then Pashto switch with RTL and retained
   state; pending-review and coverage-honesty closing line.

## Pre-filing checklist

- [ ] Asset formats confirmed inside the participant portal.
- [ ] Video recorded, uploaded, link pasted above.
- [ ] All team members added in the portal.
- [ ] Official dates page rechecked (dates may change at Meta's
      discretion); filed before November 4, 9:00 PM ET.
