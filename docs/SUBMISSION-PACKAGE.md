# Hackathon submission package (assembly index)

This file assembles the submission narrative from verified in-repo evidence.
It files nothing and claims no organizer compliance. Anything not confirmed
against an authoritative source is labeled **UNVERIFIED**.

Consolidated release snapshot: [HACKATHON-SUBMISSION.md](HACKATHON-SUBMISSION.md)
(project description, verified inventory, architecture, walkthrough,
Meta contribution, limitations, outstanding-actions checklist).

## Description

BursYar connects scholarship evidence to a consent-based student profile and
conservative planning in English, Dari and Pashto. See
[FINAL-REVIEW-PACKET.md](FINAL-REVIEW-PACKET.md) (factual summary) and
[HACKATHON-READINESS-2026-10-28.md](HACKATHON-READINESS-2026-10-28.md)
(submission description draft).

## Problem and beneficiaries

- Core problem: [PRODUCT-REQUIREMENTS.md](PRODUCT-REQUIREMENTS.md)
  ("Core problem"); mission: [hackathon-mvp-brief.md](hackathon-mvp-brief.md).
- Primary audience: Afghan applicants including women and displaced students
  ([PRODUCT-REQUIREMENTS.md](PRODUCT-REQUIREMENTS.md)).

## Demo workflow

- Five-minute script: [HACKATHON-DEMO.md](HACKATHON-DEMO.md).
- Four-minute plan: [FINAL-REVIEW-PACKET.md](FINAL-REVIEW-PACKET.md);
  rehearsal: [HACKATHON-READINESS-2026-10-28.md](HACKATHON-READINESS-2026-10-28.md).
- Standalone video script: [VIDEO-SCRIPT.md](VIDEO-SCRIPT.md).
- Server path: [INFERENCE-RUNBOOK.md](INFERENCE-RUNBOOK.md).

## Meta's technical role

`muse-spark-1.3` (Standard) interprets public scholarship text via
`POST api.meta.ai/v1/chat/completions`: text-only, low reasoning, strict
`json_schema bursyar_evidence_v1`. No Contributor models, no fallback adapter.
Details: [HACKATHON-DEMO.md](HACKATHON-DEMO.md) ("Meta's technical role"),
[HACKATHON-READINESS.md s9](HACKATHON-READINESS-2026-10-28.md),
[HOSTED-META.md](HOSTED-META.md) (hosted req `5a58bff8`, 2026-11-01).

## Architecture

[HACKATHON-DEMO.md](HACKATHON-DEMO.md) (architecture),
[FINAL-REVIEW-PACKET.md](FINAL-REVIEW-PACKET.md) (submission claims),
[EVIDENCE-FIRST-DEMO-ARCHITECTURE.md](EVIDENCE-FIRST-DEMO-ARCHITECTURE.md),
[INFERENCE-RUNBOOK.md](INFERENCE-RUNBOOK.md),
[HOSTED-BACKEND.md](HOSTED-BACKEND.md), [HOSTED-META.md](HOSTED-META.md).

Pipeline: URL fetch or supplied HTML/TXT → authenticated bounded source
preview/provenance → explicit approval → Meta adapter with quota/spending
guards → exact-source evidence validation → conservative compiler → consented
profile comparison → missing evidence/practical steps → separate hypothetical
scenario.

## Languages

English/Dari/Pashto UI with RTL. All fa/ps strings
**UNREVIEWED** ([GLOSSARY.md](GLOSSARY.md),
[TRANSLATION-REVIEW.json](TRANSLATION-REVIEW.json): `PENDING_HUMAN_REVIEW`).

## Privacy and limits

Provider sees only pasted public text; URL/UID/profile/documents never sent.
Full record: [SECURITY-PRIVACY-REVIEW.md](SECURITY-PRIVACY-REVIEW.md).
Family/minor safety: [FAMILY-META-SAFETY-ROADMAP.md](FAMILY-META-SAFETY-ROADMAP.md).
External gates: [MISSION-01-RELEASE-GATES.md](MISSION-01-RELEASE-GATES.md)
(all BLOCKED).

## Differentiators

Standalone one-pager: [DIFFERENTIATORS.md](DIFFERENTIATORS.md) (evidence-first
exact-excerpt/digest validation, conservative 3-valued compiler, fail-closed
trusted-policy gates).

## UNVERIFIED submission logistics

- **UNVERIFIED**: official Hackathon Rules text (event pages state rules
  "will be published" with no link on public pages).
- **UNVERIFIED**: submission format requirements (video length/format,
  repo/demo-link requirements), prize distribution, judging rubric beyond
  one-line track criteria, waiver content.
- In-repo record states: owner-supplied deadline "before November 4, 2026";
  portal/rules/video length/URL not supplied
  ([HACKATHON-DEMO.md](HACKATHON-DEMO.md)).
- No filed-submission confirmation exists in-repo.
