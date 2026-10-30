# BursYar Mission 02 — translation and official policy sign-off packet

**Status: PENDING EXTERNAL HUMAN REVIEW — this document is not an approval.**

## Scope and immutable reference
Review current `src/glossary.js`, `docs/GLOSSARY.md`, `src/pathfinder.js`, `src/gap-actions.js`, and `verification/fixtures/scholarship-evaluation.json` at the exact pull request head and record their Git commit SHA. English, Farsi and Pashto must be reviewed for linguistic correctness, negation, exceptions, uncertainty, and right-to-left presentation. Automated assertions are *not* evidence of native-speaker approval.

## Reviewer worksheet
For each reviewer record: name/organization, language proficiency and role, independent contact method, date and time, Git commit SHA, reviewed artifact paths + digest, representative source quote, Farsi/Pashto interpretation, any ambiguous conditions, screenshots at mobile/tablet/desktop, conclusion (approved / revision required / unable to judge), and specific changes requested. Never embed private student records or review participants' personal identification documents.

## Mandatory wording test cases
1. `met` = appears to meet **one enumerated requirement only**, not university admission or award.
2. `not_met` = documented mismatch with the provided fact, never a blanket rejection of the student.
3. `unknown` = unclear source, missing evidence, unsupported scale, conflicting policy, or unreviewed interpretation.
4. Missing IELTS/TOEFL or another accepted certificate **does not prove weak English**.
5. The source may be authentic and still be outdated; direct university verification is separate from cryptographic text integrity.
6. A plausible URL or claimed waiver is not an accepted alternative unless program, intake, dates, source, waiver and human approval all match.
7. Scholarships can have independent conditions beyond the selected excerpts; deadlines, funding and exceptions may be omitted.
8. Farsi/Pashto explanations must preserve negations, thresholds, currency, dates and university ownership of the decision.

## Official policy review workflow
- Identify the **exact scholarship, degree program, intake and policy-effective dates**.
- Fetch the institution's official program and scholarship pages through the restricted source service or inspect an authoritative saved PDF with a stable reference.
- Preserve source URL, redirected canonical URL, UTC capture time, raw and extracted SHA-256, complete original excerpt and surrounding clauses, current source revision and contradictions.
- Independently check that the page belongs to the institution, that quoted policy actually applies to the specific award/program, that exceptions and test pathways are explicit, and that the relevant version is current.
- For alternatives require named reviewer approval, accepted evidence, expiration date, revocation method and scope. A new version/changed clause must invalidate earlier approval.
- Re-check funding values, exclusion conditions and deadline timezones separately. Do not infer acceptance from English proficiency or another institution's policies.

## Release gating
NO transition from UNREVIEWED to reviewed until qualified reviewers complete the above worksheet for the exact tested code/tree and any relevant university-sourced policy snapshots. NO automatic official verification, no real student uploads to external providers, no family/minor access bypass. Maintain Draft PR status until Mission 01 policy/security release gates also pass.

## Decision log
- Linguistic sign-off: **NOT PROVIDED**.
- Institutional policy and alternative acceptance sign-off: **NOT PROVIDED**.
- Mission 01 independent security sign-off: **NOT PROVIDED**.
- Paid model inference/live model accuracy: **NOT VERIFIED**.
