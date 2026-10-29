# BursYar engineering report

Checkpoint: October 27, 2026, America/Vancouver. Repository: https://github.com/AfghanistanianHub/BursYar. Deadline supplied by owner: before November 4, 2026.

**Outcome: a tested, private local demonstration foundation is implemented and published to draft PR #9. The full six-phase mission and mandatory live Meta demonstration are not complete.** Desktop Keychain access, actual Meta inference, wider real-policy compilation and human translation review remain critical gates. No public deployment or external submission occurred.

## Phase status

| Phase | Implemented and verified | Remaining scope / limits |
|---|---|---|
| 1 — Stabilize | Cloned and inspected the repository/dependencies; reviewed PRs #2–#9 and issue #4; ran the previously unexecuted PR #9 tests; reconciled main/feature history; repaired degree counterfactual and mobile overflow; executed Node, build, browser/axe, emulator, native helper and dependency checks. | Actual owner Keychain data and account-side spending settings could not be independently read. Existing credentials/records were preserved. |
| 2 — Reasoning | Evidence-selected requirements compiler; exact quotation/digest bindings; deterministic met/not_met/unknown; per-result source and fact references; conflicting recognized thresholds; isolated degree/score scenarios; pending/contradicted fact rejection. Compiler output feeds the UI after Meta evidence normalization. | Only two narrow English grammars compile automatically: explicit degree minima and IELTS Academic overall/per-band minima. Exemptions, date validity, course scope, work experience, nationality, equivalence and most real prose remain unknown. Selected evidence is not complete scholarship coverage. Source authenticity and semantics are unreviewed. |
| 3 — Documents/profile | Authenticated UTF-8 .txt upload, 12 KB cap, consent, private local SQLite, 10-document/user cap, pending source-grounded extraction, explicit accept/reject/correct, correction history, persistence, profile import, per-user isolation and deletion of linked current facts. Owner/mode/symlink checks protect the database. | Extraction is a deterministic labeled-text parser; no OCR, PDF/image processing, Meta document interpretation, cloud Storage or official issuer integration. Duplicate educational fields cause discrepancy/review. Translation status remains not assessed. No inspection proves authenticity. |
| 4 — Gap resolution | Per-requirement gap guidance in three languages asks for missing qualifications/evidence, accepted tests, thresholds, validity and exemptions. Missing certificate never implies weak English. Provider links are withheld. | No verified program-specific provider recommendation catalog. Official admissions acceptance must be curated before adding examination-provider links. No partnership or endorsement claims. |
| 5 — Multilingual UX | English, Dari and Pashto; RTL; mobile upload layout fix; canonical facts survive language switches; hypothetical/current facts remain separate; real text-document review journey exercised in browser tests. Twelve width/language cases pass axe checks and overflow assertions. | Native-speaker terminology/semantic review pending. Automated accessibility checks do not prove all assistive-technology journeys. No live Google OAuth UX verification in this session. |
| 6 — Validation/delivery | Offline adversarial evidence tests, auth/quotas, cross-user document denial, emulator identity isolation, safe API errors, token/credential redaction checks, strict provider adapter, native helper tests, reproducible fixture evaluation, CI artifacts, demonstration script, architecture and submission runbook. | Real Meta and real Firebase account verification pending; no live model accuracy/cost figures; official automated Oxford retrieval failed; human translations and final submission assets pending. Public deployment requires owner approval. |

## Mandatory Meta integration

Meta is the configured semantic interpretation layer: evidence selection and provisional explanations in English/Dari/Pashto. BursYar independently validates the quoted evidence and source digest, compiles a bounded subset of rule forms, evaluates facts numerically and keeps counterfactuals separate. No other AI provider or simulated replacement was introduced into the actual runtime. Offline/mock reports explicitly identify their mode.

Official Meta documentation checked October 27 confirms the chat-completions endpoint, messages format, bounded max_completion_tokens and documented muse-spark-1.3 model. References: https://dev.meta.ai/docs/protocols/chat-completions and https://dev.meta.ai/docs/models. Models may support more modalities; the implemented adapter sends text only. Current terms/AUP were reviewed at https://dev.meta.ai/legal/terms-of-service and https://dev.meta.ai/legal/acceptable-use-policy; access rights/account mode still require the actual account preflight. No claim of legal certification is made.

