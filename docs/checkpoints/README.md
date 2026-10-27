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
