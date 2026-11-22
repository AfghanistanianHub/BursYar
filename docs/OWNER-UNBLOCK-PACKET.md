# Owner unblock packet — BY-01, BY-04, BY-25

Drafted 22 November 2026 for the repository owner. This packet **changed nothing**:
no Vercel or Render setting was touched, nothing was merged, published, promoted
or deployed, and no production credential was used or requested. It describes
what the owner has to decide and click, what this worktree can do around that,
and what evidence closes each finding.

Related: [`AUDIT-REMEDIATION.md`](AUDIT-REMEDIATION.md) (BY-01, BY-04, BY-25),
[`RELEASE.md`](../RELEASE.md) (release procedure and rollback).

## 1. Measured state (22 November 2026)

| Fact | Value | How it was measured |
|---|---|---|
| Production frontend `https://bursyar.vercel.app/` | `302` → `https://vercel.com/sso-api?url=…` | `curl -o /dev/null -w '%{http_code} %{redirect_url}'` |
| Production frontend `/health` | `302` → `vercel.com/sso-api` (the `vercel.json` rewrite never runs) | same |
| Backend `https://bursyar-api.onrender.com/health` (direct) | `200` after a cold start (> 20 s, answered within 75 s); `capabilities.build.commit = 7dbd75f6889ea09e96c129831bec40c463b6e64e` | `curl -m 75` |
| Deployed production frontend commit | `2162be3` — from the last promoted Vercel deployment record, **not** independently readable | `RELEASE.md` inventory |
| Candidate branch `work/restore-approved-ai-studio-hero` | `de2c59e` | `git rev-parse HEAD` |
| Gates on the candidate | `npm test` 522 pass / 0 fail; `npm run build` exit 0 | this worktree, 22 Nov |

Three commits are still live in three places. Production serves an older
frontend and an older backend, and neither can be inspected through the
hostname because authentication is in front of it.

## 2. The one decision that unblocks all three

Vercel Authentication is enabled project-wide, so *every* request — including
this repository's own release check — is intercepted before Vercel serves the
build. That is BY-01. Until it is lifted for Production:

- BY-01 cannot be accepted (the public hostname is not publicly reachable);
- BY-04 cannot be measured (release-smoke cannot read the frontend stamp, so it
  reports parity as **unmeasurable**, correctly refusing to guess);
- BY-25 cannot be shown to work (a Render deploy from `render.yaml` cannot be
  exercised end to end while `/health` is hidden behind the frontend's SSO
  redirect).

So the packet is really one owner decision (protection scope), one release
operation (two deploys from one commit), and one piece of bookkeeping.

## 3. BY-01 — Vercel Deployment Protection

### Where the setting is

Vercel dashboard → project **bursyar** (`afghan-hub-s-projects`) → **Settings** →
**Deployment Protection** → **Vercel Authentication**. Labels shift slightly
between dashboard versions; the setting is the one whose scope can be set to
*All Deployments*, *Only Preview Deployments*, or *Disabled*.

### Recommended: protection on Preview, off for Production

Set the scope so that **Production is not protected** and **Preview stays
protected**. That keeps candidate deployments private (they are built from
unmerged branches) while making the product reachable for the students it is
for. Do **not** disable protection project-wide if it can be scoped; preview
URLs contain unreleased work.

### Not a substitute: a Protection Bypass token

Vercel can issue a bypass secret (`x-vercel-protection-bypass`). `release-smoke`
already understands it via `BURSYAR_BYPASS_TOKEN`, and it is useful for checking
a protected *preview* before release. It is **not** a fix for BY-01: a token
lets a machine past the wall, not a student. BY-01 is only closed when an
ordinary browser with no session gets the app.

### What becomes public when protection is lifted

Whatever commit is promoted at that moment — currently `2162be3`, not this
branch. The app's pilot gate still applies (sign-in is closed and accounts must
be enrolled), but the static reading experience and the public research library
become world-readable. That is the intended product state; it should happen in a
release window, not casually, and not before the freshness gate in §7 is green.

### Order of operations (owner)

1. Approve the release candidate commit (gates first — see §4). Keep the release window
   short: protection off → deploy → smoke → record, in one sitting.
2. Merge and deploy per §4 (this may be done before or after step 3; doing the
   deploys first means the first public request already serves the new build).
