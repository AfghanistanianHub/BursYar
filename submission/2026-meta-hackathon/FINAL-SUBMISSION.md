# BursYar — final submission (paste-ready)

Source of truth for portal fields. Assembled 2026-11-02, re-verified
2026-11-03 at `main` tip `35fa856` (PR #81; video re-recorded from
`dbfb054` and still current — the M16 empty-state section sits below
the fold and appears in no footage). Owner: paste into
https://cerebralvalley.ai/e/meta-ai-developer-hackathon before
**November 4, 9:00 PM ET**. Confirm asset formats inside the portal
first; fill the two OWNER placeholders (video link, team).

- Track: **Indie developer** — judged on creativity, technical
  ambition, whether it works.
- Theme: **Build for Your World**.
- Title: **BursYar — evidence-based scholarship guidance for Afghan students**
- Tagline: Review scholarship evidence and build a practical action
  plan — in English, Dari, and Pashto.

## Description (paste)

BursYar helps Afghan students — particularly women and girls facing
closed doors — turn a scholarship page into a personal action plan.
Provide an official scholarship URL for source retrieval and review,
or paste public source text when retrieval is blocked. With an
authorized analysis, Meta Muse Spark interprets that text and BursYar
checks supporting quotations against the supplied source. This is
evidence matching, not official verification. A consent-based profile
(degrees, scores, language evidence, and private documents kept in an
access-controlled user library) is compared against that evidence by a
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
recorded runs with downstream validation (`d1bb0e0f` local,
`5a58bff8` hosted under the owner-confirmed $50 ceiling); every model
output is re-checked locally (exact quotations, digests, supported
rule syntax, contradictions, provenance) before influencing any
assessment, and model prose is never presented as certification of
authenticity, eligibility, or admission.

## Links (paste)

- Live demo: https://bursyar.vercel.app
- Repository (public): https://github.com/AfghanistanianHub/BursYar
- Demo video: OWNER — upload
  `submission/2026-meta-hackathon/final-assets/BursYar-Hackathon-Demo-Final.mp4`
  (2:59.90, 1920×1080 H.264, captioned, no voiceover; SHA-256
  `731016d5ca3d948eac96b415860b3ae1e853117c05db5953eb4a25c276fac347`;
  provisional three-minute cut — confirm required length/format in the
  portal first) and paste its link here.
- Team: OWNER — add every team member in the portal.
