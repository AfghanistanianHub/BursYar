# Hackathon release handoff — one integrated candidate (Draft, unmerged)

Date: 2026-11-01 (finalized over 2026-10-31..11-01). No deployment, submission,
billing change, paid inference call, or secret access beyond redacted local
diagnostics. No credentials are recorded in this file.

## Release branch and exact commits

- Branch: `release/hackathon-rc-2026-10-31` (isolated; source PR branches untouched;
  `main` not merged). Draft release PR: #35 (`release/hackathon-rc-2026-10-31` →
  `main`).
- Baseline: `4358b6f3255017d838abfcc35dca98c808a79b52` (PR #34 head).
- Integration stack (code):
  1. `0415cee592b9945f74d321fcb421fdda13a9981c` — merge PR #30 head
     `38478c56def1061fdc89efa8cbb11bb829c71f65` (GPA/TOEFL UI + acceptance docs).
  2. `12336d891e7e972398cb04e99c3271ae06e2bfac` — merge PR #33 head
     `2b09591d9aee7fe4d83db150524f5c36f9fd5fdd` (journey navigation frontend).
  3. `c90a3b54013fe53880be5a9bc376738f25a05964` — reconciliation: drop unreachable
     duplicate GPA/TOEFL evaluator blocks; README release note.
  4. `3a1481d445811449a9c20912ddbcf0ad8b73d297` — CODE-FREEZE head: restore
     `src/main.js` tail dropped during conflict resolution.
- Docs on top (no code changes): `54a1bff8` (handoff v1), `1dd428e` (PR-number note),
  plus this final handoff update. `git diff 3a1481d..HEAD --stat` shows only
  `docs/HACKATHON-RELEASE-HANDOFF.md`, so every local result recorded against
  `3a1481d` applies to the final code tree.
- The final pushed tip SHA and its exact-head CI evidence are recorded in the PR #35
  description after the last commit (avoids a documentation-commit loop).
- `main` (`68d72f5`) adds zero content over this lineage: `git diff 3dd9187 68d72f5`
  is empty (the PR #8 merge kept the reconciled tree), and `3dd9187` is an ancestor
  of this branch. No main-reconciliation debt.

## Final integration decisions

- Baseline is #34 (superset: shared Mission 01 security base `4adf12a` plus Mission 02
  evidence work). #30 contributed only its 7 post-base commits (academic evidence
  form, score-form bounds, acceptance/release-gate docs); its transfer-security base
  was already shared history. #33 contributed the frontend layer.