3. Vercel → Settings → Deployment Protection → Vercel Authentication → set the
   scope so Production is unprotected. Save.
4. Verify from a machine with no Vercel session:
   ```bash
   curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://bursyar.vercel.app/
   # expect: 200 and an empty redirect_url
   curl -sS -o /dev/null -w '%{http_code}\n' https://bursyar.vercel.app/health
   # expect: 200 (first call after idle can take ~30-60 s and may need one retry)
   ```
   A `302` still pointing at `vercel.com/sso-api` means the setting did not
   apply to this domain — check whether `bursyar.vercel.app` is attached as a
   production domain and whether a second protection layer (password, trusted
   IPs, or a firewall rule) is also enabled.

### What "done" looks like for BY-01

Both smoke lines `GET / → 200` and `no Vercel SSO redirect` pass with no
bypass header, and `/health` through the Vercel hostname returns the backend
JSON. Record the two `curl` outputs with the date in
`docs/AUDIT-REMEDIATION.md` BY-01 and change its status from BLOCKED to
VERIFIED.

## 4. BY-04 and BY-25 — one release, two components, one commit

BY-04 is "Production and `/health` report the same commit". BY-25 is "the
Render blueprint actually reproduces the backend". Both are answered by the
same operation: deploy **one** commit to **both** components and prove it with
`release-smoke`.

### What this window adds to the release procedure

The authoritative steps — reconciliation, gates, deploy order, recording the
SHAs, re-running the smoke, and rollback — are in
[`RELEASE.md`](../RELEASE.md) (*Release procedure*, step 1 through step 5, and
*Rollback*). Follow them in order; this packet does not restate them. What is
specific to this window:

- **Both components must come from one SHA.** Vercel builds whatever `main`
  points at, while `render.yaml` sets `autoDeploy: false`, so the Render side is
  a deliberate *Deploy a specific commit* of that same SHA. A frontend built
  from a slightly newer `main` than the backend is the ordinary way this parity
  check goes red.
- **The first smoke run after deploying is expected to fail** — see below.
- **Rollback is `RELEASE.md`'s**, not a second plan restated here. One
  consequence worth naming: re-enabling Vercel Authentication at the same time
  restores BY-01 to BLOCKED.

### The first post-deploy smoke run is supposed to fail

`release-smoke` compares the live commits against the two rows in `RELEASE.md`,
which still record `2162be3` and `7dbd75f`. On the first run after deploying the
release you should therefore see:

```
PASS GET / → 200
PASS no Vercel SSO redirect (location: none)
PASS frontend … and backend … report the same commit     ← internal parity
FAIL frontend <new> matches RELEASE.md (2162be3…)         ← expected, stale record
FAIL backend  <new> matches RELEASE.md (7dbd75f…)         ← expected, stale record
```

That is the manifest doing its job: the deployed pair no longer matches what the
repository claims. Copy the observed SHAs into `RELEASE.md` (release procedure step 5) and re-run;
a second run must exit 0. Do not "fix" this by editing `RELEASE.md` to a value
nobody observed.

Two format traps when recording, both machine-checked:

- The frontend row must keep the lead-in **`Production frontend branch and commit`**
  and contain the SHA in backticks; the backend row must keep
  **`Backend production SHA`**. `readManifest()` matches on those phrases and a
  reworded row silently becomes "missing".
- Short prefixes are tolerated (`2162be3` matches `2162be3e2…`), but record the
  full 40 characters the artefacts print.

### BY-25 specifically

`render.yaml` declares the service, build command (`npm ci --no-audit --no-fund`),
start command (`npm run start:engine`), health path, and every secret as
`sync: false`. What has never been shown is that this declaration *produces* the
running service — the live backend was deployed by hand at `7dbd75f`. That
deploy is the test: a service made from this manifest, reaching a healthy
`/health` that reports its commit. Nothing is expected to fail, but a blueprint
deploy is where differences (Node version, start path, an unset `sync: false`
secret) surface. If it fails, the fix belongs in `render.yaml` rather than a
recorded workaround.

## 5. Which `release-smoke` checks prove parity

`node scripts/release-smoke.mjs https://bursyar.vercel.app` runs these checks in
order and exits 0 only if every one passes.