Actual provider response verification: **not performed**. Live model ID/access: **not independently verified**. Actual inference latency, prompt/completion tokens and billed cost: **unavailable**. The adapter now supports allowlisted provider-reported counts and elapsed time, with costUSD:null when unavailable; mocked metrics tests do not supply live numbers. Reservation units remain workload limits, not a currency budget.

The agent's compiled native helper returned Keychain OSStatus -67674 without printing secrets. A pre-existing local gateway returned /health {ok:true}; this proves only process health. The opt-in live runner exited blocked because its explicit gate was absent. No inference request was made by the mission. The owner's existing USD 5 account-cap report/attestation was not increased or rewritten. Direct Oxford retrieval from the runner was unavailable; separate web browsing could read official material. Neither cached excerpts nor a successful schema test count as live Meta evidence.

## Actual test evidence

| Check | Observed result | Evidence mode |
|---|---|---|
| Initial npm test at original PR #9 | 60 passed, 0 failed | Local Node; includes all 17 previously unexecuted eligibility/profile tests |
| Latest npm test | 74 passed, 0 failed, 0 skipped | Local and CI; synthetic/fake identities/provider as labeled |
| npm run build | Passed | Vite production build |
| npm run test:emulator | 47 checks passed | Local Firebase Auth/Firestore emulators + fake model; includes authenticated document isolation/review/deletion |
| npm run test:browser | 12 cases passed, zero recorded axe violations/overflow | Linux CI; mock identity/model + real local document API, 320/390/768/1440 px, en/fa/ps |
| npm run test:evaluation | 9 checks passed | Three official excerpt fixtures × three languages, conservative unknown behavior only; NOT model accuracy |
| Swift helper self-test | Passed | Fake Keychain records; no actual Keychain access or inference |
| npm audit | 0 known vulnerabilities | Installed dependency advisory database; not proof of vulnerability absence |
| git diff --check | Passed | Working patch formatting |
| npm run test:live | BLOCKED, exit 1 | Explicit live gate missing; no model call |
| Native diagnose | BLOCKED, exit 1 | macOS Keychain service unavailable (-67674) |

All four jobs passed for latest code checkpoint 6ba2aeaf560af8060b387fc82953ada2dc5e7d4b: https://github.com/AfghanistanianHub/BursYar/actions/runs/40644834133. This includes preserved hypothetical results across language switches and a browser fixture traversing the actual compiler. Earlier code checkpoint f947543cbb9134d9dd388c02d7deb73718048e15 also passed all four jobs in run 40644357931. Test modes and actual run evidence remain attached to their commit.

Official fixture scope is deliberately modest: Oxford current-student exclusion, Chevening post-degree work and Cambridge nationality/full-time-study conditions. These remain unknown because their predicates are unsupported. The evaluation does NOT claim successful admission prediction or measured Meta reasoning quality. Expected answers stay in the offline harness and are never sent to the model.

## Security findings and residual risks

Addressed during this mission:

- Degree simulation incorrectly rejected scalar degree overrides; fixed and covered without changing original facts.
- The initial eligibility UI was disconnected from actual evidence output; compiler output and approved profiles now feed it.
- Language remounts discarded canonical input/scenario state; preserved and exercised in browser CI.
- Mobile document controls caused horizontal overflow; corrected and checked at 320 px and larger widths.
- Private document authorization is derived only from verified token identity; client uid values are ignored. Cross-user get/review/delete fail with the same 404. Approval checks occur on every request.
- Private databases require an absolute path, owner-only directory/file modes and no final-path symlink. Document storage is separate from the existing quota database. No document text or token is logged. Identity changes clear cached document/profile UI and reject stale responses.

Remaining release risks:

