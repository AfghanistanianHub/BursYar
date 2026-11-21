# Mission 02 — integration checkpoint (Draft, no deployment)

## Branch and preservation
Based on `integration/mission-01-secure-reconciliation` (Mission 01 Draft PR #30). This is a stacked integration proposal, not a statement that Mission 01 has passed its security gates. No changes to PRs #25/#26/#27/#29 or protected branches.

## Implemented
- Ported Muse GPA on explicitly stated 4.0/5.0 scales and TOEFL iBT exact overall/per-section grammar into the existing deterministic compiler, preserving Mission 01's complete-source inventory and Oxford exclusion policy mapping.
- Extended tri-state local assessment and scenarios to GPA/TOEFL without converting GPA scales or inferring test equivalencies; existing source/used-fact provenance and Oxford exclusions preserved.
- Imported Muse synthetic evidence challenge fixtures, compiler expansion tests, controlled en/fa/ps glossary and glossary tests.
- Ported translated PathFinder assessment and regression tests with fail-closed caller alternatives; user-supplied alternative text, URL, flags and alleged curator status can never establish official acceptance.
- Does not invoke paid AI APIs. No student or minor data exported.

## Non-negotiable evidence policy
A quotation matching pasted text proves only internal excerpt correspondence, **not** that the source is official, current, complete or institution-approved. Unverified and outdated source evidence must not imply verified institutional acceptance. Alternatives are questions until a separate server-owned registry has authenticated official source snapshots, source/excerpt digests, institution-specific policy linkage, freshness/revocation and independent human review. No such production registry is activated in this PR. No Duolingo, IELTS, TOEFL or pathway acceptance may be assumed by similarity or model suggestion.

## Human review gates
- Qualified reviewers must examine Farsi and Pashto wording, terminology and context; all new translations remain UNREVIEWED.
- Scholarship-specific university policy, deadline, exemption, GPA scale, award funding and official accepted alternatives require manual source verification. Incomplete source capture implies coverageComplete=false and requiresHumanReview=true.
- Existing Mission 01 guardian authority, revocation, atomic age-of-majority transfer, cross-user isolation, region/provider restrictions and account privacy gates are not resolved by this PR.

## Test/CI status
New test sources were committed, **but none has been executed locally**: connected GitHub lacks a command runner and container cannot reach github.com. Prior PR #27 and #30 checks do not validate this combined head. Required before any merge: npm test; npm run test:evaluation; npm run build; npm run test:emulator; npm run test:browser; CI on this exact head, with manual inspection of failures and security/RTL behavior.

## Remaining usability
- Student UI wiring for the new GPA field/PathFinder actions may require a separate migration; do not silently display unsupported interpretations.
- Document-first profile extraction and official issuer authenticity checks require separate authorized integrations.

## Source integrity follow-up
- `engine/source-provenance.js` now audits exact complete-line excerpt matching, SHA-256 capture integrity, strict HTTPS URL syntax, source age metadata, contradictions and invalid dates, entirely offline.
- `tests/source-provenance.test.js` covers tampering, stale/contradictory inputs, forged institution approval and unsafe URLs.
- The audit intentionally **never claims** official authenticity or scholarship-specific acceptance. It is a supporting forensic check, not an issuer-verification integration or a curator authorization channel. The active compiler still labels the overall source unverified, and PathFinder still cannot recommend undocumented alternatives.
- No automated age threshold or source-review timestamp is equivalent to verifying live institution pages. Human review gates are unchanged.

## Observed CI checkpoints
- Commit `05b6067`: GitHub Actions run 41015342003 completed all four jobs successfully: Node 194/194, offline evaluation 42/42, build, browser, Firebase emulator and macOS helper.
- Subsequent source-integrity commits require a separate CI green result and must not inherit that success claim.

## Integration into evidence normalization
- `normalizeEvidence` now attaches `sourceAudits` per selected requirement. A matching excerpt is an integrity check only; it cannot upgrade `sourceStatus: user_supplied_unverified` or grant institution acceptance.
- Missing source capture/check dates are explicitly flagged `invalid_freshness_metadata`. Caller-supplied date values cannot establish official issuer provenance.
- The deterministic eligibility engine remains offline; `met` means matching **enumerated requirement with supplied facts**, never verified eligibility, admission or funding.
- Additional regression test protects these limits. External validation and source-policy curator authorization still require implementation; no trusted external source registry was activated.

## Credential versus competence follow-up
- `planGaps` now marks missing language-test evidence as `missing_credential_evidence` and sets `competenceAssessment: not_assessed`. This does not infer language weakness from an absent certificate.
- A supplied below-threshold score is reported as `reported_score_below_stated_threshold`, not as a generalized judgement about language ability.
- No examination provider, service partner, equivalency, or institution acceptance link is invented. Program-specific official acceptance review remains necessary.
- The new offline synthetic regression tests exercise missing certificates, below-threshold reports, unsupported scores and uncertainty.
- These metadata changes do not alter deterministic tri-state eligibility verdicts or transfer responsibility for institutional decisions.

## Curated accepted-alternative policy — code complete, activation gated
- Added `engine/reviewed-alternatives.js`: a strictly server-side resolver for operator-controlled, human-reviewed snapshots. Requires matching scholarship, requirement, degree/term policy scope, source URL, full source SHA-256 and complete source-line acceptance statement, named reviewer, explicit positive acceptance, validity window, non-revocation, and no competing records.
- `tests/reviewed-alternatives.test.js` covers correct scope, invalid URL/digest/excerpt, review timing, expired/revoked/forged status, duplicate review records and post-construction mutation.
- **Not activated on the public student/user endpoint:** no authenticated, signed or access-controlled institutional catalog has been provisioned. The module must only be initialized from a trusted operator-owned data source, never uploaded/user-provided JSON; current `assessBarriers` therefore continues to `ask_alternative`. Do not treat the existence of this module as actual university acceptance verification.
- Human-qualified reviewer input and independent validation of the official university page are still needed to populate any record. If no record exists, the desired outcome is unknown/ask-admissions.