| Check (as printed) | What it proves | Finding |
|---|---|---|
| `GET / → 200` | Production serves without a Vercel session | BY-01 |
| `no Vercel SSO redirect (location: …)` | No `sso-api` interception remains | BY-01 |
| `/ serves HTML (…)` | The response is the app, not an error page | BY-01 |
| `the app shell is present in the HTML` | `#app` / BursYar markup is in the payload | BY-01 |
| `/assets/<hash>.js → 200` | The hashed entry asset resolves | BY-01 |
| `frontend reports its build commit (<sha>)` | `<meta name="bursyar-build">` exists — the build knows its source commit | BY-04 |
| `GET /health → 200` | The `vercel.json` rewrite reaches the backend and it is up | BY-04 |
| `backend reports a build commit (<sha>)` | `/health.capabilities.build.commit` is present | BY-04 |
| `frontend <a> and backend <b> report the same commit` | **Parity between the deployed artefacts** | BY-04 |
| `RELEASE.md records both commits (…)` | The repository states what it expects to be live | BY-04 |
| `frontend <a> matches RELEASE.md (<c>)` | Deployed frontend equals the recorded release | BY-04 |
| `backend <b> matches RELEASE.md (<c>)` | Deployed backend equals the recorded release | BY-04 |

Success is the JSON line:
`{"event":"release_smoke","passed":true,"base":"https://bursyar.vercel.app","unmeasurable":[]}`.
BY-04 and BY-25 may only be marked VERIFIED against that output (or the
equivalent `passed:true` with only preview-scope `unmeasurable` entries), not
against a green Vercel build.

**Precision about what parity means.** The check proves a three-way agreement
between the frontend stamp, the backend `/health` commit and the two rows in
`RELEASE.md` at one moment. It does not prove that code *works* — behaviour is
covered by the browser, journey and evaluation suites and by the signed-in pilot
checks, which are still unverified for lack of an enrolled account. It also
does not prove the deployed pair equals the branch tip independently; the
recording step is what ties the manifest to the observation.

**Built-in honesty.** If the host hides an artefact, the check prints
`INFO … unmeasurable` and never manufactures a mismatch: an SSO redirect or an
unreachable `/health` says nothing about whether commits agree. The SSO line
still fails, so a hidden production cannot be reported as parity. Likewise a
missing stamp fails with the rebuild instruction rather than passing.

**Bounded probe.** The `/health` probe gives up after 45 seconds
(`BURSYAR_SMOKE_HEALTH_TIMEOUT_MS` changes it) and fails with `no answer within …
ms` instead of blocking on a sleeping free-plan instance; a timed-out probe is
reported as unmeasurable parity, never as a commit mismatch. Warming the service
with `curl -m 75 https://bursyar-api.onrender.com/health` before a release is
still worth the ten seconds.

### Rehearsing the sequence before the promotion

`verification/rehearsal-smoke.mjs` serves the built `dist/` with a backend whose
`/health` commit you control, then runs the real `scripts/release-smoke.mjs`
against it in three situations plus the post-promotion re-run. It is the same
sequence as Production, minus Vercel and Render. Runs 3 and 4 patch nothing:
they call that same script with `BURSYAR_SMOKE_PRODUCTION_SCOPE=1` and
`BURSYAR_SMOKE_MANIFEST=<temp file>`, so the code being rehearsed is the code
that will run against Production.

```bash
npm run build                      # the stamp in dist/index.html must equal the commit you intend to promote
npm run rehearsal:smoke
```

The branch workflow runs the same alias immediately after `npm run build`, so a
red rehearsal fails the pushed branch's checks rather than waiting to be found
during a promotion.

`npm run release:check` runs the whole pre-flight in the order below — clean
tree, `RELEASE.md` rows, hostname agreement, freshness, a build stamped with
HEAD, then the rehearsal — and prints the two rows to paste once the smoke
confirms the deployed SHAs. Pass `-- --backend=<sha>` with the commit `/health`
reported to get both rows complete.

| Run | Backend commit | `RELEASE.md` rows | Expected |
|---|---|---|---|
| 1 | equals the frontend stamp | not read (off-production) | exit 0, one `unmeasurable`: `RELEASE.md parity is enforced against …` |
| 2 | `deadbeef…` | not read | exit 1, the only failure is `frontend … and backend … report the same commit` |
| 3 | equals the frontend stamp | the recorded production pair (or `REHEARSAL_STALE_FRONTEND` / `REHEARSAL_STALE_BACKEND`) | exit 1, the only failures are the two `matches RELEASE.md (…)` lines, while `RELEASE.md records both commits` still passes |
| 4 | equals the frontend stamp | the tested commit in both rows | exit 0, `unmeasurable:[]` |

