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
- Run `41258158988` on tip `8f87c9a`: **all four jobs SUCCESS**.
  Run: `https://github.com/AfghanistanianHub/BursYar/actions/runs/41258158988`
- Run `41265914737` on head `973a519` (launcher fix): **all four jobs SUCCESS**
  (verify incl. 4 new regression tests, emulator, browser, macos-helper).
  Run: `https://github.com/AfghanistanianHub/BursYar/actions/runs/41265914737`
- The earlier macos-helper cancellation was infrastructure, not a code failure; the
  workflow was NOT edited to dodge it. Final-tip status is recorded in the PR #35
  description/checks section.
- Source-PR CI claims (#30/#34/#33) were never treated as validation of this head.
- Comment triage (complete): zero review comments and zero reviews on #30, #33, #35;
  PR #34 has three owner-authored technical checkpoint comments (verification status
  + approval checklists, Oct 30) — no change requests, no Bugbot findings. Nothing
  actionable outstanding beyond the gates listed below.

## Live-verification preparation (2026-11-01, no inference made)

- Launcher fix `973a519` (CI-green above): `verification/macos-start.mjs` now
  forwards exactly `BURSYAR_PROVIDER_CONFIG` and `BURSYAR_POLICY_RECORDS`,
  path-only, each validated as an absolute owner-only mode-600 regular file (fail
  closed otherwise). All other parent variables stay dropped; nothing is read,
  logged, or printed. `check:mac` reports forwarding booleans. 4 focused regression
  tests added (`verification/macos-config.test.js`); deterministic-only startup
  without the files is unchanged. Verified live here: absent→flags false;
  unsafe path→actionable exit-1; valid 600 file→flags true.
- Configured model established via redacted Keychain read (helper output parsed in
  memory; only the model ID reported, key never printed): **`muse-spark-1.3`** —
  BursYar's API model, unrelated to any coding-session model. Key present; $5
  spending attestation still confirmed with valid timestamp.
- Demo UID + claim established via read-only Firebase Admin `listUsers` (first user
  matched, scan stopped; nothing else printed): exactly one account carries
  `bursyarDemo:true`; no claim changes made or needed. The UID is stored ONLY in the
  local owner-only policy file, never in this repo or logs.
