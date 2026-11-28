# BursYar execution state

Single entry point for "where the work stands". It records state and points at the
existing registers instead of copying them: confirmed defects live in
`docs/DEFECT-REGISTER.md`, owner actions in `docs/OWNER-UNBLOCK-PACKET.md`, the
earlier remediation narrative in `docs/AUDIT-REMEDIATION.md`.

Branch: `work/restore-approved-ai-studio-hero`. Baseline commit when this file was
created: `211801c` (the first published commit of the recovered history).

Animation implementation batch resumed on `freebuff/9e7a86ae8c05378b27baa843`,
fast-forwarded to `ebae4ac` (0 behind, 264 ahead of the previous checkout's
`2162be3`). The tree was clean on arrival, so there were no uncommitted changes to
preserve or reconcile.

## 1. Repository continuity

- The handover named commits `79a9b54` (accessibility matrix) and `f1715af`
  (documentation). Neither object exists in this repository: they are not on any
  local or remote ref, and `git cat-file -t` rejects both. They were never fetched
  here, so they cannot be recovered from this clone and no attempt was made to
  recreate them by hash.
- The working branch was **242 commits ahead of the remote** (`b341544`), so the
  previous mission's work had never been published. That history was preserved and
  pushed unchanged; nothing was reset or rewritten.
- The handover's `MASTER-EXECUTION-PLAN.md`, `MASTER-DEFECT-REGISTER.md` and
  `MASTER-EXECUTION-STATE.md` are not in the tree. This file is the replacement for
  the state document; the defect register stays the defect authority.
- Equivalent accessibility coverage that does exist in-tree:
  `verification/browser.mjs` (axe, 3 languages × 5 widths, mid-flow and end-of-flow),
  `verification/audit-remediation-browser.mjs` (axe at 390/1440 with every disclosure
  open, touch targets, duplicate nav targets, visible `h1`, noscript),
  `verification/responsive-probe.mjs` (30 viewport × language renders),
  `verification/typography-probe.mjs`, and axe runs inside the dashboard, research
  and document suites. What was genuinely missing — contrast **during** scroll
  animations and reduced-motion equivalence — is now covered by
  `verification/animation-accessibility.mjs` (scroll sweep in 3 languages at phone and
  desktop width).

## 2. Verification baseline

Recorded with the commands actually run on this branch; a check that was not run is
not listed as passing.

| Check | Result |
| --- | --- |
| `npm test` | 584/584 (`node --test` suites plus the research gate) |
| `npm run test:evaluation` | 60 checks pass (offline fixtures; not model accuracy) |
| `npm run build` | exit 0 |
| `npm run test:browser` | 15/15 cases, 0 axe violations, 0 overflow, 374 s wall (549 s before the language-parallel runner) |
| `verification/animation-accessibility.mjs` | 6/6 cases, 0 contrast failures across the scroll sweep |
| Dashboard, research, auth-feedback, document-review/library/OCR/preview, local-pdf, document-production-gate, audit-remediation, journey-audit, responsive-probe, typography-probe | pass |
| `npm run release:check` | all rows, freshness, stamped build and rehearsal smoke pass; the only failure is the gate requiring the recorded commit to be on `main`, which the mission forbids |
| `npm run test:emulator` | 58 checks pass with a Temurin 21 JDK at `JAVA_HOME=/tmp/jdk`: Firestore rules, Auth emulator Google IdP, claims, quota, cross-account isolation |
| `npm run test:workspace` | 27 authenticated scenes rendered from an emulator-backed session the app restored itself after a reload, including upload → reader → approval, a conflicting document, a duplicate copy and its deletion, reviewed catalog → assessment → PathFinder next step, discovery → saved scholarship with its official source, the account/privacy actions, and tablet/phone/reduced-motion variants; 0 axe violations, 0 overflow, 0 unexpected errors |
| `npm run check:research` | Structure gate plus freshness: 12 rows, 0 structural failures, 0 overdue as of 2026-11-27 |
| `verification/animation-accessibility.mjs` (narrative) | Document fragments hold `view()` timelines, ride both lanes, move with scroll, and the connector mirrors exactly in `fa`/`ps` |
| Research card render | `en`/`fa`/`ps` at 1280: every card states `data-eligibility="unreviewed"`, the row with no recorded level prints the unknown-level note instead of an empty slot, no horizontal overflow — `verification/artifacts/research/` |
| Constrained-device measurement | 390×844 at 1.6 Mbit/s / 150 ms: FCP 704 ms, load 1395 ms, 176 KB over 8 requests, 2 JS chunks before interaction, 9.5 MB heap (production build) |
| `node --test tests/workspace-layout-guards.test.js` | 8/8 layout, navigation and copy guards |
| `node --test tests/narrative-scroll-timelines.test.js` | 4/4 narrative guards, including the document fragment lanes and the RTL mirror |
| `verification/animation-accessibility.mjs` | 6/6 cases: 0 contrast failures in the scroll sweep, the paper, markers and document fragments all hold `view()` timelines and move with scroll, and the connector mirrors exactly in `fa`/`ps` |
| Animation batch re-run, 2026-11-28 at `ebae4ac` | `npm run build` exit 0; `node --test tests/narrative-scroll-timelines.test.js` 4/4; `verification/animation-accessibility.mjs` 6/6 (`{passed:true,cases:6}`) on a locally provisioned headless Chromium 141 in this Linux workspace |
| Document-fragment evidence, 2026-11-28 | 12 frames regenerated at 1440 and 390 in `en`/`fa`/`ps`, each with a reduced-motion twin, in `verification/artifacts/narrative/` with `measurements.json` (gitignored, as this repository requires for artifacts) |

