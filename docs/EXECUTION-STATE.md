# BursYar execution state

Single entry point for "where the work stands". It records state and points at the
existing registers instead of copying them: confirmed defects live in
`docs/DEFECT-REGISTER.md`, owner actions in `docs/OWNER-UNBLOCK-PACKET.md`, the
earlier remediation narrative in `docs/AUDIT-REMEDIATION.md`.

Branch: `work/restore-approved-ai-studio-hero`. Baseline commit when this file was
created: `211801c` (the first published commit of the recovered history).

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
| `npm test` | 568/568 before this batch's additions |
| `npm run test:evaluation` | 60 checks pass (offline fixtures; not model accuracy) |
| `npm run build` | exit 0 |
| `npm run test:browser` | 15/15 cases, 0 axe violations, 0 overflow, 374 s wall (549 s before the language-parallel runner) |
| `verification/animation-accessibility.mjs` | 6/6 cases, 0 contrast failures across the scroll sweep |
| Dashboard, research, auth-feedback, document-review/library/OCR/preview, local-pdf, document-production-gate, audit-remediation, journey-audit, responsive-probe, typography-probe | pass |
| `npm run release:check` | all rows, freshness, stamped build and rehearsal smoke pass; the only failure is the gate requiring the recorded commit to be on `main`, which the mission forbids |
| `npm run test:emulator` | 58 checks pass with a Temurin 21 JDK at `JAVA_HOME=/tmp/jdk`: Firestore rules, Auth emulator Google IdP, claims, quota, cross-account isolation |
| `npm run test:workspace` | 18 authenticated scenes rendered from an emulator-backed session that the app restored itself after a reload; 0 axe violations, 0 overflow, 0 unexpected errors |
| `node --test tests/workspace-layout-guards.test.js` | 8/8 layout, navigation and copy guards |

## 3. Backlog

### Locally testable, actionable

1. **Product end-to-end** — document upload/extraction/OCR, provenance and conflicts,
   eligibility unknowns, Barrier PathFinder next steps, matching and freshness,
   dashboard states. Verify through the existing suites and fix what they expose.
2. **Visual/interaction** — the authenticated workspace has now been inspected at 1280 and 390 in en, fa and ps, plus reduced motion (`verification/artifacts/workspace/`), and the defects that surfaced are fixed (DASH-02..05, DOC-02..03). Still uninspected: tablet width (760–1024), the PathFinder/next-step region once an assessment exists, and the document reader after a manual transcription.
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

### Owner-dependent (cannot be verified here)

- Live Google sign-in, session restoration across a real reload, and hosted document
  acceptance: requires the owner's Firebase project and an approved test account.
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