- Official Meta terms consulted (live docs, not third parties):
  - Pricing: `muse-spark-1.3` Standard = $1.25/1M input, $4.25/1M output tokens
    ([pricing](https://dev.meta.ai/docs/pricing-rate-limits)).
  - Standard mode content is NOT used to train Meta models; Contributor mode may be,
    at lower prices ([pricing](https://dev.meta.ai/docs/pricing-rate-limits),
    [models](https://dev.meta.ai/docs/models), Terms §5.1/§6).
    This test uses the Standard model ID only.
  - Age: Terms §10.1 requires operators and End Users to be 18+; no products
    targeted at under-18s ([terms](https://dev.meta.ai/legal/terms-of-service)).
    Owner states they are the adult operator in Canada; the test subject stays
    explicitly synthetic and adult. Recorded as owner statements, not independent
    identity/age verification.
  - Geography: Canada is not restricted. Restricted Territories include Afghanistan
    ([geo policy](https://dev.meta.ai/legal/geographic-use-policy) §3): the repo's
    country set was verified conservative relative to official terms (it denies all
    of UA where official terms restrict only Crimea/Donetsk/Luhansk — deliberate,
    documented in code). This single test has no End User in a restricted territory
    (operator in CA, synthetic subject). PRODUCT-LEVEL FLAG (unresolved, out of
    scope for this test): serving real Afghan-located end users through Meta would
    violate geo-policy §3; that traffic must stay on the deterministic/self-hosted
    path unless Meta authorization says otherwise.
- Spending math from the implementation's unit definition (reservation units =
  request UTF-8 bytes + 4000; `engine/meta-request.js`): worst case 1 unit ≈ 1
  billable token, so worstCaseUsdPerUnit = $4.25/1M = **0.00000425**. Lifetime cap =
  floor(5/0.00000425) = 1,176,470 → min(200000) = **200000 units**: the $5 cap can
  never bind before the quota cap. Estimated single-test cost ≈ $0.01–0.03
  (estimate only; the backend records `costUSD:null` by design — provider-reported
  usage counts, not dollars, will be captured from `meta_response`).
- No-retry posture verified: no automatic inference retry exists in the request path
  (the only "retry" string is a 429 message asking the client to retry later).
  Operational rule stands: exactly one submit; on failure/timeout, stop and diagnose
  from redacted evidence.
- Config templates + an offline validator using the real loaders/gates are prepared
  and synthetic-proven in both directions (accept valid shape, reject placeholders).
  Real files are NOT yet written: `termsReviewed`, `privacyReviewed`, `costReviewed`,
  `spendingApproved`, consent, and age/location flags require the owner's
  consolidated informed confirmation. Nothing is pre-marked true.
- Remaining owner actions (minimal): (1) answer the single consolidated confirmation
  (terms/privacy/cost/consent/attestation meanings + $5 cap re-affirmed); (2) Google
  sign-in in the browser (cannot be delegated) and exactly one Oxford submit per the
  procedure below. Backend logs are readable from here after startup, so no manual
  log-copying is needed.

## Launcher/server agreement repair (2026-11-01, code + offline checks only)

Audit finding: `engine/server.js` requires trusted provider configuration and
user-policy records, while the launcher path primarily supported the earlier
key/spending-attestation startup — a launcher could report readiness while the
current server had no enabled inference provider. Traced
`start-bursyar.command` → `macos-start` → `start-demo` → `server` → trusted
policy (`engine/trusted-policy.js` + `engine/provider-policy.js` gateway order:
policy → adapter → `canInfer` → quota → infer) → per-provider `QuotaStore`.

Repair (same release branch, no new branch/PR; Keychain, private ADC, document
DB, quota DB, and the USD 5 cap untouched — no resets, no credential writes):

- `engine/capabilities.js` (new): pure, secret-free capability report — local
  assessment available; source retrieval / document storage available or
  unavailable; Meta `configured` / `disabled` / `blocked` with a safe actionable
  reason. `inferenceVerified:false` always; health/catalog never imply success.
- `engine/server.js` + `engine/http.js`: the server computes capabilities from
  its real state (provider config presence/enablement, adapter availability,
  spending confirmation + `spendingApproved`, policy-records presence, family
  grants, documents, catalog) and serves them on unauthenticated `GET /health`
  as `{ok:true, capabilities}` (`{ok:true}` unchanged when absent, so existing
  consumers keep working).
- `verification/demo-readiness.mjs` (new) + `verification/start-demo.mjs`: Meta
  catalog check is now advisory — missing keys or any catalog failure degrade
  to deterministic-only startup instead of blocking local features. After the
  backend is up, the launcher reads `/health` capabilities and prints them plus
  `Inference verified: false`; the ready line is explicitly labeled
  `ready (deterministic-only)` unless Meta is configured.
- `verification/macos-start.mjs` `check`: adds `deterministicReady`,
  `deterministicOnlyExpected`, and `forwardingReason` (forwarding is necessary
  but not sufficient; backend + per-request policy still validate).
- `verification/live-demo.mjs`: opt-in E2E now runs the full journey — approved
  ID token (from a real Google sign-in) → official Oxford text → explicit
  gateway source approval (server-fetched receipt, `user_supplied` import
  fallback) → exactly one `/api/analyze` with `receipt` + `sourceApproved:true`
  → evidence validation. Records code version, latency, receipt kind,
  validation outcome, and source digest; requestId/model/token counts correlate
  from the backend `meta_response` + `analysis_validated` log pair. Mode stays
  `REAL_GATEWAY_AND_META_REQUIRED` (`fixture:false`), strictly distinct from
  `BROWSER_WITH_MOCK_AUTH_AND_API` fixtures. No retries, no model/provider
  switching, no cost estimates, no secrets logged.
- Regression coverage (14 new tests, all passing): `engine/capabilities.test.js`
  (missing config, every disabled/blocked reason, configured-still-requires-policy,
  formatting truthfulness), `verification/demo-readiness.test.js` (deterministic
  catalog skip, readiness messaging, deterministic-only labeling),
  `tests/runtime-readiness.test.js` (`/health` capabilities unauthenticated,
  missing/expired/revoked policy denial before provider/quota, missing-adapter
  503, unconfirmed-spending 503).

Offline verification on this tree: `npm test` 235/235 pass;
`npm run test:evaluation` 51/51 (`OFFLINE_EXCERPT_FIXTURES_NOT_LIVE_META`);
`npm run build` passes; `node verification/live-demo.mjs` without the gate exits
1 with a safe blocker and no network; a real `engine/server.js` deterministic
probe (no key, no provider/policy config) serves `/health` with
`Meta disabled (provider_config_missing)`, `deterministicOnly:true`, and
`401` on unauthenticated `/api/analyze`. No live inference was attempted: no
explicitly authorized live-test scope, credentials, or trustworthy policy
evidence exists in this session.

ONE owner action for the remaining live step: reply with the consolidated
confirmation (terms/privacy/cost meanings + USD 5 cap re-affirmed + consent and
adult-operator attestation for exactly one Oxford submit), then perform the
single Google sign-in + one Prepare-analysis submit per the procedure below.

## Outstanding defects and environment dependencies

1. Live Meta inference is unverified end to end on the current runtime.
   Historical fact preserved: Checkpoint 15 records one owner-supplied
   successful `muse-spark-1.3` request (`stop` + `analysis_validated`, same
   requestId) on an earlier implementation; it does not certify the current
   runtime. On recent attempts: one client timeout and one HTTP 200 /
   `finish_reason=length` (correctly rejected as `provider_truncated`) —
   provider reachability shown, but no validated analysis on this tree. No
   standing live-test authorization exists in this session; the consolidated
   terms/consent confirmation and the single opt-in submit below remain.
2. App-side spending confirmation: RESOLVED since the earlier DISABLED report.
   `npm run check:mac` on 2026-11-01 (redacted output, no secrets) reports
   `spendingConfirmed:true, savedSpendingLimitUSD:5, confirmationTimestampValid:true,
   backendSpendingConfirmed:true`. The owner's Meta-dashboard $5 cap itself remains
   owner-reported and unverified by this work.
3. Launcher/provider handoff: RESOLVED by `973a519` plus this update. The Mac
   launcher forwards exactly `BURSYAR_PROVIDER_CONFIG` / `BURSYAR_POLICY_RECORDS`
   as validated absolute owner-only mode-600 paths (all other parent variables
   stay dropped). The backend validates enablement, reviewed spending bounds,
   and per-request trusted policy; without them it serves deterministic-only and
   now says so explicitly (`Meta disabled/blocked` + actionable reason on
   `/health` and in launcher output). The manual `start:engine` procedure below
   remains valid; a launcher start with the two variables exported in the
   launching shell now reaches the same backend gates. No fake age, location,
   consent, contractual-clearance, or guardian-authority values were generated;
   provisioning those records remains an explicit owner attestation.
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

## UI defect repair (2026-11-01, same release branch, no inference)

Serving identity (established before any fix): `localhost:5173` is PID 1611
`node verification/start-demo.mjs`, cwd `/Users/sayadalimousaviazad/Documents/BursYar`,
embedding Vite (frontend) plus PID 1612 `node engine/server.js` (backend).
At inspection, local `HEAD`, `origin/release/hackathon-rc-2026-10-31`, and PR #35
`headRefOid` were all `12c48b9fb7796339df4381b92316e0fd80a2872e` — the defects
were in the tree, not a cache or branch mismatch. No branch switch was needed
for diagnosis.

Design reference: none accessible. `docs/checkpoints/mission-04-frontend.md`
records Figma Mission 03 blocked by the Starter-plan tool-call limit with
explicit instruction to reuse current UI tokens. No new brand direction was
introduced and no visual-parity claim is made. Implemented on this branch:
journey navigation structure, account dropdown structure, source-entry flow,
RTL layout and font subsets. Unfinished/incorrect until this repair: step
numbering, popover dismiss behavior, auth-button toggle, source→analysis
progression clarity.

Fix commit `aaa00ec` ("journey: numbered steps, account popover behavior and
source progression"), 8 files, +66/−15:
- `src/journey-navigation.js`/`.css`: removed duplicated `1.`/`۱.` prefixes
  from en/fa/ps copy; numerals now come only from the `<ol>` with
  `decimal` (en) / `persian` (fa/ps) list styling.
- `src/auth.js` + `src/analyzer.js`: new `onAuthChange` helper drives
  sign-in/sign-out visibility (exactly one shown); account `<details>`
  dismisses on outside click and Escape with focus return. No auto-sign-in,
  no token logging.
- `src/source-preview.js` + `src/style.css`: always-visible 3-step
  progression list (`#source-progression`, `aria-current`, decimal/persian)
  plus focus move to the reviewed source after fetch. Approval checkbox and
  `submit.disabled=busy||!approval.checked` gating unchanged; consent,
  source approval, privacy and quota paths untouched. New fa/ps step strings
  are UNREVIEWED (same standing gate as all other translations).
- `verification/browser.mjs`: mock auth module exports `onAuthChange`.
- `tests/journey-account-progression.test.js`: 3 static regression tests.

Verification on this tree (all without live inference; submit never clicked
and fetch attempted only unsigned, stopping at the client auth gate):
- `npm test`: 238/238 pass (235 existing + 3 new), 0 fail.
- `npm run build`: passes. `node verification/typography-probe.mjs`: 6/6,
  zero external font requests.
- `npm run test:browser`: 15/15 pass, `BROWSER_WITH_MOCK_AUTH_AND_API`
  (`liveMetaVerified:false`, `liveGoogleSignInVerified:false`), axe
  wcag2a/wcag2aa/wcag21aa zero violations.
- Headless real-server pass against `localhost:5173` (real engine, real
  Oxford URL input, synthetic manual text): 6/6 en/fa/ps × 1280/390 combos
  pass — single localized numerals, 0→1→2 progression with submit enabled
  only after approval, account closed-by-default with both dismiss paths,
  zero `/api/analyze` and zero `/api/source` requests, zero page errors,
  zero horizontal overflow. Mean page load 166 ms, mean language switch
  562 ms. Before/after/final screenshots retained under `/tmp`
  (`bursyar-before-*`, `bursyar-after-*`, `bursyar-final-*`) and every final
  image was read back before judging.
- Live-inference status: NOT consumed. Quota DB (read-only aggregates, no
  identities) shows the latest reservation buckets dated day 20755 /
  minute 29887346 vs now 20758 / 29891738 (~3 days stale; pruning only runs
  on reserve), lifetime 47147 cumulative from historical runs.
  `verification/artifacts/live-report.json` remains blocked/not-validated.
  The single authorized request is still untouched; no new authorization
  was created or exercised.

History note: during verification a concurrent session committed this same
tree as `2117fb4` on a local-only branch `feat/journey-account-progression`
and moved this checkout onto it; the peer was notified and that branch was
left untouched (never pushed). The release branch carries the identical
content as `aaa00ec` (`git diff 2117fb4 aaa00ec` empty). Push `aaa00ec` plus
this handoff commit together; record the new tip SHA and its exact-head CI
in the PR #35 description.

## Integration of #36–#38 (2026-11-01, same release branch, no inference)

All three PRs target this release branch, fork from `12c48b9`, arrived with
green exact-head CI and zero reviews/comments. Each was reviewed here
(heads, full diffs, tests, PR-body claims) and merged locally with
`--no-ff`, zero conflicts:
- `cd0a914` ← #36 `feat/backend-auth-security-hardening` @ `c6e0d10`
  (owner-only quota store, Firebase verifier reuse with project-mismatch
  refusal, referrer-policy + CSP hardening headers; +4 tests).
- `abde4d8` ← #37 `feat/frontend-multilingual-completion` @ `51de126`
  (explorer country/level localization + localized search, shell
  title/counts/numerals/close-label; +5 parity tests). New fa/ps strings
  UNREVIEWED per repo rule.
- `322f803` ← #38 `feat/matching-verification-pathfinder` @ `bda8505`
  (bounded GPA `x/4|5` + TOEFL iBT grammars in document parsing with
  discrepancy-on-duplicate, GPA/TOEFL review editors, PathFinder
  barrier/gap wiring in local assessment; +8 tests).
`aaa00ec` protections verified present after merge (persian numbering,
`onAuthChange` toggle, `#source-progression`, approval gating); local
`2117fb4` was not duplicated (not an ancestor; its branch left untouched).
Provider/privacy, consent, quota and evidence paths unchanged: prompt
boundary still `{untrustedSource: text}` only, no retry (sole "retry"
string is the 429 concurrency message), reservations kept on failure,
`documentedAlternative` null with the reviewed resolver off the public
path. Source PRs #36–#38 left OPEN for the owner (closing is an owner
decision, as with #30/#33/#34).

#36 operator note: the existing private files already satisfy the new
checks — verified by permission stat only (no contents read): dir
`~/.bursyar-private` 0700 uid-owned; `quota.sqlite`,
`provider-config.json`, `policy-records.json`, `firebase-admin.json` all
0600 uid-owned. The running demo server was NOT restarted (owner process);
the checks apply on the next owner restart, where they pass as-is.

Verification on the merged tree, evidence distinguished:
- LOCAL (this tree, real code, no mocks): `npm test` 255/255
  (235 + 4 + 5 + 8 + 3 UI-regression — the 255 figure is now confirmed on
  the release branch, not a scratch tree); `npm run build` passes;
  `npm run test:evaluation` 51/51 `OFFLINE_EXCERPT_FIXTURES_NOT_LIVE_META`;
  typography probe 6/6, zero external font requests.
- MOCKED: `npm run test:browser` 15/15 `BROWSER_WITH_MOCK_AUTH_AND_API`
  (`liveMetaVerified:false`, `liveGoogleSignInVerified:false`), axe
  wcag2a/wcag2aa/wcag21aa zero violations. Headless real-server render
  check en/fa/ps: single localized numerals, 3-step progression, localized
  explorer labels/counts/cards, documents mount present, zero page errors,
  zero overflow, zero `/api/*` requests (submit never clicked).
- EMULATOR: not run locally (no Java runtime); covered by CI `emulator`
  job on the exact head, as before.
- LIVE: nothing attempted and nothing consumed. Quota buckets still ~3
  days stale; `live-report.json` still blocked/not-validated. Redacted
  `npm run check:mac` on 2026-11-01: credentials present, quota DB exists,
  spending confirmed $5 with valid timestamp, `liveInferenceVerified:false`
  (forwarding flags false in the agent shell only — the demo server runs
  in its own credential-bearing shell). No setup repeated, no attestation
  invented, no inference requested.

Untracked `docs/HACKATHON-READINESS.md` (owner file, left in place and
uncommitted): §1 endpoint/params, §3 request-path privacy core, §4
budget/no-retry mechanics, §7 evidence checklist, §8–§9 fallback/story
verified still accurate against this tree (60000/120000/4000/low/
json_schema, prompt carries text only, no retry path). SUPERSEDED parts:
§3 "no age/region gate" (this tree has fail-closed trusted-policy gates),
§6 startup procedure (release backend prints no `meta_configuration`
line; use the live procedure in this handoff), §10 test counts and branch
(pre-date this release). Its accurate substance is preserved by reference
here; the file itself is untouched.

Inventory for the owner-directed visual redesign (descriptive only — the
redesign is NOT complete and no current UI is claimed as final):
- Navigable components with real behavior: 4-step journey nav; source
  URL→fetch→review→approve→`Prepare analysis` flow with receipts/digests;
  criteria/funding/deadline/uncertainty rendering with excerpts;
  tri-state eligibility + hypothetical scenarios; deterministic local
  assessment with barrier/gap actions; document upload/review/delete
  (degree/IELTS/GPA/TOEFL bounded claims); profile + academic-evidence
  forms; account popover with Google sign-in/out.
- Real data available: user-pasted source text + server receipts/digests;
  local profile/document facts (`user_declared`/`document_extracted`,
  never verified); deterministic `/scholarships` + `/evaluate` API
  (currently only the synthetic-local-test fixture — no institutional
  catalog provisioned); Meta analysis only through an authorized live
  call (`requiresHumanReview:true`, partial by design).
- Explicitly NOT real: explorer listings are synthetic demo rows labeled
  unverified (no opportunity cards data source); no verification badges,
  scores, or statistics may be shown as authoritative; no inactive
  controls may be added. Redesign must keep consent, approval, privacy,
  quota and evidence-failure behavior intact.

Remaining blockers: fluent fa/ps review (scope grew: #37 labels +
progression steps); institutional reviewed catalog; guardian/privacy
sign-off; a NEW explicit live-inference authorization (none exists);
owner decisions on closing #30/#33/#34/#36/#37/#38. Push the three merges
plus this handoff commit together; record the final tip SHA and its
exact-head CI in the PR #35 description.

## Follow-up: redesign + review fixes onto main (2026-11-01, no inference)

PR #35 was merged by the owner at 2026-11-01T04:41:48Z (merge `5767260`,
head `fa10ebc`, which contains the #36–#38 integration). Main has since
moved on (hosted Render backend, same-origin API routing, keyless
Firebase caller checks, CTO research; see HOSTED-BACKEND.md,
KEYLESS-FIREBASE-AUTH.md, LIVE-DEMO-GATES.md). The "Draft, unmerged" and
"no deployment" statements above are therefore historical. This section
records the single authorized follow-up PR porting what the merge left
behind; no other release PR exists or is planned.

CORRECTION (carried from the release branch): the standing live-test
authorization EXISTS — one inference request plus consolidated
terms/consent confirmed by the owner and recorded in owner-only
`provider-config.json` + `policy-records.json`. Earlier "(none exists)"
claims are superseded. Validity checked 2026-11-01T10:05Z by structural
inspection only (no contents reproduced): provider attestation complete
with ~161h remaining; the policy record's 6h window EXPIRED at 09:17:38Z
(all flags still true, only time lapsed). The single genuinely expired
item is that window: renewal is the owner re-issuing the one record with
fresh verifiedAt/expiresAt (same subject, consent v1, jurisdiction) —
no questionnaire, no new authorization, no file edits by the agent
(none were made).

Ported onto latest main, preserving all main-side work (no src/ overlap:
main touched only engine/infra/docs/tests since `fa10ebc`):
- Full presentation redesign (`src/style.css`, `src/journey-navigation.css`):
  app shell, stepper nav, workspace grid, opportunity/research cards,
  tri-state color+dot+text, timeline journey, consent/approval UI —
  behavior-identical, zero backend scope, zero new dependencies.
- Codex P1 (academic scores remount on identity) + P2 (TOEFL type and
  sections preserved) with `tests/identity-toefl-fixes.test.js`.
- Mobile account-popover fit fix (anchors to header below 700px).
Not ported: the empty CI-retrigger commit, merge scaffolding, and the
release-branch-only PR #35 bookkeeping. Research styles merge cleanly
with the redesign (verified renders).

Verification on the follow-up head: full unit suite, production build,
mocked browser + research-browser suites with axe, and read-back
desktop/mobile screenshots across en/fa/ps RTL — all recorded in the
follow-up PR with its exact-head CI run. Zero live or paid inference;
quota untouched; hosted gates (no durable doc storage, no Meta
provisioning on hosted) unchanged.

Startup: local demo still runs only via `./start-bursyar.command`
(loopback backend + Vite); the backend/frontend pair must be restarted
through the launcher to pick up merged main code — never piecemeal.
Hosted frontend/backend deploy only through the owner's existing
Vercel/Render wiring; a merge alone does not deploy the backend (see
HOSTED-BACKEND.md). Record the follow-up PR number, its head SHA, the
exact-head CI run, and the post-merge main SHA in the PR description.

## Workspace UI implementation (2026-11-01, no inference)

MagicPath integration is unavailable in this environment (no skill, CLI,
config, or repo reference) and no export arrived, so per explicit owner
direction the approved light-workspace requirements were implemented
directly as the specification — sidebar navigation, compact headings,
restrained accents; the green hero banner is gone. No substitute brand,
no mockup, no disconnected prototype.

Change (CSS-only, zero template/ID/hook edits, all protections intact):
sticky slim topbar; compact page header; sticky nav sidebar on desktop
(mirrored in RTL) collapsing to stacked nav on mobile; single content
column of workspace panels; refined opportunity/research cards, filters,
evidence panels, tri-state pills, and PathFinder timeline; light footer.
New FA/PS strings: none. Research styles preserved and verified.

Verification on the branch: unit 293/293, build, mocked browser 15/15
axe-clean, research-browser en/fa/ps zero-POST, read-back desktop/mobile
screenshots across en/fa/ps (numbering, popover fit, cards, RTL mirror).
Live Meta: already passed on hosted (request 5a58bff8); no new calls per
the preserved one-request limit; policy-window renewal remains the only
live prerequisite. Demo: start via ./start-bursyar.command, open
http://localhost:5173 — journey: sign in → review profile/documents →
paste official URL → fetch → review → approve → Prepare analysis →
evidence/eligibility → PathFinder actions; deterministic fallback when
AI is unavailable; sign-out clears private panels. Roadmap (not built):
real opportunity catalog, fluent FA/PS review, Evidence Graph,
clarification flows, verified time/cost, issuer integrations, 2FA,
offline support. Record the PR number, head SHA, and exact-head CI run
in the PR description.

## Workspace UI landed on main (2026-11-01, no inference)

Follow-up PR #49 (https://github.com/AfghanistanianHub/BursYar/pull/49)
merged to main as 985e332 via merge commit (no bypass, no force-push).
PR head: 1f76a38 (single commit: workspace CSS + journey sidebar CSS +
implementation note). Exact-head CI run 41352661590: verify, emulator,
browser, macos-helper all SUCCESS; zero blocking review findings (no
inline comments posted). Post-merge main CI: see PR #49 description for
the run link and result.

Live Meta status: already passed on hosted infrastructure (authorized
request 5a58bff8, Oxford/Clarendon manual excerpt, validated evidence,
6089 units reserved under the owner-confirmed $50 ceiling). No new
inference was requested or consumed in this work; the one-request limit
stands. Only remaining live prerequisite: owner re-issue of the expired
policy-window timestamps when a live test is scheduled.

Startup procedure (local demo): run ./start-bursyar.command from a
logged-in macOS Terminal (doubles as the documented reboot path), open
http://localhost:5173. After this merge, stop the old launcher pair and
restart so both tiers serve main @ 985e332 or later; never start a
second pair or restart piecemeal. Hosted frontend/backend deploy only
through the owner's existing Vercel/Render wiring.
