> Current handoff: [28 October readiness report](HACKATHON-READINESS-2026-10-28.md), draft PR #12 stacked on #11. Older current-status/setup claims below are historical. Successful live inference remains unverified without correlated provider/validation evidence.

# BursYar demonstration and submission runbook

Prepared 2026-10-27 (America/Vancouver). Deadline supplied by owner: before November 4, 2026. This is a preparation package, not confirmation that an external submission has been filed. Hackathon portal, official rules, required video length and submission URL were not supplied.

## Architecture and technical contribution

Browser (English/Dari/Pashto) → Firebase ID token → loopback gateway → revoked-token/project/demo-claim checks → durable SQLite reservations → pinned Meta chat endpoint → exact-excerpt/digest validation → conservative requirements compiler → deterministic evaluator → isolated counterfactual → localized display.

A second authenticated path stores bounded UTF-8 educational text in a NEW private local SQLite database. Extraction produces pending claims with source lines. Explicit review publishes unverified profile facts; corrections become user declarations. Deletion removes the source and linked current facts. Uploaded documents are never forwarded to Meta. No official issuer service is integrated.

Meta's technical role is source-language interpretation, selecting relevant evidence, identifying uncertain obligations and generating provisional explanations in three languages. Deterministic code cannot replace that semantic interpretation across diverse prose. BursYar independently checks quotations, source digests, supported rule syntax, contradictory thresholds, fact provenance and numeric comparisons. Model prose never becomes an authenticity certificate or an admissions decision. The present compiler deliberately has low coverage: explicit bachelor/master/doctorate minimum sentences and explicit IELTS Academic overall/per-band sentences. Other conditions stay unknown. Source selection can omit conditions; the system cannot certify completeness.

The existing adapter uses POST https://api.meta.ai/v1/chat/completions, bearer authentication, developer/user messages, bounded completion length, timeout, response-size cap and no redirects/retries/provider fallback. Meta documents muse-spark-1.3, including multimodal capabilities; this implementation sends TEXT ONLY. Model catalog availability and account mode still require the real account preflight. See https://dev.meta.ai/docs/models and https://dev.meta.ai/docs/protocols/chat-completions. Terms and acceptable-use references checked October 27: https://dev.meta.ai/legal/terms-of-service and https://dev.meta.ai/legal/acceptable-use-policy. Documentation review is not a certification of account eligibility or compliance. Use Standard access with appropriate input rights and AI labels; never repurpose a coding-harness-only key.

## Reproduce the offline evidence

Use Node >=24.12, npm and Java 21. From the checkout:

```sh
npm ci --cache /tmp/bursyar-npm-cache
npm test
npm run build
npm run test:evaluation
npm run test:emulator
npx playwright install chromium
npm run test:browser
```

If the normal Firebase cache is inaccessible, set FIREBASE_EMULATORS_PATH and XDG_CONFIG_HOME to new temporary directories. The emulator project is demo-bursyar. It uses fake model output, never production Firebase or Meta. Browser tests use mocked identity/model replies and the real local document store; their JSON mode says so. Screenshots contain synthetic data only. Linux CI uploads browser evidence for seven days.

## Owner desktop access gate

Use the NEW checkout containing PR #9, not an old running copy. Close the owner's previous BursYar launcher using Ctrl+C; do not kill unrelated processes. Then run:

```sh
./start-bursyar.command
```

It reuses the saved Keychain entry, existing private ADC, unchanged quota DB/caps and public Firebase configuration. The updated Mac environment enables a SEPARATE documents.sqlite in the existing private directory. Parent directory must be owned by the user and mode 700. Database is mode 600; it is private local storage, not encrypted cloud storage. No production Firebase rules are required for it.

The agent's native diagnose returns OSStatus -67674. That does not prove a missing credential or an incorrect key. Run npm run check:mac in a logged-in Terminal for the redacted presence/spending status. Never paste credentials, ADC, tokens or Keychain exports into chat. Keep the owner's existing USD 5 account cap. Do not re-enter or overwrite the key to work around a service error. A positive saved amount alone is not a spending confirmation.

Launch checks model access without inference. Only after the existing attestation, actual account access, approved Google sign-in, quotas and security checks pass may an authorized live request run. Keep the provider/model unchanged and do not switch to Contributor or another provider to obtain a successful demo.

## Five-minute demonstration script (record only verified capabilities)

