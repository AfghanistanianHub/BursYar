# Mission 01 — Release gates and evidence checklist

Status: **ENGINEERING VERIFIED; RELEASE BLOCKED**. This is not a production deployment approval.

## Verified technical evidence
- Integration: [Draft PR #30](https://github.com/AfghanistanianHub/BursYar/pull/30), built on #26 and preserving #21 lineage. Do not merge competing #25/#26 implementations automatically.
- Latest code at checklist creation: `e5414bccd26806db756c6f4dbdfb93523f41da4b`.
- Automated CI: [GitHub Actions 41022845962](https://github.com/AfghanistanianHub/BursYar/actions/runs/41022845962), four jobs success on that exact commit.
- Adversarial boundaries: provider refusal before reservation/prompt, guardian cross-user isolation, recipient collision, atomic transfer rollback and former guardian revocation; synthetic fixtures only.
- No production deploy, paid inference, external live provider call or protected-branch merge.

## Mandatory independent verification before real-world release

| Gate | Required authority / evidence | State | Enforcement |
| --- | --- | --- | --- |
| Legal majority and recipient identity | Trusted identity and lawful age determination for recipient; authenticated target UID; jurisdiction-specific policy review, audit trail and expiry | **BLOCKED** | Internal transfer service must not be exposed |
| Guardian authority and current consent | Independently verified guardianship/parental authority, recipient consent and revocation at decision time | **BLOCKED** | Fail closed, never use browser attestations |
| Official scholarship policy | Institution-controlled source URL, publication/validity, precise excerpt, requirements, conflicting terms and permitted alternatives, reviewer ID and expiry | **BLOCKED** | Missing coverage/alternatives = unknown |
| Farsi/Pashto translations | Qualified fluent human reviewers, semantic accuracy, RTL/accessibility and approved output digest with review date | **BLOCKED** | Do not label UNREVIEWED strings approved |
| External provider legal/privacy | Current API terms, minimum age, product targeting, region and subregion, personal data processing/training, model permit, privacy assessment and budget authorization | **BLOCKED** | Do not enable hosted inference for minors or Contributor with personal data |
| Production release | Named authorized reviewer, threat-model decision, roll-forward/rollback, telemetry privacy, current CI on exact release SHA | **BLOCKED** | Draft, no merge or deployment |

## Review procedure
1. Attach dated documentary evidence for **each gate** to a separately reviewed issue or approval record. Do not include student PII, credentials or government IDs in a public GitHub issue.
2. Have an authorized human reviewer record the conclusion, scope, expiration and any conditions for each gate. A model or synthetic test must not self-certify.
3. Rerun all four CI jobs at the **final exact SHA** after any code changes; passing older commits is not sufficient.
4. Maintain zero hosted-model use on under-18 pathways and isolate guardian-managed deterministic workflows.
5. Require **explicit owner release approval** before altering Draft status, merging into `main`, deploying, enabling providers or changing billing.

## Honest completion boundary
The engineering work can be completed and verified without activating paid inference or handling live student data. Legal identity review, source authenticity attestation, fluent language review and provider-contract approval cannot be replaced by code or CI; report them as separate, unresolved gates until real evidence is supplied.