- An exact quote is traceability, not entailment, source authenticity or completeness. Prompt boundaries and regression cases do not prove general prompt-injection resistance. Model omissions and misleading translations remain possible; all interpretations stay unreviewed.
- Real-policy compiler coverage is insufficient for blanket scholarship eligibility. The whole scholarship may remain unknown even if selected degree/score thresholds are met. Do not hide unsupported rules or missing course/date evidence to improve demo results.
- Local private SQLite is not encrypted cloud storage or an independently audited document vault. Retained originals and review history are sensitive; use synthetic files for demonstration. Delete revokes application access and current linked facts, not forensic access to owner backups.
- Revocation and cross-user checks are emulator/mock verified, not evidence of actual production account permissions or live Google OAuth success.
- No public production-security certification or exhaustive repository security scan is claimed. There is no issuer-verification integration. Any new PDF/image pipeline or public deployment needs its own security review.

## PR integration and checkpoints

PRs #2 and #3 are merged into main. PRs #5–#7 were merged into feature branches, so their merged labels did not mean their whole chain had reached main. Number #4 is a tracking issue, not a PR. Initial merge-tree review found add/add conflicts in engine/README.md, engine/package.json and engine/server.js.

The main history was reconciled into PR #8 using the authenticated feature versions of those files. Its runtime tree remained identical to its pre-mission tree. PR #8 now targets main and is mergeable. PR #9 includes that reconciled ancestry and remains stacked on #8. No PR was merged.

- PR #8: https://github.com/AfghanistanianHub/BursYar/pull/8 — head 3dd918762203a5c42d6b45959dede5fb2ccb7688.
- PR #9: https://github.com/AfghanistanianHub/BursYar/pull/9 — contains the reasoning/document/UI work; remains draft.
- Owner review order: #8 into main, then retarget/review #9 into main. Re-run CI if either changes. Keep legacy shared-token server code out of the active path.

Focused commits were created locally and published through the connected GitHub tool because HTTPS git push had no login credentials. Remote commit IDs differ from locally authored equivalents; the content trees were checked during publication. Local recovery branches preserve the original history. No secrets/personal documents were committed. Starting heads: #9 dc3bcdf852599080c6642b1f3bd3d4da85f9054b; #8 872add46a06e538dcce1cac383db4a8944d093c0. Prefer revert commits over force resets; never delete quota records for recovery.

## Exact remaining submission steps

See HACKATHON-DEMO.md for runnable commands and the full demonstration script.

1. In the owner's logged-in Terminal, use the updated PR #9 checkout and stop only the previous BursYar launcher with Ctrl+C. Run ./start-bursyar.command. Reuse the existing Keychain/ADC and unchanged quota/spending caps. Run npm run check:mac for redacted saved status; do not paste keys or tokens.
2. Verify the existing account's actual Standard Meta model access and saved spending gate without increasing the USD 5 cap. Confirm an approved Google account can sign in and that required security checks remain green. No paid call is authorized by a failed preflight.
3. Make an explicitly authorized, bounded real Meta request using PUBLIC authoritative scholarship evidence. Record the actual response, digest, elapsed time and provider usage. Do not silently retry or switch providers. If Oxford retrieval remains unavailable, resolve the official-source access path without substituting an unofficial mirror.
4. Expand and validate the compiler for the selected REAL scholarship's required predicates, or demonstrate its unknown output candidly. Keep the fictional score scenario separately labeled. Do not present a synthetic positive result as live official eligibility.
5. Obtain human English/Dari/Pashto interpretation and terminology review; record actual approval/corrections. Official issuer access remains unavailable unless separately authorized.
6. Record a demo with synthetic-education.txt, official public scholarship text, evidence checks, uncertainty/conflict handling, private review/deletion and isolated counterfactuals. Complete the video and final submission description using only verified claims.
7. Confirm the actual hackathon name/portal/rules, deadline timezone, required Meta proof, repository access and asset formats with the owner. These were not supplied, so portal submission cannot be completed responsibly. Owner reviews PRs and submits the package. Public deployment requires separate owner approval.

No account billing, permissions, production Firebase rules, existing credentials, saved Keychain attestation, persistent quota records or pre-existing service processes were changed by this mission. The newly configured private document database is created only when the updated launcher runs.
