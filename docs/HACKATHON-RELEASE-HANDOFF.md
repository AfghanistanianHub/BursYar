# Hackathon release handoff — one integrated candidate (Draft, unmerged)

Date: 2026-10-31. No deployment, submission, billing change, or paid inference call was made.

## Release branch and exact commits

- Branch: `release/hackathon-rc-2026-10-31` (isolated; source PR branches untouched; `main` not merged).
- Baseline: `4358b6f3255017d838abfcc35dca98c808a79b52` (PR #34 head, verified equal to the audit snapshot).
- Integration stack (all SHAs verified with `git rev-parse`):
  1. `0415cee592b9945f74d321fcb421fdda13a9981c` — merge PR #30 head
     `38478c56def1061fdc89efa8cbb11bb829c71f65` (GPA/TOEFL UI + acceptance docs).
  2. `12336d891e7e972398cb04e99c3271ae06e2bfac` — merge PR #33 head
     `2b09591d9aee7fe4d83db150524f5c36f9fd5fdd` (journey navigation frontend).
  3. `c90a3b54013fe53880be5a9bc376738f25a05964` — reconciliation: drop unreachable
     duplicate GPA/TOEFL evaluator blocks; README release note.
  4. `3a1481d445811449a9c20912ddbcf0ad8b73d297` — code-freeze head: restore `src/main.js`
     tail dropped during conflict resolution (see repairs).
- This handoff is committed on top of the code freeze; the exact pushed tip SHA and
  exact-head CI run links are recorded in the Draft release PR description.
- `main` (`68d72f5`) adds zero content over this lineage: `git diff 3dd9187 68d72f5`
  is empty (the PR #8 merge kept the reconciled tree), and `3dd9187` is an ancestor
  of this branch. No main-reconciliation debt.

## Integration decisions

- Baseline is #34 (superset: shared Mission 01 security base `4adf12a` plus Mission 02
  evidence work). #30 contributed only its 7 post-base commits (academic evidence form,
  score-form bounds, acceptance/release-gate docs); its transfer-security base was
  already shared history. #33 contributed the frontend layer.
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
- Verified no duplicated endpoints: every `/api/*` path+method pair is defined once in
  `engine/http.js`. Verified no duplicated tests: both #30 transfer regressions
  (document-only collision, history non-replay) are present exactly once — #34's head
  commit had already incorporated equivalent checks. `src/pathfinder.js`,
  `tests/evidence-challenge.test.js`, and `tests/pathfinder-assessment.test.js` are
  byte-identical between #34 and #33. #33's `local-workflow.js` messaging
  (`bursyar:local-next`) and #34's `gap-actions.js` are complementary layers, not
  duplicates (separate consumers, no shared import).
- Preserved behaviors (all verified in the merged tree): transfer tombstones and
  transactional write guards (`engine/majority-transfer.js`, `engine/documents.js`);
  trusted provider/privacy policy with deny-before-quota (`engine/trusted-policy.js`,
  `engine/http.js`); consent-gated private GPA/TOEFL editing that never promotes to
  issuer-verified (`src/academic-evidence-form.js`); source integrity/freshness
  auditing and conservative alternatives (`engine/source-provenance.js`,
  `engine/reviewed-alternatives.js`, `src/gap-actions.js`); four-step en/fa/ps
  navigation with RTL and stale-result invalidation (`src/journey-navigation.js`,
  `src/local-workflow.js`); URL recovery, document review, quotas, evidence
  validation (unchanged modules, covered by suite).

## Repairs during integration (all committed on this branch, none on source PRs)

- The #33 merge resolution initially truncated `src/main.js` after the template line
  (listeners, mounts, `render()` lost). Caught by the repo's own
  `tests/academic-evidence-ui.test.js`; tail rebuilt from #33 plus the #30
  academic-evidence mount line; test now passes.
- Local `npm ci` first failed on a root-owned file in `~/.npm/_cacache` (pre-existing
  machine state, unrelated to the repo); reran with `--cache /tmp/bursyar-npm-cache`
  and succeeded. `node_modules/` now matches the committed lockfile.

## Local results (this machine, code-freeze tree `3a1481d`)

- `npm test`: 217/217 pass, 0 fail. (Sandboxed runs show 22 `listen EPERM 127.0.0.1`
  failures; that is a sandbox restriction on loopback listeners, not a code defect.
  Counts above are from an unsandboxed run.)