Run on 22 November 2026 against `a816591` (`dist` stamped with the same commit),
all four behaved exactly as the table says, and the script's own exit was 0 with
`{"event":"rehearsal_smoke","passed":true,…,"failures":[]}`. In run 3 the two
failures printed the pair recorded in this repository at the time,
`frontend … matches RELEASE.md (2162be3…)` and `backend … matches RELEASE.md
(7dbd75f…)`, next to a passing `frontend … and backend … report the same commit`.

If anything goes red that is not those two rows, §6 is the runbook. **Read run 3
before you deploy.** The first smoke after a correct promotion will
fail those same two lines by design, because `RELEASE.md` still describes the
previous release. Update the two machine-read rows (the frontend one under
`Production frontend branch and commit`, the backend one under `Backend
production SHA`) to the full promoted SHAs, re-run, and expect run 4's shape:
`passed:true`, `unmeasurable:[]`. A failure that includes anything other than
those two rows is not bookkeeping — stop and diagnose it.

**What it cannot rehearse, and what only the real hostname can tell you:**
Deployment Protection (BY-01 — the one line a promotion cannot make green), the
`vercel.json` rewrite of `/health` to Render, the commit Render itself publishes,
the `VERCEL_GIT_COMMIT_SHA` a promoted build was stamped with, and cold-start
timing. Treat a green rehearsal as "the check behaves as designed", never as
"Production is released".

## 6. Red runbook — when `release:check` or `release-smoke` fails after a promotion

The two commands answer different questions, and a red one means different
things depending on which ran. `npm run release:check` runs *before* anything is
live: it touches Production not at all, only reading `RELEASE.md`, and its value
is that a red pre-flight costs nothing. `node scripts/release-smoke.mjs` runs
*after* a promotion: it reads the live hostname, and a red line there means
something is already serving users. Keep the verbatim JSON output either way —
`{"event":"release_check","passed":false,"failures":[…]}` or
`{"event":"release_smoke","passed":false,…}` — because the record is the
output, not a description of it.

Three rules hold for every line below. No red is cleared by editing the check,
re-dating a research row, or re-enabling Vercel Authentication to stop the smoke
seeing it. `INFO … unmeasurable` is not a pass: a production-scope run only
counts as parity evidence with `unmeasurable:[]`. And the smoke proves
three-way commit agreement at one moment; it never proves the app works.

### Classify the red before acting

| Class | Signature | Action |
|---|---|---|
| Expected bookkeeping | internal parity passes and the **only** failures are the two `matches RELEASE.md (…)` lines | copy the observed SHAs into the two rows, re-run, expect `passed:true`; no rollback |
| Release-blocking | any other `FAIL`, or a non-empty `unmeasurable` on production scope | stop the window, diagnose per the tables below; roll back if it is not identified quickly (§6.3) |
| Tool failure | the rehearsal itself is red, or `request failed:` on every line | production tells you nothing yet; fix the tool or the network path first |

### 6.1 What each `release:check` step means