- `src/main.js` conflict (both branches edited the one template line): kept BOTH the
  `#academic-evidence-mount` (#30) and `#journey-nav-mount` (#33) divs with both mount
  calls. Kept the explicit `فارسی / دری` language label (no test pins either label;
  matches `src/i18n.js` Dari wording).
- `docs/checkpoints/mission-02-integrated.md` add/add conflict: kept the #34 text. The
  #33 copy is a byte-identical older prefix; the #34-only sections describe
  `engine/source-provenance.js` and `engine/reviewed-alternatives.js`, which are in
  this release. Historical checkpoint docs were otherwise left untouched.
- `engine/eligibility.js`: #33 had re-added byte-identical `minimum_gpa`/`toefl_ibt`
  blocks already present in the shared base; the first matching branch always returns,
  so the copies were unreachable. Removed the duplicates; no behavior change.
- Verified no duplicated endpoints: every `/api/*` path+method pair is defined once
  in `engine/http.js`. Verified no duplicated tests: both #30 transfer regressions
  (document-only collision, history non-replay) are present exactly once — #34's head
  commit had already incorporated equivalent checks. `src/pathfinder.js`,
  `tests/evidence-challenge.test.js`, and `tests/pathfinder-assessment.test.js` are
  byte-identical between #34 and #33. #33's `local-workflow.js` messaging
  (`bursyar:local-next`) and #34's `gap-actions.js` are complementary layers, not
  duplicates (separate consumers, no shared import).
- Repair (committed on this branch, never on source PRs): the #33 merge resolution
  initially truncated `src/main.js` after the template line (listeners, mounts,
  `render()` lost). Caught by the repo's own `tests/academic-evidence-ui.test.js`;
  tail rebuilt from #33 plus the #30 academic-evidence mount line; test passes.
- No new regression tests were added: the existing suite already caught the one
  real integration defect (above), and every preserved behavior below is covered by
  committed tests that pass on the exact head.

## Preserved behaviors (re-verified in the final tree)

- Transfer tombstones + transactional writes: `majority_transfers` immutable
  source-scope record, `isTransferred()` enforced in `assertWritable()` on direct
  mutators and as HTTP 403 (`engine/http.js`), `BEGIN IMMEDIATE` with rollback.
- Trusted provider/privacy policy + deny-before-quota: `engine/trusted-policy.js`
  resolver evaluated before prompts, quota reservation, or provider calls
  (`engine/http.js`: policy → adapter → `canInfer` → quota → infer).
- Consent-gated private GPA/TOEFL editing: `src/academic-evidence-form.js` requires
  the consent checkbox for save AND clear, locks `issuer_verified` facts, writes only
  via authenticated `/api/profile` with `consent:true`, and test coverage asserts
  manual edits stay `user_declared`/`not_verified`.
- Source integrity, freshness, conservative alternatives: `sourceAudits`,
  `invalid_freshness_metadata`, fail-closed `ask_alternative`; `reviewed-alternatives`
  is code-complete but NOT activated on the public path (no institutional catalog
  provisioned — by design).
- Four-step en/fa/ps navigation, RTL, stale-result invalidation:
  `src/journey-navigation.js` (profile → source → assessment → next; never reads
  student data), `dir` switching, `publish(null)` invalidation on every edit path.
- URL recovery, document review, quotas, evidence validation: unchanged modules,
  covered by the suite (217 tests) and the emulator job.
- `src/main.js` final state: 49 lines, `node --check` clean, all 7 mount calls
  present exactly once each (`mountEligibility` twice: initial + `bursyar:compilation`
  handler — correct), both document-level event handlers, ends with `render()`.

## Local results (code tree `3a1481d`; docs-only delta to final tip)

Counts below were executed 2026-10-31 against `3a1481d` and are supported by saved
run logs; they were not rerun (code unchanged since, and exact-head CI re-verified
the gates — see next section).

- `npm test`: 217/217 pass, 0 fail, 0 skip. (Sandboxed runs show 22
  `listen EPERM 127.0.0.1` failures — a sandbox loopback restriction, not a defect.)
- `npm run test:evaluation`: 51/51 pass, `passed:true`, mode
  `OFFLINE_EXCERPT_FIXTURES_NOT_LIVE_META` (`liveMetaVerified:false`, no semantic
  model accuracy claim).
- `npm run build`: passes; emits gitignored `dist/` with local WOFF2 subsets.
- `npm run test:browser`: 15/15 pass, mode `BROWSER_WITH_MOCK_AUTH_AND_API`
  (`liveMetaVerified:false`, `liveGoogleSignInVerified:false`); axe
  wcag2a/wcag2aa/wcag21aa assertions hold with zero violations.
- `node verification/typography-probe.mjs`: 6/6 pass, zero external font requests.
- macOS helper: `swiftc` compiles (one pre-existing deprecation warning);
  `BursYarKeychain self-test` passes. Local `status` differs from a clean CI runner
  only because this Mac already holds a BursYar Keychain entry.
- `npm run test:emulator`: not run locally (no Java runtime on this machine).
  Covered by the CI `emulator` job on the exact head. Neither the merge nor the
  reconciliation touched `firestore.rules` or `verification/emulator.mjs`.
- Environment note: local `npm ci` first failed on a root-owned file in
  `~/.npm/_cacache` (pre-existing machine state); reran with a clean `--cache` dir
  and succeeded. `node_modules/` matches the committed lockfile.

## Exact-head CI evidence

- Run `41252791907` on head `1dd428e` (code-identical to final tip; only this handoff
  differs): **verify SUCCESS** (`npm ci` + `npm test` + evaluation + build),
  **emulator SUCCESS** (47-check suite incl. Firestore rules — the gate not run
  locally), **browser SUCCESS** (Playwright + axe + artifacts),
  **macos-helper CANCELLED by GitHub: scheduled macOS 14 runner-image brownout**
  (image retires 2026-11-02; annotation links the vendor migration notice).
  Run: `https://github.com/AfghanistanianHub/BursYar/actions/runs/41252791907`
- The macos-helper cancellation is infrastructure, not a code failure; the workflow
  was NOT edited to dodge it, and the identical helper checks pass locally (above).
  Final-tip rerun status is recorded in the PR #35 description/checks section.
- Source-PR CI claims (#30/#34/#33) were never treated as validation of this head.
- Comment triage (complete): zero review comments and zero reviews on #30, #33, #35;
  PR #34 has three owner-authored technical checkpoint comments (verification status
  + approval checklists, Oct 30) — no change requests, no Bugbot findings. Nothing
  actionable outstanding beyond the gates listed below.

## Outstanding defects and environment dependencies

1. Live Meta inference is unverified end to end. Prior live evidence: one client
   timeout and one HTTP 200 / `finish_reason=length` (correctly rejected as
   `provider_truncated`) against `muse-spark-1.3` — provider reachability shown, but
   no validated analysis. A NEW explicit owner authorization is required for the next
   test; earlier authorizations do not carry over.
2. App-side spending confirmation: RESOLVED since the earlier DISABLED report.
   `npm run check:mac` on 2026-11-01 (redacted output, no secrets) reports
   `spendingConfirmed:true, savedSpendingLimitUSD:5, confirmationTimestampValid:true,
   backendSpendingConfirmed:true`. The owner's Meta-dashboard $5 cap itself remains
   owner-reported and unverified by this work.
3. Launcher scope limit (verified in code): `start-bursyar.command` /
   `verification/macos-start.mjs` build a scrubbed child environment that does NOT
   forward `BURSYAR_PROVIDER_CONFIG` / `BURSYAR_POLICY_RECORDS` (only
   `META_TIMEOUT_MS` is inherited). A launcher-started backend therefore serves the
   deterministic UI plus documents/quotas, but `/api/analyze` can only reach live
   inference via a manual `start:engine` process with owner-provisioned config files
   (see procedure). Changing launcher inheritance is a security-sensitive owner
   decision — not changed here.
4. Human Farsi/Pashto review outstanding; all new translations remain UNREVIEWED.
5. No authenticated institutional catalog provisioned; official-source approval and
   guardian/privacy sign-off outstanding. PR stays Draft.
6. `origin/release/candidate-2026-10-29` is a stale lineage (predates shared base
   `1c1016b`); superseded as the release vehicle, left untouched.

## Superseded by this candidate (none closed by this work)

- Draft PR #30 (`integration/mission-01-secure-reconciliation` @ `38478c5`): fully
  contained (shared base + merged UI/docs).
- Draft PR #34 (`integration/mission-02-final-rebase` @ `4358b6f`): fully contained
  (baseline).
- Draft PR #33 (`feat/mission-04-journey-navigation` @ `2b09591`): fully contained
  (merged frontend).
- `origin/release/candidate-2026-10-29`: superseded as the release vehicle.
- Closing/superseding the source PRs is an owner decision after this candidate is
  accepted. PRs #25/#26/#27/#29 and the #9/#8 stack are untouched.

## Exact startup procedure (owner's Intel Mac, macOS 13.7.8 — verified here)

Prerequisites (all verified present/working on this machine on 2026-11-01 unless
noted): Node >=24.12 (`node --version` → v24.13.0 here; the wrapper refuses older
with `Node.js 24.12 or newer is required.`); checkout at the release branch with
`npm ci` completed; `~/.bursyar-private/` containing owner-only mode-600
`firebase-admin.json` and `quota.sqlite` (startup refuses missing files/symlinks and
never creates a replacement quota DB); login-Keychain entry (service
`ai.bursyar.demo`) with Meta key, model ID, and the $5 spending attestation
(confirmed present by redacted `check:mac`); Xcode Command Line Tools for the
first-run Swift helper compile (helper already built here; digest stamp matches, so
no rebuild occurs); loopback ports 8080/5173 free (launcher probes and fails with
`Port N is occupied; stop only the existing BursYar process first`).

Deterministic startup (no inference possible; safe to run any time):

```sh
cd ~/Documents/BursYar
git fetch origin
git switch release/hackathon-rc-2026-10-31
git rev-parse HEAD   # record the SHA you are starting
npm ci
npm run check:mac    # redacted: files present, spendingConfirmed, backend mapping
./start-bursyar.command
```

Expected: `meta_model_access_verified` (account model-catalog access — proves model
access only, NOT inference), `Spending confirmation loaded: USD 5 account cap;
manual inference only.`, `BursYar ready at http://localhost:5173`. `GET /health`
means process liveness only. Ctrl+C stops both services. Startup makes no inference
call and performs no retry. Verified offline here: missing-env startup fails
closed with `Existing environment missing FIREBASE_PROJECT_ID` (exit 1, no network
attempt); a full positive start was deliberately not executed by this task (it would
spawn credential-bearing processes and contact Meta with the owner's key).

If the launcher reports `Live inference DISABLED: account spending limit is not
confirmed`, the local Keychain attestation is missing/false — the Meta-dashboard cap
alone never satisfies the backend gate, which requires `BURSYAR_SPENDING_CONFIRMED=1`
plus a positive finite `BURSYAR_SPEND_LIMIT_USD` plus a valid
`BURSYAR_SPENDING_CONFIRMED_AT`. After verifying the external cap, fix it in a
logged-in Terminal without re-entering secrets:

```sh
./start-bursyar.command --confirm-spending-usd 5
```

This patches only the three attestation fields, reads back a redacted verification,
and starts the app. (Not currently needed: attestation already confirmed, item 2.)

OSStatus -67674 from any helper command means the calling process cannot use Keychain
services — not a missing credential. Run the launcher in a normal logged-in Terminal;
do not re-enter credentials or reset the Keychain.

## Next live-verification procedure and remaining prerequisites

Do NOT run this until the owner gives a NEW explicit authorization for exactly one
paid test. Earlier Oxford authorizations do not carry over, and starting the app
never authorizes inference.

Remaining prerequisites (all owner-side): (a) `BURSYAR_PROVIDER_CONFIG` owner-only
JSON with a `meta` entry: `enabled:true, provider:'meta', model:<exact
account-enabled ID>, models:[...model], regions:[...]`, `audience:'adult_only'`,
`termsReviewed:true`, future-epoch `termsValidUntil`, `privacyReviewed:true`,
`consentVersion`, `dataClasses` incl `user_content`, `maxReservationUnits`,
`costReviewed:true`, positive `worstCaseUsdPerUnit`, `spendLimitUSD:5`,
`spendingApproved:true`. (b) `BURSYAR_POLICY_RECORDS` owner-only JSON with a record
for the demo UID: matching `uid/subjectId`, `provider:'meta'`, allowed two-letter
`country` (AF/BY/CN/IR/PK/RU/UA and others are hard-denied for Meta),
`jurisdictionDecision:'allowed'`, `locationVerified/ageVerified/subjectAgeVerified:
true`, adult age bands, active consent matching `consentVersion`/`provider`/
`subjectId`, and a current `verifiedAt`/`expiresAt` window ≤24h, `revoked!==true`.
(c) Firebase: project `afghanistanian-scholarships`, Google provider on, localhost
authorized, demo account granted `bursyarDemo:true` via trusted Admin tooling, fresh
ID token. (d) Because of the launcher scope limit (item 3), start the backend
manually with the full owner environment (`BURSYAR_PROVIDER_CONFIG`,
`BURSYAR_POLICY_RECORDS`, quota caps, `BURSYAR_ORIGIN`, `PORT`) via
`npm run start:engine` plus `npm run dev` in a second terminal — not via
`start-bursyar.command` — or first resolve launcher inheritance as an owner
decision. (e) Request-shape fields are code-pinned in this tree (low reasoning,
`json_schema`, `bursyar_evidence_v1`, 4000 completion cap, max 4 criteria); note the
release backend does not print a `meta_configuration` line at startup, so confirm
model/timeout from the Keychain-saved model + `META_TIMEOUT_MS` and the
`meta_model_access_verified` preflight, and confirm the pinned fields in the
post-test `meta_response` diagnostic.

Shortest exact procedure (adapted from `docs/META-TRUNCATION-INVESTIGATION.md` for
this branch; never both UI and `test:live` for the single test):

1. Check out the release branch at the recorded SHA; do not force-reset quota files.
2. Start services per (d); confirm the model-access preflight and the USD 5 spending
   line. Startup performs no inference.
3. Sign in with the approved Google demo account. Use ONLY public Oxford Clarendon
   applicant text from
   `https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants`
   (preferably the same text as the earlier attempt) and enter that exact official
   URL. Stay within the 30..12000 code-unit bound. No personal documents, expected
   answers, or artificial threshold sentences. Synthetic adult profile only.
4. On the fresh explicit authorization, press Prepare analysis exactly ONCE. Never
   resubmit after failure/timeout/quota, never run a second smoke runner or fallback.
5. Passing evidence: a real `meta_response` with `finishReason: stop`, then
   `analysis_validated` with the SAME `requestId`, plus a UI response containing the
   source digest, exact original excerpts, and nonempty criteria. Fee evidence must
   quote the supplied text; deadline stays source-grounded or null. Inspect all three
   language views without resubmitting. Results stay unreviewed and explicitly
   partial; unknown is acceptable and is not an award decision.
6. Record only redacted `requestId`, finish/status, timing, prompt/completion/
   reasoning counts, evidence-check result, and source digest. Never export HARs,
   tokens, credentials, raw output, or private documents. Never invent cost from
   workload units. If `length` recurs, keep its counters and stop.

Distinguish: model access (catalog check) ≠ startup health (`/health`, UI loads) ≠
successful inference (`meta_response` stop + `analysis_validated`, same requestId).
None proves the others. Endpoint/model inspected without secrets:
`POST https://api.meta.ai/v1/chat/completions`, configured model ID from the
Keychain record (server default when config omits it: `muse-spark-1.3`; previously
observed live model: `muse-spark-1.3`).
