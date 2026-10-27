# BursYar — Product Requirements (PRD v0.1)
Date: 2026-10-26 | Status: Proposed, implementation tracked separately

## Vision
From opportunity discovery to real educational access. BursYar helps Afghan youth and women understand reliable scholarship requirements, identify practical access barriers, and plan evidence-grounded next steps, in English, Dari/Persian and Pashto.

## Primary audience
Afghan applicants in Afghanistan, Iran, Pakistan or elsewhere; especially women whose schooling has been interrupted and displaced applicants with incomplete documents. Avoid presuming any individual's eligibility or immigration status.

## Core problem
Generic scholarship directories answer *what opportunities exist?* but not *can this person meet the requirements, what remains unknown, and what actions are possible?* Institutional wording, uncertain equivalencies, missing records, travel barriers, limited bandwidth, scams and deadlines complicate applications.

## Hackathon MVP — must ship
1. **Evidence-backed scholarship reader:** paste authoritative scholarship guideline text; extract eligibility criteria, deadline, funding inclusions/exclusions, required documents, source URL and source excerpts. Unsupported fields must remain unknown.
2. **Plain-language explanation:** produce simplified English with structured, verifiable criteria.
3. **Dari and Pashto:** translate explanations with proper script and RTL; show the original English alongside them.
4. **Barrier Pathfinder (bounded):** anonymous, optional answers about education level, availability of academic documents, language-test evidence and travel document availability; compare to explicitly extracted criteria. Output only 'appears to meet', 'potential mismatch' and 'cannot determine', never a single success probability.
5. **Document-alternative guidance:** present *only* accepted alternatives explicitly documented by the provider; otherwise provide a suggested question to ask the university.
6. **Source transparency:** link to originating document, timestamp for human verification, and human-review status. Never claim auto-extracted facts are approved.
7. **Low-bandwidth and accessibility:** compressed assets, mobile-first, semantic controls, usable keyboard navigation, RTL tests, friendly error handling.

## Out of scope for hackathon MVP
Automated visa eligibility, unverified country-specific exit/travel predictions, applicant ranking, automated application submission, document uploads, community messaging, mentorship matching, payments, surveillance-risk profiling, or unsupported scholarship scraping.

## User journey
Choose language → enter published scholarship guideline and official URL → model returns structured source-bound criteria → user optionally selects barriers → per-requirement status and next action → export or save locally as non-sensitive notes. Anonymous by default.

## Data model
Scholarship {id, title, provider, canonical_url, country, level, source_text_digest, verified_at, status}
Criterion {id, source_excerpt, section_reference, type, required, description_en, description_fa, description_ps, uncertainty}
Analysis {language, summary, criteria[], deadline?, funding?, uncertainties[], requiresHumanReview:true}
BarrierAnswers (ephemeral, not persisted by default) {education_level, transcripts_available, language_test_available, travel_document_available}
Action {criterion_id, type:'verify'|'prepare'|'ask_institution', text, evidence_url?}

## Acceptance tests
- Every substantive AI assertion is grounded in source text or labeled unknown.
- Missing or conflicting deadlines are not invented.
- Prompt-injection instructions embedded in scholarship text are ignored.
- Dari/Pashto layouts pass RTL, mixed text, 320px screen and keyboard checks.
- With Meta credentials absent or provider unavailable, UI gives an honest error; never fake a successful analysis.
- No sensitive user answers, source uploads or API keys in browser logs.
- Firestore reads only approved published documents; writes restricted to trusted administrative process.
- Live end-to-end Meta integration, security tests, and deployment checks required before demo is called operational.

## Success measures
Demonstrate one real, publicly sourced scholarship explained and translated across all 3 languages, with traceable requirements, at least 3 documented barriers, and a clear human-verification step. Measure correctness and latency; no fabricated numerical impact claims.

## Ethical limits
Educational guidance, not immigration, admission, or legal determination. Collect the minimum information; no mandatory identity or passport upload. Fail closed on missing evidence.

## Future (post-hackathon)
Verified scholarship catalog, offline packs, true-cost comparisons, deadline tracker, scam signals, mentor network, university exception outreach, change monitor.

## Technical choices to validate
GitHub source of truth; Vite static frontend preview on Render; Firebase public reviewed catalog and optional auth; secure server-side Meta adapter with identity verification, budgets and rate limits. FlutterFlow remains optional—not a prerequisite to a working web demo.