| Failing line | What it means, including after a promotion | Do |
|---|---|---|
| `the tree has N uncommitted paths` | the commit being built is not the commit in git; a build from this tree is unattributable | commit or stash, re-run. If such a build was already promoted, the live frontend has no source commit: treat it as release-blocking |
| `the frontend/backend row is a full 40-character SHA` | a row was hand-edited or truncated; the smoke tolerates prefixes but the pre-flight does not | restore the full SHA from `/health` or the deployment record — never a value nobody observed |
| `the frontend/backend commit exists in this clone` | a shallow clone (fetch it: `git fetch origin --unshallow`), or the row names a commit that was never pushed — a deployed artefact with no source anywhere is a stop | fetch the history; if the commit genuinely is not in the repository, do not promote and escalate (§6.4) |
| `the recorded frontend commit is on main` | the recorded release is not an ancestor of its branch: `main` moved backwards or was force-pushed, or the row records another branch's commit | stop. Promote nothing until you know which of those is true |
| `the recorded branch … is available to compare against` | this clone has neither `origin/main` nor a local `main` | `git fetch origin main` and re-run |
| `vercel.json rewrites … to an absolute URL` / `keeps the path` / `keeps the /api prefix` | the rewrite file no longer describes a working route; if this is what was deployed, `/health` and every API call 404 | fail closed; fix the rewrite before the next promotion |
| `both rewrites target one backend host` | `/health` and `/api` point at different backends — the app calls an API nobody deployed from this release | stop; one release means one backend host |
| `render.yaml sets BURSYAR_ORIGIN` / `healthCheckPath is /health` | the backend's CORS origin or health path drifted, so signed-in calls are rejected and Render's health check flaps | fix `render.yaml`; a bad health path also makes the service look down when it is not |
| `RELEASE.md documents a release-smoke URL` / `release-smoke.mjs declares DEFAULT_BASE` / `… name one frontend host` | the documented command checks a different host than the smoke defaults to, so a green run may describe a host nobody promoted | bookkeeping, but fix it before running the smoke, or the evidence is about the wrong host |
| `render.yaml's CORS origin is the frontend host` | a mismatch rejects browser API calls from the real origin with a CORS error that looks like a backend outage | fail closed before promoting; if already live, see §6.2's CSP row |
| `the CSP connect-src allows the backend host` | the browser blocks every API call: the shell loads and nothing works, visible only in the console | if live, this is user-visible breakage — fix forward in minutes or roll back (§6.3) |
| `every shipped research row is inside its recheck window` | not a code failure: the scholarship dates' freshness claim has expired (earliest 7 December 2026 for the 12 rows dated 2026-11-22) | re-read the official pages and record `docs/RESEARCH-RECHECK-<date>.md`; never re-date to pass |
| `npm run build succeeds` | toolchain or dependency failure; nothing new went live | read the tail it printed; `npm ci` after a restored worktree |
| `dist/index.html carries a build stamp` / `the stamp is HEAD` | the build did not record its source (no commit in the environment) or `dist/` is stale | rebuild at the commit you mean; a promoted build stamped `unknown` fails the live smoke |
| `the rehearsal passes all four scenarios` | the smoke tool itself, or its local servers, is broken — so a live run could not be interpreted either | fix the tool before running it against Production |

### 6.2 What each `release-smoke` line means

| Check (as printed) | What it means after a promotion | Do |
|---|---|---|
| `GET / → 302` with `no Vercel SSO redirect (location: …sso-api)` | Deployment Protection is on for the production domain — BY-01, an owner setting, not a code defect | owner scopes protection per §3. Do not run with `BURSYAR_BYPASS_TOKEN` and record a green: a token is a machine past the wall, not a student |
| `/ serves HTML (<type>)` with a non-HTML type | the domain is answering with something that is not the app: a wrong project, a proxy, or a host-level error page | read the body and the deployment the domain points at before touching the release |
| `the app shell is present in the HTML` | the served document has no `#app`/BursYar markup — a placeholder, an error page, or a different build | stop; this is not a stale-cache problem to wait out |
| `/assets/<hash>.js → 404` | the promoted HTML references an asset the host does not serve: a partial promotion or a build/asset mismatch | re-promote that deployment; if it recurs, roll back |
| `frontend reports its build commit (missing stamp, rebuild …)` | the build was stamped `unknown`, usually because no commit was in the environment at build time | release-blocking: the artefact cannot be tied to source. Re-promote a stamped build |
| `GET /health → 404` / `→ 500` | the `vercel.json` rewrite reaches nothing, or Render failed the deploy and is not serving | probe `https://bursyar-api.onrender.com/health` directly: healthy directly but not through the hostname means the rewrite; unhealthy directly means the backend deploy |
| `GET /health → no answer within 45000 ms` | a sleeping free-plan instance or a cold start, not a commit mismatch | warm it (`curl -m 75 https://bursyar-api.onrender.com/health`) and retry once; parity stays unmeasurable until it answers |
| `backend reports a build commit (none)` | the backend is up but cannot say what it is running — not a deploy from this repository's engine, or the commit environment is unset | record it as unattributable; do not call the pair released |
| `frontend <a> and backend <b> report the same commit` | the two components were promoted from different commits: the ordinary parity failure this check exists for, usually Vercel building a newer `main` than the Render deploy | deploy the same SHA to both, or roll both back (§6.3). Never record mismatched SHAs as released |
| `RELEASE.md records both commits (frontend missing, backend missing)` | a machine-read row was reworded or deleted, so the manifest silently became empty | restore the exact lead-ins `Production frontend branch and commit` and `Backend production SHA` |
| `frontend/backend <a> matches RELEASE.md (<c>)` | bookkeeping **only** when internal parity passed and these are the only two failures; otherwise it is genuine drift between the record and what is live | in the expected case record the observed SHAs and re-run. If parity also failed, this is not bookkeeping — see the parity row |
| `request failed: …` | the runner has no path to the host: DNS, TLS, a proxy, or a typo in the URL | confirm with `curl` from the same machine before reading anything into it |

