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
release window, not casually, and not before the freshness gate in §6 is green.

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

**Known rough edge.** The `/health` probe has no client timeout, and the free
Render plan sleeps. Warm the service first
(`curl -m 75 https://bursyar-api.onrender.com/health`), then run the smoke; a
bounded timeout in the script would be a small follow-up, not a release blocker.

## 6. Pre-flight blockers before any release window

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

## 7. What the owner must do versus what this worktree can do

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

## 8. Acceptance checklist to paste back

For each item, the evidence is the command output, not a description.

- [ ] `curl -sS -o /dev/null -w '%{http_code}\n' https://bursyar.vercel.app/` → `200`
- [ ] `curl -sS -o /dev/null -w '%{http_code}\n' https://bursyar.vercel.app/health` → `200`
- [ ] `curl -m 75 https://bursyar-api.onrender.com/health` → commit equals the approved SHA
- [ ] `curl -sS https://bursyar.vercel.app/ | grep -o '<meta name="bursyar-build" content="[0-9a-f]*"'` → same SHA
- [ ] `node scripts/release-smoke.mjs https://bursyar.vercel.app` → `passed:true`, `unmeasurable:[]`
- [ ] `RELEASE.md` records both full SHAs in the two machine-read rows
- [ ] Register: BY-01 VERIFIED, BY-04 VERIFIED, BY-25 VERIFIED (or the failure recorded as BLOCKED with its output)

## 9. Questions the owner has to answer

1. Scope: is **Production-only** exposure acceptable (recommended), or must the
   whole project stay protected behind a bypass token, accepting that BY-01
   remains open for students?
2. Is `bursyar.vercel.app` the intended public hostname, or is a custom domain
   coming in the same window?
3. Is the release window before 7 December 2026, or should the scholarship rows
   be re-read and re-dated first?
4. Should the pilot stay closed on the public hostname (recommended until an
   operator enrolment process exists), or open alongside the release?