### Animation implementation batch — 2026-11-28

The document-specific particle narrative was already implemented in `c5474f4`
(`docs/DESIGN-NARRATIVE-RECOVERY.md`, defects NARR-01/NARR-02 in
`docs/DEFECT-REGISTER.md`). Re-checking it end to end produced **no source change**:
the six fragments, the reader chrome, the careted evidence line, the RTL mirror
rule and the reduced-motion pinning are all present and behave as documented, so
nothing was rewritten to manufacture a diff.

What this batch did add is the evidence the register cites but which was missing
from this checkout: `verification/artifacts/narrative/` held no frames. They are
regenerated and measured now.

Measured on the built bundle, scene centred in the viewport:

| Width | Lane A fragments | Lane B fragments | Connector transform | Overflow |
| --- | --- | --- | --- | --- |
| 1440 `en` | 58%, 78%, 85.2% | 32.3%, 40.6%, 43.8% | `none` | 0 |
| 390 `en` | 40.0%, 51.5%, 56.8% | 25.4%, 32.4%, 35.3% | `none` | 0 |
| 1440 / 390 `fa`, `ps` | same travel, mirrored | same travel, mirrored | `matrix(-1, 0, 0, 1, 0, 0)` | 0 |
| any, reduced motion | 58%, 78%, 92% (resting) | 54%, 76%, 90% (resting) | mirrored as above | 0 |

Those numbers differ from the register's earlier recording (`43.7/56.1/61.8%` and
`27.6/35.3/38.4%`) because the sample scroll position is not identical; the
behaviour — scroll-driven travel, per-fragment resting distances, exact RTL
mirroring, and a static frame under reduced motion — reproduces.

Browser provisioning note for this workspace (no root, so no `apt-get install`):
the Ubuntu 24.04 libraries Chromium needs were fetched with
`apt-get -o Dir::State::lists=/tmp/apt/lists -o Dir::Cache::archives=/tmp/apt/cache/archives download`
and unpacked with `dpkg -x` into `/tmp/libroot`; runs then need
`LD_LIBRARY_PATH=/tmp/libroot/usr/lib/x86_64-linux-gnu`, `FONTCONFIG_PATH=/tmp/libroot/etc/fonts`
and `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1`. Those paths are per-session and
are not committed.

Not run in this batch, deliberately: the full `npm test`, browser, workspace, emulator
and release-check suites. The scope was the animation batch, so only the narrative
guards, the animation gate and a build were executed. Their earlier results above
stand from previous runs and were not re-measured here.

Remaining implementation work for this batch: none. The narrative is closed; the
open items in §3 are unchanged and none of them is the particle transition.

