# Mission 02 — PathFinder provenance security checkpoint

This branch is an **isolated, non-release security patch stacked on PR #27**, not an integration-approved architecture. The PR #27 review-only base must not become a merge destination. Do not merge or deploy this branch.

## Current change
- Prevents `assessBarriers()` from treating any caller-supplied alternative (even `verified: true` or a plausible official-looking URL) as accepted institutional policy.
- Keeps `not_met` as a potential mismatch and asks the institution about accepted alternatives.
- Adds adversarial fixtures for fabricated, wrong-domain, insecure, forged-approved and outdated claims.
- Does not change met/not_met/unknown eligibility assessment, Meta integration, personal profiles or provider policy.

## Integration gates (not yet satisfied)
1. Obtain the approved Mission 01 combined base and port selected PR #27 changes onto it; do **not** merge PR #27's review-only tree.
2. Create a server-controlled official-source/curator provenance registry with authenticated source snapshots, content digest, issuer/domain mapping, review timestamps, source-specific acceptance text, freshness policy, contradiction handling and revocation.
3. Only after #2, enable `use_documented_alternative` through an internal trusted capability; never based solely on input text, URL, hostname or a caller-supplied approval boolean.
4. Confirm scholarship-specific eligibility/exemptions and source-supported test alternatives; distinguish absent credential from absent skill; leave equivalencies unknown.
5. Perform full combined-commit Node, offline evaluation, emulator, browser, build and CI verification. No paid inference.
6. Review Farsi and Pashto translations with qualified humans. All current translations remain UNREVIEWED.
7. Preserve strict trust boundaries: never send student data to Contributor Mode; never infer eligibility or admission from a matching excerpt alone.

## Verification statement
These commits were written through the GitHub connector. Local Node, browser, emulator and build commands **have not been executed** for this branch. Prior CI from PR #27 does not validate these commits.
