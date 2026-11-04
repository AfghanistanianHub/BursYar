# BursYar — final submission (paste-ready)

Source of truth for portal fields. Assembled 2026-11-02, locked
2026-11-03 (Mission 19), release pointers refreshed 2026-11-04
(rescue mission) at `342d7db` (PRs #109, #111 merged after green CI;
production bundle `index-CyL0ZQ5P.js` fingerprinted live; zero
`engine/` drift since `340a5e5`; final video is the narrated
Mission 18 re-cut — real product footage, recorded against an
earlier production UI, hash re-verified — see
FINAL-VIDEO-REPORT.md). Owner: paste into
https://cerebralvalley.ai/e/meta-ai-developer-hackathon before
**November 4, 9:00 PM ET** (deadline confirmed on the public event
page 2026-11-04; judging Nov 4–8, finals Nov 9). Confirm asset
formats inside the portal first; fill the two OWNER placeholders
(video link, team).

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
authenticity, eligibility, or admission. The demo film's analysis
UI is explicitly labeled simulated in narration and captions; the two
recorded runs above are the only live-inference evidence — no other
live AI request is shown or claimed.

## Links (paste)

- Live demo: https://bursyar.vercel.app
- Repository (public): https://github.com/AfghanistanianHub/BursYar
- Demo video: OWNER — upload
  `submission/2026-meta-hackathon/final-assets/BursYar-Meta-Hackathon-Demo.mp4`
  (2:59.50, 1920×1080 H.264 + AAC, narrated with burned captions +
  46-cue SRT; SHA-256
  `e954bbb4769ae2afa9b937a5307f7ed9b42e43d637deb1576fc0d38be1328bc1`;
  confirm required length/format/hosting in the portal first —
  fallback cut `BursYar-Hackathon-Demo-Final.mp4` retained in the
  same folder) and paste its link here.
- Team: OWNER — add every team member in the portal.

## Known limitations (paste if the portal has the field)

Production document intake is TXT-only: the PDF/image OCR pipeline
is implemented and covered by synthetic CI tests but stays disabled
for real users until its runtime ships as audited self-hosted assets
behind a sign-in-compatible CSP (Issue #88 open; authenticity is
never auto-promoted). Google sign-in and hosted authenticated
persistence were not agent-exercised (no test credentials used);
signed-out flows and the full authenticated workflow against a local
backend of the exact production tree are verified. Dari/Pashto UI
copy is machine-drafted and awaits fluent human review. Meta
evidence is two recorded runs (`requiresHumanReview=true`,
`coverageComplete=false`) — integration proof, not a reliability or
accuracy claim. Research leads carry needs-reverification labels.
Demo narration is system TTS; owner ear-check of proper-noun
pronunciation is pending but does not affect product claims.
