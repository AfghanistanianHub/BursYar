# BursYar — PORTAL-READY FINAL (Mission 21, 2026-11-04)

Authoritative copy-paste package for
https://cerebralvalley.ai/e/meta-ai-developer-hackathon
(deadline November 4, 9:00 PM ET / 6:00 PM Vancouver).
Release: `main` 1a259ab. Character counts verified by script —
see counts beside each capped field (Python `len()`, all characters).

Two fields are OWNER-ONLY (marked). Everything else is pasted verbatim.

## 1. Team name and track

- Team name: OWNER — enter the registered team/entrant name exactly as approved.
- Track: Indie developer
- Theme: Build for Your World
- Title: BursYar — evidence-based scholarship guidance for Afghan students
- Tagline: Review scholarship evidence and build a practical action plan — in English, Dari, and Pashto.

## 2. Problem statement / theme

Afghan scholarship applicants — particularly women and girls facing
closed doors — must navigate foreign scholarship systems in a second
or third language. Theme: Build for Your World.

## 3. Project description (paste) — 1,340 / 3,000 chars

BursYar helps Afghan students — particularly women and girls facing closed doors — turn a scholarship page into a personal action plan. Provide an official scholarship URL for source retrieval and review, or paste public source text when retrieval is blocked. With an authorized analysis, Meta Muse Spark interprets that text and BursYar checks supporting quotations against the supplied source. This is evidence matching, not official verification. A consent-based profile (degrees, scores, language evidence, and private documents kept in an access-controlled user library) is compared against that evidence by a conservative evaluator answering MET, NOT MET, or honestly UNKNOWN — never a guess. Missing evidence becomes practical next steps in the student's own language, with full right-to-left support, so a student can see what a scholarship demands, what proof she still needs, and what to do next. Where a scholarship cannot be assessed, BursYar says what is missing instead of inventing an answer. Document-first onboarding (upload or paste educational text, explicit claim-by-claim review, private library, deletion), blocked-page recovery that never silently substitutes sources, isolated what-if scenarios, and a curated research explorer with honest needs-reverification labels complete the journey from possibility to a plan.

## 4. Links

- Public GitHub repository: https://github.com/AfghanistanianHub/BursYar
- Live demo: https://bursyar.vercel.app
- Demo video URL: OWNER — upload the MP4 below, then paste the real link. Never paste a placeholder.
  Local file: `submission/2026-meta-hackathon/final-assets/BursYar-Meta-Hackathon-Demo.mp4`
  (26,984,833 bytes, 2:59.50, 1920x1080 H.264 + AAC, narrated with
  burned captions + 46-cue `.srt` in the same folder; SHA-256
  `e954bbb4769ae2afa9b937a5307f7ed9b42e43d637deb1576fc0d38be1328bc1`).
  Upload: if the portal accepts uploads, upload there; if it needs a
  URL, post as UNLISTED to the portal-named host (normally YouTube or
  Loom), attach captions, verify the link in a signed-out browser,
  then paste. Fallback cut `BursYar-Hackathon-Demo-Final.mp4` (silent,
  captioned) is retained in the same folder.

## 5. Use of Meta products (paste) — 1,303 / 3,000 chars

Meta Muse Spark 1.3 (Standard access) via the Meta Model API (POST api.meta.ai/v1/chat/completions) performs the one task deterministic code cannot: semantic interpretation of diverse free-text scholarship pages. Per authorized analysis it selects relevant evidence, flags uncertain obligations, and drafts provisional English/Dari/Pashto explanations under a strict JSON schema (bursyar_evidence_v1: at most 4 criteria and 2 funding excerpts, exact quotes). The surrounding pipeline is fully deterministic: trilingual RTL UI, Firebase verified identity, authenticated gateway with revocation/project/demo-claim checks, per-request trusted-policy gate (adult caller, active consent, allowlisted jurisdiction, Standard models only), atomic quota reservations, exact-substring excerpt validation with source SHA-256 digests, a conservative requirements compiler (MET/NOT MET/UNKNOWN), consented profile comparison, barrier guidance and PathFinder next steps. Private documents and profiles stay in owner-scoped storage; the provider sees only pasted public source text. Every failure closes to an offline deterministic path. Integration is proven by two recorded runs with downstream validation (d1bb0e0f local; 5a58bff8 hosted); every model output is re-checked locally before influencing any assessment.

## 6. Why Meta models are essential (paste) — 1,051 / 3,000 chars

Scholarship pages are free text that varies unpredictably across institutions, years, and degree levels: conditions hide in prose, deadlines differ by course, exemptions and implied obligations are never tabulated. No fixed parser can reliably select which sentences constitute evidence, distinguish a firm requirement from guidance, or draft a faithful explanation in a student's own language — that step needs semantic interpretation, which is what Meta Muse Spark provides. BursYar then confines every model claim with deterministic validation (exact quotations, digests, supported rule syntax, contradiction and provenance checks), so the model proposes evidence while code decides what counts. Without the model, BursYar could only match keywords; with it, plus the validation sandwich, students get traceable interpretations they can verify against the official source instead of guesses. The two recorded integration runs demonstrate this division of labor; the demo film labels its illustrative UI as simulated and no other live AI is claimed.

## 7. Partner feedback (paste) — 97 / 150 chars

Not applicable: BursYar calls the Meta Model API directly; no Fireworks, Modal, or Baseten usage.

## 8. Judge-facing evidence chain (reference, not a portal field)

Problem: Afghan applicants face language and information-access
barriers on foreign scholarship pages. Why Meta AI is necessary:
only semantic interpretation can select evidence, flag uncertain
obligations, and draft trilingual explanations across unpredictable
free text. How BursYar validates the output: strict schema, exact
quotes, SHA-256 digests, supported syntax, contradiction and
provenance checks, MET/NOT MET/UNKNOWN verdicts, human review
required. What makes it different: the model proposes, deterministic
code disposes — private documents never enter the inference payload
and every failure closes to an honest offline path. Demonstrated
result: two recorded Muse Spark 1.3 runs with validated criteria
and funding evidence; live product QA green across en/fa/ps.

## 9. Limitations (paste if the portal has the field; abridged)

TXT-only production intake (PDF/image OCR disabled by design, Issue
#88). Hosted sign-in not agent-exercised (no test credentials).
Dari/Pashto copy awaits fluent human review. Meta evidence is two
integration runs, not an accuracy claim. Research leads are
needs-reverification, not verified openings. University applications
are never auto-filed.

## 10. Post-hackathon backlog (not in submission)

Production PDF/image ingestion and OCR; expanded verified catalog;
deadline/availability sync; human translation review; broader
institutional criteria coverage; further accessibility/device testing.