- `npm run test:evaluation`: 51/51 checks pass, `passed:true`, mode
  `OFFLINE_EXCERPT_FIXTURES_NOT_LIVE_META` (`liveMetaVerified:false`, no semantic
  model accuracy claim).
- `npm run build`: passes; emits `dist/` (gitignored) with local WOFF2 subsets.
- `npm run test:browser`: 15/15 pass, mode `BROWSER_WITH_MOCK_AUTH_AND_API`
  (`liveMetaVerified:false`, `liveGoogleSignInVerified:false`); axe
  wcag2a/wcag2aa/wcag21aa assertions hold with zero violations; 65 artifacts under
  `verification/artifacts/` (gitignored).
- `node verification/typography-probe.mjs`: 6/6 pass, zero external font requests.
- macOS helper (same commands as CI job): `swiftc` compiles with one pre-existing
  deprecation warning; `BursYarKeychain self-test` passes; `status` exits 0 locally
  ("entry exists") instead of CI's expected 44 because this Mac already holds a
  BursYar Keychain entry. No secrets read; nothing deleted.
- `npm run test:emulator`: NOT run locally — no Java runtime on this machine and the
  Firestore/Auth emulators require one. Covered by the CI `emulator` job on the exact
  head (see below). Neither the merge nor the reconciliation touched `firestore.rules`
  or `verification/emulator.mjs`.

## CI evidence (exact head)

- CI was triggered by pushing this branch and opening the Draft release PR; the four
  jobs (`verify`, `emulator`, `browser`, `macos-helper` in `.github/workflows/web-checks.yml`)
  run `npm ci` + `npm test` + evaluation + build, emulator suite, Playwright + axe
  with artifact upload, and the Swift helper.
- Exact-head run URL(s) and per-job results: see the Draft release PR checks section.
  Do not accept green claims from the source PRs (#30/#34/#33) as validation of this
  combined head. At handoff time CI is pending; the babysit loop owns watching it to
  green (fix only failures in this PR's scope; never weaken security or CI gates).

## Unresolved defects and dependencies

1. PR review comments (including Bugbot) on #30/#34/#33 were NOT inspected: `gh`
   authentication is broken in this environment (`Failed to log in ... token is
   invalid`). Triage unresolved threads before merge; do not merge with open
   change requests.
2. Live Meta inference remains unverified end to end (pre-existing; HTTP 200 /
   `length` truncation event on record). One gated Oxford live test is authorized in
   `docs/META-TRUNCATION-INVESTIGATION.md`.
3. Human Farsi/Pashto translation review outstanding; all new translations are marked
   UNREVIEWED (pre-existing gate).
4. No authenticated institutional catalog is provisioned; `reviewed-alternatives`
   stays inactive on the public path by design; official-source approval outstanding.
5. `origin/release/candidate-2026-10-29` is a stale lineage (predates the shared base
   `1c1016b`); superseded by this branch, left untouched.
6. `main` needs no reconciliation (see above), but the eventual merge direction and
   review ownership for landing this candidate are undecided.

## Superseded by this candidate

- Draft PR #30 (`integration/mission-01-secure-reconciliation` @ `38478c5`): fully
  contained (shared base + merged UI/docs).
- Draft PR #34 (`integration/mission-02-final-rebase` @ `4358b6f`): fully contained
  (baseline).
- Draft PR #33 (`feat/mission-04-journey-navigation` @ `2b09591`): fully contained
  (merged frontend).
- `origin/release/candidate-2026-10-29`: superseded as the release vehicle.
- Source branches were not modified, closed, or merged; closing/superseding the PRs
  is an owner decision after this candidate is accepted. PRs #25/#26/#27/#29 and the
  #9/#8 stack are untouched and make no claim here.

## Next task: operational startup and live Meta verification

1. Watch exact-head CI green on the Draft release PR (all four jobs), then triage any
   review comments (needs working `gh` auth).
2. Operational startup on a clean machine: `npm ci`, `npm test`, `npm run build`,
   `npm run check:mac`, then `npm run start:demo` (or `start-bursyar.command`) with
   owner-held Firebase/Meta credentials; see `docs/INFERENCE-RUNBOOK.md` and
   `docs/MAC-REBOOT-STARTUP.md`. Never commit credentials.
3. Run the single authorized live Oxford verification per
   `docs/META-TRUNCATION-INVESTIGATION.md`; record HTTP status, completion reason,
   token usage, and evidence validation outcome. No other paid/live calls.
4. Obtain human fa/ps review and guardian/privacy sign-off before any submission;
   keep the PR Draft until then.