## 3. Backlog

### Locally testable, actionable

1. **Product end-to-end** — the core journey is covered by `npm run test:workspace` (uploaded document → review → approved profile, a conflicting document, a duplicate copy and its deletion, reviewed catalog → unknown assessment → PathFinder next step → dashboard summary, discovery → saved scholarship with its official source) and by the existing document/OCR/library/preview suites (`verification/document-ocr-integration.mjs` drives PDF, scanned PDF, PNG, JPEG and the empty-OCR manual transcription through the real UI). Nothing in this list is uncovered; the remaining owner-dependent step is a hosted upload, listed below.
2. **Visual/interaction** — the authenticated workspace has now been inspected at 1280 and 390 in en, fa and ps, plus reduced motion (`verification/artifacts/workspace/`), and the defects that surfaced are fixed (DASH-02..05, DOC-02..03). Tablet (768), phone (390) and reduced-motion variants are captured too. The landing narrative's document-fragment transition was implemented and inspected at 1280 and 390 in all three languages (`verification/artifacts/narrative/`, `docs/DESIGN-NARRATIVE-RECOVERY.md`). Still uninspected: the document reader after a manual transcription, and the conflict-state document.
3. **Browser runtime** — 374 s for 15 cases with two workers on 2 vCPU. The remaining
   cost is per-action actionability, so further gains need fewer, not weaker, steps.

Reproducing the emulator run without a system JRE:

```bash
curl -sSL -o /tmp/jdk.tar.gz https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.5%2B11/OpenJDK21U-jdk_x64_linux_hotspot_21.0.5_11.tar.gz
mkdir -p /tmp/jdk && tar -xzf /tmp/jdk.tar.gz -C /tmp/jdk --strip-components=1
JAVA_HOME=/tmp/jdk PATH=/tmp/jdk/bin:$PATH npm run test:emulator
```

### How the authenticated screens are inspected

```bash
JAVA_HOME=/tmp/jdk PATH=/tmp/jdk/bin:$PATH npm run test:workspace
```

It runs inside `firebase emulators:exec`, creates its account in the Auth emulator, signs the
browser in through the emulator with the real SDK, reloads so the app restores the session from
its own persistence, and then captures `verification/artifacts/workspace/*.png` with an axe scan
and an overflow check per scene. `src/auth.js` connects the SDK to the emulator only under
`import.meta.env.DEV`, so a shipped bundle cannot be redirected locally. `WORKSPACE_SCENE=name`
limits the captures without skipping the flow.

### Gaps that are real but not actionable here

- **Application readiness tracker** (`docs/CAPABILITY-MATRIX.md` row 9): there is no
  per-application checklist of collected requirements, only the dashboard summary and
  the PathFinder next actions. Building it honestly requires issuer-verified
  requirements, which is the same blocker as document verification.
- **Export and delete-all in a rendered browser**: the API paths are covered by
  `tests/verification-api.test.js` and the buttons are asserted in workspace scene
  `08`, but the download and the double confirmation have never been clicked through,
  because the harness has no hosted account to erase.

### Owner-dependent (cannot be verified here)

- Live Google sign-in, session restoration across a real reload, and hosted document
  acceptance: requires the owner's Firebase project and an approved test account.
  `docs/OWNER-ACCEPTANCE-CHECKLIST.md` states each missing permission, the safe
  procedure and the expected result.
- Fluent Dari/Pashto semantic review: `docs/TRANSLATION-REVIEW.json` tracks status.
- Production publication: the release gate requires the recorded commit on `main`,
  and this mission forbids merging to `main` or deploying.

### Not applicable

- **Supabase policies**: this project has no Supabase dependency. Data lives in
  Firebase Auth + Firestore (public catalog read-only, deny-by-default rules) and in
  the server-side SQLite document store with owner-scoped authorization. The
  equivalent audit target is `firestore.rules` plus the document API's ownership
  checks, which the emulator and document suites cover.

## 4. Standing constraints

No paid inference or infrastructure, no Vercel Agent Review, no production
deployment, no merge into `main`, no destructive Git operations, no restored older
designs, and no claimed result that was not measured.
