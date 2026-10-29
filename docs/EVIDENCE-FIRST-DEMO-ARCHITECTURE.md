# BursYar: Evidence-first Hackathon Demo Contract

Status: proposed; implementation and real Meta inference NOT verified.
Base: PR #8 head 872add46a06e538dcce1cac383db4a8944d093c0. This document changes no runtime settings.

## Single end-to-end demo
A student uploads an IELTS/TOEFL result or an Afghan educational certificate plus its translation (use synthetic/redacted samples in demonstrations), reviews a generated editable profile, selects one authoritative scholarship opportunity, sees grounded eligibility and missing evidence, and explores "what if" changes. English, Dari and Pashto must preserve the same canonical eligibility facts.

## Hard boundaries
- No document is authentic merely because a model recognizes a seal, QR code, TRF, logo or signature. Officially verified requires authorized issuer confirmation with date/method recorded. Unavailable issuer access => not verified.
- Translated/attested status is independent of original document authenticity and university acceptance.
- User-entered corrections and hypothetical scores must never overwrite issuer-verified facts or extracted claims; source attribution must persist.
- Never say "fake" based on visual inconsistency. Use discrepancy / requires review.
- A missing certificate is not evidence of poor language proficiency.
- Duolingo English Test may be recommended only where the particular program accepts it, grounded in official scholarship/admissions text. No provider endorsement or affiliation should be claimed.
- Never upload sensitive documents to public storage, source control, analytics, debug logs or external AI systems without consent and appropriate data minimization.
- Meta API spend and live checks require separate user-controlled gates; no paid calls or deployments in this architecture PR.

## Canonical data contracts (illustrative; versioned)
Document: {id, userId, kind, storageRef, sha256, language, uploadedAt, deletionAt?, consentVersion, inspectionStatus}.
ExtractedClaim: {id, documentId, field, value, sourceSpan, extractionModel?, extractionStatus, userReviewStatus}.
ProfileFact: {key, value, origin: "issuer_verified"|"document_extracted"|"user_declared", claimIds, updatedAt}.
Verification: {documentId, type: "issuer"|"format_check"|"translation_review", status: "verified"|"unverified"|"unknown"|"discrepancy", authority?, checkedAt?, evidenceRef?}.
Requirement: {id, operator, operands, sourceUrl, sourceExcerpt, effectiveDate?, ambiguity: boolean, reviewerStatus}.
Assessment: {requirementId, status: "met"|"not_met"|"unknown", usedFacts, sourceEvidence, explanationKeys}.
Scenario: {id, overrides, baseAssessmentId, status: "hypothetical"}.
GapAction: {requirementId, missingEvidence, nextStep, providerUrl?, acceptanceSourceUrl?, verifiedAt?}.

Implement schemas/validation before accepting outputs; never let an LLM invent verification, acceptance, financial awards, or missing source excerpts.

## Technical architecture
1. Authenticated upload: enforce MIME/content detection, file size/page caps, virus and PDF safety checks, secure per-user private storage, retention/delete policy, quotas and revocation-safe authorization. No raw text in logs.
2. Model-extracted claims: bounded request and structured response; exact document region evidence. User reviews claims before profile publication. Flag unreadable and conflicting claims.
3. Scholarship Requirements Compiler: use authoritative dated scholarship source; compile supported comparisons (degree, score and per-band minima, explicit date bounds). Reject ambiguous/unsupported rules as UNKNOWN. Version the compiled rules and keep exact excerpts.
4. Deterministic evaluator: three-valued logic MET / NOT_MET / UNKNOWN, no invented "eligible" blanket verdict. For test scores track test type, scale and effective date. Respect that post-Jan-2026 TOEFL scales may differ; never naively convert scales.
5. Evidence graph: immutable links assessment -> rule -> official excerpt and assessment -> profile fact -> claim -> document. Preserve correction and provenance history.
6. Counterfactual evaluator: scenario overrides are separate and clearly hypothetical; show what changes, what does not, and which prerequisites remain.
7. Missing Evidence/Action planner: prefer smallest clarification that resolves unknown requirement; suggest only official provider links with sourced acceptance. Do not imply Duolingo endorsement.
8. Output rendering: share one canonical assessment across en/fa/ps and apply translation review; avoid per-language re-evaluation.

## First vertical slice (build before other features)
- Single seeded authoritative scholarship fixture (source URL + frozen source excerpts + reviewed extraction); no fake live availability.
- One synthetic IELTS-like document and one Afghan credential + translation with explicit synthetic watermark, safe test storage.
- Editable profile with provenance badges: document-extracted, user-declared, issuer-verified.
- Three-valued degree/language evaluator with one per-band requirement; source-linked results and unknown explanations.
- Counterfactual: raise a hypothetical score, then re-evaluate without modifying facts.
- Action routing: show official English test URL only if acceptance is proven for selected opportunity; otherwise say check with admissions.
- Three languages and RTL; make human-review status visible.

## Offline acceptance/evaluation gates
- Valid document -> expected extracted values; malformed/oversized/encrypted -> safe failure, no leaking raw inputs.
- Name transliteration differences -> discrepancy for review, not automatic fraud determination.
- No credential -> unknown, not "failed English".
- Overall IELTS sufficient but one band below minimum -> NOT_MET.
- Missing degree document -> UNKNOWN if degree unconfirmed.
- Hypothetical improvements never become verified profile facts.
- Conflicting scholarship excerpts -> UNKNOWN pending review.
- Unsupported tests or scoring scales -> UNKNOWN, no fabricated conversions.
- Prompt injection in scholarship text/document -> treated as hostile data, not instructions.
- Exact evidence validation rejects invented citations, claims or excerpts.
- Cross-user document fetch denied; concurrent quota access bounded; delete actually revokes file access.
- Tests must not expose hidden expected answers, reference IDs, scores or solutions to the agent. Offline harness must not call paid providers.
- API errors redact keys, token strings, raw personal documents.
- Human review of translations and real issuer access explicitly marked pending where applicable.

## Demo readiness
Publish only after real end-to-end inference is verified by authorized owner with capped spend, security tests, accessible mobile browser QA, real official source checking, human translation review and deployment approval. Never equate unit tests, mock providers, or structurally valid outputs with real Meta verification.

## Deferred
Official issuer partnerships and verifier integrations (IELTS/ETS etc.), large-scale ingestion, automated applications, paid provider referrals, automated review of sensitive IDs. None should be simulated as live in a public demo.