### 6.3 The safe rollback pair

Rolling back is a promotion, not an undo: you promote the last pair that passed.
As of 22 November 2026 that pair is the one Production is serving now, and it is
recorded in [`RELEASE.md`](../RELEASE.md) *Rollback*:

| Component | Safe target | How |
|---|---|---|
| Frontend | `2162be3e21962db23bdb022586bdf0e491ffaa96`, served by deployment `dpl_7DaAvqwXK5JaMyhvjnE7gm1FH9b8` | Vercel dashboard → Deployments → that deployment → **Promote to Production** |
| Backend | `7dbd75f6889ea09e96c129831bec40c463b6e64e` | Render dashboard → the service → **Deploy a specific commit** (`autoDeploy: false`, so nothing moves on its own) |

- **Roll back both or neither.** A frontend-only rollback recreates exactly the
  parity failure BY-04 exists to catch, and leaves the pair in a state no row can
  honestly record.
- **Do not roll back by unpublishing the hostname.** That turns a bad release
  into an outage for students and reopens BY-01. **Do not roll back by
  re-enabling Vercel Authentication** either: it hides the breakage from every
  later smoke and returns BY-01 to BLOCKED. Closing access during an incident is
  an owner decision to be recorded, never a workaround.
- **Verify the rollback with the same command**: re-run
  `node scripts/release-smoke.mjs https://bursyar.vercel.app` and expect
  `passed:true` with `unmeasurable:[]`. If the two rows still name the failed
  release, update them to the restored pair and run again — the rows are
  bookkeeping, the deployment is the state.
- **Timebox the diagnosis.** If the cause is not clear in the release window,
  roll back first and diagnose from the restored state; promoting forward again
  is the same operation in reverse.
- **Then update this table.** It is only safe while it names the previous
  verified release. After the next successful release, replace it with the pair
  that release displaced, and record the deployment ids in `RELEASE.md`. A
  rollback target nobody maintained is why this table is written down rather than
  remembered.

### 6.4 Who to notify

The repository has one person with dashboard access, so this is role-based; no
names are invented here.

1. **The release operator** — whoever ran the promotion. Stops the window,
   records the verbatim JSON with the date, and does not promote again until the
   red is classified above.
2. **The repository owner** (`AfghanistanianHub/BursYar`) — the only role that can
   promote, roll back, redeploy Render, or change Deployment Protection; approves
   a rollback (owner-only action 6 in §8).
3. **A subject-matter reader** — only for a freshness (`every shipped research row…`)
   or translation failure; a reviewer is needed, not an engineer.

**Security- or privacy-shaped reds get treated as an incident first.** That means
a commit that does not exist in the repository, a backend serving a commit with no
promotion record, document or profile content appearing where the shell should be,
or any secret visible in an artefact. Notify the owner immediately, do not paste
document content into the register, and do not use production data to diagnose.

**Where the notice goes is currently undefined.** There is no `SECURITY.md`, no
on-call rotation and no incident address in this repository, so the honest answer
is that notification is direct to the repository owner through GitHub. If a
channel is chosen, name it in this section rather than in a chat message. Every
red is also recorded in [`AUDIT-REMEDIATION.md`](AUDIT-REMEDIATION.md) with its
output and date, and the weekly freshness workflow already opens a tracking issue,
so a red nobody was paged for is still visible the next time the branch runs.
Never paste a bypass token, dashboard secret or signing key into the record.

## 7. Pre-flight blockers before any release window

