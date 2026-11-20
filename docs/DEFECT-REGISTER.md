# BursYar defect register

Authoritative tracking for the autonomous completion mission. Statuses: **OPEN**,
**IN PROGRESS**, **FIXED**, **VERIFIED**, **BLOCKED**. An item is only VERIFIED with
reproducible evidence recorded against it (command, measurement or screenshot path).

Baseline: branch `work/restore-approved-ai-studio-hero`, previously verified commit
`18bdaba3eda8965897d270d2d562123b8fddb32c`, preview `dpl_8iyJopwdGU1Vu1Fy7kiV9SvEEodk`.

## Phase 1 — Hero and entry flow

| ID | Defect | Status | Evidence |
| --- | --- | --- | --- |
| HERO-01 | At ≤760px the arc band reused desktop proportions in a 560×176 viewBox, rendering 109px tall at 390px wide: emblem 50px with a 9px wordmark, Farsi label overflowing its circle, 21px tiles with sub-pixel glyphs. | VERIFIED | `src/hero-cables-reference.js` mobile band is now 560×216, hub 54, tiles 22. Measured at 390px: band 134px, emblem 67px, tiles 27px, `faOverflow: false`, `overflowX: 0`. Screenshot `artifacts/final-390.png`, `artifacts/rv-390-fa.png`. |
| HERO-02 | The motion control dropped out of position into the caption row between 761–960px, adding a 53px hole above the headline, and drifted onto the arc at 1024px. | VERIFIED | Removed the `position:static` fallback; control anchored to the stage's top inline-end corner. Gap above headline is now 15.7px at 768 (was 53.4), 15.4px at 1440. `btnCoversTile: false` at 320/390/768/1024/1440. |
| HERO-03 | Hero rhythm and band width let the illustration dominate the fold; hero was 990px tall at ≥1280. | FIXED | Band capped at 980px, padding/row-gap/heading/actions trimmed. Hero 928.6px at 1440×900 (was 990). Screenshot `artifacts/rv-1440-en.png`. |
| HERO-03a | At 1440×900 the demo card is still cut by ~48px at the viewport bottom (demo bottom 948px). Fitting it entirely would require shrinking the approved arc. | OPEN | Deliberate trade-off, not a regression. Options: shorten the arc, or accept the demo as a scroll continuation. Needs an owner design decision. |
| HERO-04 | Four header nav items overflowed their grid columns at 320px, running "Scholarships" into "Resources". | VERIFIED | ≤380px rule sets 11px labels and 2px gap. `navOverflow: false`, `overflowX: 0` at 320px. Screenshot `artifacts/final-320.png`. |
| FLOW-01 | First-time entry journey: hero primary/secondary CTAs and all three guided options must open live targets. | VERIFIED | Click-through at 1440×900: `#documents-mount` (visible), `#research-explorer` (visible), `#assistant`, `#profile-mount`. Zero console or page errors. |
| DEMO-01 | Connected document/eligibility demonstration must reproduce extraction → verdict → next step. | VERIFIED | Read sample → degree `bachelor`, verdict Met, next step "Check accepted language tests". Associate → Not met + minimum-degree step. Master's → Met. |
| HERO-05 | `src/hero-document-demo.css` still carries a `min-width:761px` English grid block (rows 1/1, two columns) that is dead code overridden by `hero-cables-reference.css`. | OPEN | No visual impact; removal is safe but touches cascade order, so it is a cleanup task, not a defect fix. |

## Phase 2 — Product correctness (not yet audited)

| ID | Area | Status |
| --- | --- | --- |
| CAT-01 | Scholarship catalog provenance and freshness handling | OPEN |
| ELIG-01 | Eligibility evaluation and Barrier PathFinder | OPEN |
| DOC-01 | Document extraction hardening (bounded parser vs OCR claims) | OPEN |
| AUTH-01 | Authentication and per-user data isolation | OPEN |
| DASH-01 | Dashboard functionality | OPEN |

## Phase 3 — Product quality (not yet audited)

| ID | Area | Status |
| --- | --- | --- |
| I18N-01 | Full fa/ps and RTL pass beyond the hero | OPEN |
| DS-01 | Design-system unification and responsive layouts | OPEN |
| A11Y-01 | Accessibility verification (axe, focus order, targets) | OPEN |
| PERF-01 | Performance verification | OPEN |

## Phase 4 — Release readiness (not yet audited)

| ID | Area | Status |
| --- | --- | --- |
| INFRA-01 | Backend integration, persistence, deployment configuration | OPEN |
| TEST-01 | Automated + browser test execution for the release candidate | OPEN |
| RC-01 | Release candidate and readiness report | OPEN |
| DEPLOY-01 | Production deployment | BLOCKED | Requires explicit owner authorization; not requested. |

## Standing constraints

- Production (`bursyar.vercel.app`) returns HTTP 503 from the requested project pause; it is
  not a development baseline and must not be deployed to.
- The Vercel preview is behind deployment protection (`302 → vercel.com/sso-api`); rendered
  checks are performed locally from the verified commit instead.
- No paid inference, no Vercel Agent Review, no unnecessary paid builds.
