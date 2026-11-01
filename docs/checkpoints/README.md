> Current handoff: [28 October readiness report](../HACKATHON-READINESS-2026-10-28.md), draft PR #12 stacked on #11. Older current-status/setup claims below are historical. Successful live inference remains unverified without correlated provider/validation evidence.

# Development checkpoints

Resume from `06-three-language-demo-path.md` and `../LIVE-DEMO-GATES.md` on `feat/demo-verification` (draft PR #7, stacked on PR #6). Historical checkpoints below preserve the completed development trail.

| Milestone | Commit | Evidence |
|---|---|---|
| Baseline | a89e3098cff643ecb1c1336d71b96b7ffc7fc758 | 01-baseline.md; 16 tests/build |
| Identity + durable reservations | 278df5d893a4dbee5f9f3331092533d8ba42117e | 02-identity-and-storage.md; 19 tests |
| Authenticated inference/client | 29d86578a60c2bfa0d467bcc5dfbfde2df4d9c25 | 03-authenticated-inference.md; 24 tests/build + Node22 CI |
| Regression/handoff | SHA in Issue #4 / PR #6 milestone comment | 04-regression-and-resume.md; 26 tests, clean install, configured build, audit |

Current external blockers: live Meta credentials/model/account caps; live Firebase ADC/provider/approved user; persistent hosting with no billing change; real scholarship and human translation validation; browser/emulator QA. Code tests using fake verified identity/provider are not a live demo.

Continuation: `feat/demo-verification` (draft PR #7 stacked on #6). Read 05-emulator-and-integration-review.md then 06-three-language-demo-path.md and ../LIVE-DEMO-GATES.md. Runtime updated to Node>=24.12/npm11.9 to match current Firebase SDK requirements. Checkpoint5: 47e9faa10a423ce349876b68034ebc677582dcaa; checkpoint6 SHA and CI results in Issue4/PR7. Human translations pending; no live Meta success claimed.

Latest handoff: **07-live-access-handoff.md**. Verified implementation b0b0c7ef8620234916f384417bfa7fed755af94c passed all3 CI jobs (run40441611215),29 tests,40 emulator checks and12 browser cases. Resume with owner provisioning in ../LIVE-DEMO-GATES.md, then real local Google/Meta smoke flow. Real integration and human review remain blocked/pending, not simulated.

Latest recovery: **08-live-integration-recovery.md**, branch feat/live-integration-recovery based on the integrated PR #7 merge. Historic 502 remains unclassified; structured diagnostics and one-terminal recovery are implemented. No live Meta claim or human translation approval. This supersedes the older owner-provisioning checklist: completed owner setup is accepted and existing environment is reused.

Reboot continuation: **09-mac-reboot-recovery.md** and **../MAC-REBOOT-STARTUP.md**. Original checkout reconciled safely; Firebase credential and quota state survived. New one-command startup uses a login-Keychain item instead of ephemeral shell variables. A secure native dialog is the one-time owner step for the lost Meta credential and any spending-limit attestation. No paid inference is automatic or verified.

Spending continuation: **10-spending-attestation.md**. Owner confirms a USD 5 Meta cap; setup now preserves saved state and supports a targeted, verified attestation-only update without API-key re-entry. Redacted diagnose mode exposes no credential or model values. Agent-side live Keychain access remains blocked by OSStatus -67674; no paid inference was invoked.

Latest mission: **11-autonomous-mission.md** and **../HACKATHON-DEMO.md** supersede earlier current-status claims. PR #8 now targets main; #9 remains stacked. Main history has been reconciled without restoring the old shared-token service. See the mission checkpoint for actual test counts and unresolved live gates.