- **Research freshness (BY-08).** All 12 rows are automated reads dated
  `2026-11-22` on a 14-day window, so `npm test` starts failing on **7 December
  2026** and release step 2 blocks. A release this month must either happen
  before then or be preceded by a signed re-read recorded in
  `docs/RESEARCH-RECHECK-<date>.md`. `npm run research:recheck` drafts that
  record; it will not move the dates itself, and 2 of 12 sources (KAUST, MMEG)
  need a human read regardless.
- **Closed pilot (BY-02).** Protection off exposes the shell, not the pilot:
  sign-in still requires an enrolled account. Do not read "public" as "pilot
  opened"; that is a separate, deliberate decision.
- **Translations (BY-21).** fa/ps strings, including the provenance labels added
  for BY-08, remain UNREVIEWED. Public exposure makes that visible; it does not
  make it reviewed.
- **Custom domain.** If `bursyar.vercel.app` is not the intended final hostname,
  decide that before opening protection, so the smoke target in `RELEASE.md`
  and `release-smoke`'s `DEFAULT_BASE` change once rather than twice.

## 8. What the owner must do versus what this worktree can do

**Owner only — no credentials exist here, and none should be shared:**

1. Approve the merge of the candidate into `main`.
2. Change Vercel → Settings → Deployment Protection scope.
3. Promote or trigger the Vercel Production deployment for that commit.
4. Deploy the same commit to Render (`autoDeploy: false`), or connect the
   `render.yaml` blueprint for the BY-25 test.
5. Supply or rotate any production secret (Render `sync: false` variables,
   Supabase keys). Never paste them into chat; set them in the dashboard.
6. Execute a rollback promotion if the release must be undone.

**This worktree can do, without touching access settings:**

1. Run every gate on the candidate and report exact counts.
2. Produce a dated re-read record and the freshness status
   (`npm run check:research`).
3. Run `scripts/release-smoke.mjs` against Production or a preview and report
   `failures` / `unmeasurable` verbatim; with `BURSYAR_BYPASS_TOKEN` set in the
   environment, check a protected preview without ever printing the token.
4. Prepare the `RELEASE.md` bookkeeping commit with the observed SHAs and the
   smoke output, and update the register — **committed only when asked**.
5. Diagnose a failed check from its output and propose the fix; it will not
   report a hidden production as parity, and it will not relax a check to pass.

**Neither side should:** disable protection silently, promote a deployment whose
gates are red, or re-date research checks to clear the release gate.

## 9. Acceptance checklist to paste back

For each item, the evidence is the command output, not a description.

- [ ] `curl -sS -o /dev/null -w '%{http_code}\n' https://bursyar.vercel.app/` → `200`
- [ ] `curl -sS -o /dev/null -w '%{http_code}\n' https://bursyar.vercel.app/health` → `200`
- [ ] `curl -m 75 https://bursyar-api.onrender.com/health` → commit equals the approved SHA
- [ ] `curl -sS https://bursyar.vercel.app/ | grep -o '<meta name="bursyar-build" content="[0-9a-f]*"'` → same SHA
- [ ] `npm run release:check` → exit 0 on the commit you intend to promote, and the two rows it prints match the SHAs the smoke reports
- [ ] `npm run build && npm run rehearsal:smoke` → exit 0 on the commit you intend to promote
- [ ] `node scripts/release-smoke.mjs https://bursyar.vercel.app` → `passed:true`, `unmeasurable:[]`
- [ ] `RELEASE.md` records both full SHAs in the two machine-read rows
- [ ] Register: BY-01 VERIFIED, BY-04 VERIFIED, BY-25 VERIFIED (or the failure recorded as BLOCKED with its output)
- [ ] If anything went red during the window: §6 classified it, the rollback pair is named, and the owner has been notified

## 10. Questions the owner has to answer

1. Scope: is **Production-only** exposure acceptable (recommended), or must the
   whole project stay protected behind a bypass token, accepting that BY-01
   remains open for students?
2. Is `bursyar.vercel.app` the intended public hostname, or is a custom domain
   coming in the same window?
3. Is the release window before 7 December 2026, or should the scholarship rows
   be re-read and re-dated first?
4. Should the pilot stay closed on the public hostname (recommended until an
   operator enrolment process exists), or open alongside the release?
