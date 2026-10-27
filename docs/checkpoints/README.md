# Development checkpoints

Resume from `04-regression-and-resume.md` and `../INFERENCE-RUNBOOK.md` on `feat/firebase-inference-quotas` (draft PR #6, stacked on PR #5).

| Milestone | Commit | Evidence |
|---|---|---|
| Baseline | a89e3098cff643ecb1c1336d71b96b7ffc7fc758 | 01-baseline.md; 16 tests/build |
| Identity + durable reservations | 278df5d893a4dbee5f9f3331092533d8ba42117e | 02-identity-and-storage.md; 19 tests |
| Authenticated inference/client | 29d86578a60c2bfa0d467bcc5dfbfde2df4d9c25 | 03-authenticated-inference.md; 24 tests/build + Node22 CI |
| Regression/handoff | SHA in Issue #4 / PR #6 milestone comment | 04-regression-and-resume.md; 26 tests, clean install, configured build, audit |

Current external blockers: live Meta credentials/model/account caps; live Firebase ADC/provider/approved user; persistent hosting with no billing change; real scholarship and human translation validation; browser/emulator QA. Code tests using fake verified identity/provider are not a live demo.