1. State the evidence mode: offline/mocked rehearsal OR actual Meta. Show that the source is a university/scholarship's official page. Do not present fictional sample listings as active opportunities.
2. With approved Google sign-in and live gates satisfied, paste official PUBLIC requirements and their exact URL. Make one explicit analysis request. Show the Meta interpretation, original quotations, source digest, review warning and three language views. Language switches make no additional inference request.
3. Explain BursYar's checks: invented quotes are rejected; unsupported/conditional clauses remain unknown. Conflicting recognized thresholds are flagged together. A URL entered by a user is not independently authenticated source ingestion. Official-source completeness/semantic review is still required.
4. Upload verification/fixtures/synthetic-education.txt, review each pending claim, optionally correct the degree, then approve. Show that all claims remain unverified and that correction changes provenance. Do not imply that this bounded text parser is OCR or Meta document interpretation.
5. Show the per-requirement results and gap guidance. Missing evidence is not proof of weak English. No examination provider is recommended unless program-specific acceptance is verified. Current implementation withholds provider links and asks admissions for clarification.
6. In the clearly marked fictional threshold illustration, change only a hypothetical overall score. Explain why a low individual band can still prevent meeting the listed threshold. The actual approved profile remains unchanged. Real complex source rules may remain unknown in both scenarios; do not relabel synthetic rules as official evidence to obtain a more impressive result.
7. Switch English → Dari → Pashto. Show RTL, preserved profile and the same canonical status. Delete the synthetic document and show linked current facts disappear.
8. State what remains unverified: real Meta until an actual response is recorded; issuer authenticity; human translation quality; broad admissions-rule coverage; public deployment. Do not call the whole mission complete merely because offline checks pass.

## Live evidence collection

The opt-in runner npm run test:live requires BURSYAR_LIVE_TEST=1 and a securely provisioned approved Firebase token. Prefer the normal browser sign-in journey to manual tokens. Do not extract browser storage or print tokens. The runner fetches official Oxford Clarendon text and never passes its expected answer metadata to the model. Direct Oxford retrieval returned unavailable in this session; do not silently replace it with an unofficial mirror. Official page content was separately readable through web browsing.

Record the actual model, evidence digest, provider response success, latency and provider-reported token counts. The adapter emits allowlisted counts/latency only; it records costUSD:null because billed currency is not returned by the implemented contract. Never convert reservation units into dollars. Retain public scholarship output and the redacted live report for semantic/human translation review. A missing report or blocked runner is NOT a successful inference. A successful schema check alone is not semantic validation.

## Submission checklist

1. Resolve desktop access and spending-attestation gates; verify real Google sign-in and revocation without changing permissions unless separately authorized.
2. Run and review at least one real Meta interpretation of official scholarship evidence. Expand compiler coverage for the chosen real demonstration if it otherwise produces only unknown results. Keep supported and unsupported coverage explicit.
3. Obtain fluent English/Dari/Pashto review, record corrections and reviewer approval in docs/TRANSLATION-REVIEW.json. Do not automatically mark reviewed.
4. Record a screen demonstration using synthetic applicant documents and public scholarship requirements. Collect actual latency/token results; obtain actual billed cost only from an authorized billing view if available.
5. Review draft PR #8 into main, then #9. Retarget #9 to main after #8 merges if necessary. Both have reconciled main ancestry; no PR was merged by this mission. Re-run CI on any subsequent changes.
6. Confirm the actual hackathon portal, deadline/timezone, eligibility, Meta-use proof requirements, repository-access policy and required assets with the owner. Prepare the submission description from the verified features above, repository/PR URLs, architecture explanation, evaluation report and video. Do not claim a live capability until its gate is met.
7. Owner submits through the official portal. Public deployment remains a separate owner approval. A local demo and draft PRs are not a public deployment or a filed submission.

## Recovery

No existing Keychain record, credentials, production rules, account permissions, billing or quota records were modified by this mission. Existing running services were left alone. Local installation used a dedicated /tmp npm cache, Java and browser runtime. Temporary runtime files may disappear after reboot; rerun normal setup or CI.

Remote checkpoint before mission: PR #9 dc3bcdf852599080c6642b1f3bd3d4da85f9054b; PR #8 872add46a06e538dcce1cac383db4a8944d093c0. Keep history, prefer revert commits if code rollback is required. Do not reset or delete the quota DB to recover from a code error. Back up existing private files only through an owner-approved private procedure; never into Git or submission artifacts. Deletion removes current application access and linked facts; it does not promise forensic erasure of owner backups.
