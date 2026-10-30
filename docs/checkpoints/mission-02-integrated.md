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
