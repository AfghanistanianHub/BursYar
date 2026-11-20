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
| HERO-03 | Hero rhythm and band width let the illustration dominate the fold; hero was 990px tall at ≥1280. | VERIFIED | Band capped at 980px; padding, row-gap, heading and action margins trimmed. Hero 836.2px at 1440×900 (was 990). |
| HERO-03a | At 1440×900 the demo card was cut 59.6px below the viewport (demo bottom 959.6px). | VERIFIED | 14px came from cropping the viewBox's 26 units of empty space below the arc baseline (y=346) — the drawing is not rescaled: hub stays 94.5px, tiles 35px, and the Farsi emblem label keeps its pixel offset (10.4px below hub centre). The other 45.6px is spacing: hero padding 22/38 → 14/10, row-gap 20 → 10, lead margin 10 → 6, card margins 4 → 0, demo padding cap 1.45rem → 1.25rem. Measured demo bottom **895.2px at 1440×900, 4.8px headroom** (same at 1366×900). Screenshot `artifacts/fit3-1440.png`. |
| HERO-03b | At 1280×800 the demo card still ends 92.4px below the fold. | VERIFIED | Closed by the HERO-06 layout rework, not by shrinking the arc: demo bottom is now **641.5px at 1280×800 (158.5px headroom)**. |
| I18N-01a | At 1440×900 the Farsi hero does not fit: the two-line headline at 42px/1.45 is 18.8px taller than English, putting the demo card 41.4px below the viewport. Pashto fits with 46.8px headroom. | VERIFIED | The RTL headline gains a second column instead of eating vertical space. Measured Farsi demo bottom **666.5px at 1440×900 (233.5px headroom)** and **631.9px at 1024×768 (136.1px headroom)**, `overflowX: false`, mirrored columns (copy at inline-start/right, demo at left). Screenshots `artifacts/after-1440-fa.png`, `artifacts/after-1024-fa.png`. |
| HERO-04 | Four header nav items overflowed their grid columns at 320px, running "Scholarships" into "Resources". | VERIFIED | ≤380px rule sets 11px labels and 2px gap. `navOverflow: false`, `overflowX: 0` at 320px. Screenshot `artifacts/final-320.png`. |
| FLOW-01 | First-time entry journey: hero primary/secondary CTAs and all three guided options must open live targets. | VERIFIED | Click-through at 1440×900: `#documents-mount` (visible), `#research-explorer` (visible), `#assistant`, `#profile-mount`. Zero console or page errors. |
| DEMO-01 | Connected document/eligibility demonstration must reproduce extraction → verdict → next step. | VERIFIED | Read sample → degree `bachelor`, verdict Met, next step "Check accepted language tests". Associate → Not met + minimum-degree step. Master's → Met. |
| HERO-05 | `src/hero-document-demo.css` still carries a `min-width:761px` English grid block (rows 1/1, two columns) that is dead code overridden by `hero-cables-reference.css`. | VERIFIED | Dead block and its 761–950px heading rule removed while reworking the grid; `npm test` 431/431 and `npm run build` exit 0 confirm nothing depended on it. |
| HERO-06 | The desktop hero stacked three full-width rows — arc band, centered statement, then the source/demo pair — so the value proposition and the interactive demo were separated by the whole statement block and the demo sat at the bottom of the fold (895.2px at 1440×900, 842.3px at 1024×768). | VERIFIED | At ≥1024px the hero is a two-column editorial band under the centered arc: statement, primary CTA and source card in column 1, the interactive demo in column 2 starting on the headline's row (`grid-area:2/2/4/3`), equal columns, both cards flush to the hero's content edges. Demo bottom **895.2 → 643.3px at 1440×900** (headroom 4.8 → 256.7), **892.4 → 641.5px at 1280×800** (−92.4 → +158.5), **842.3 → 608.7px at 1024×768** (−74.3 → +159.3), and 780.3 → 760.5px at 768×1024. Hero height 836.2 → 637.4px at 1440. The arc is preserved, not shrunk: the viewBox lost only empty band above the emblem (y 56 → 80; scale is set by the unchanged 1120 width), so the emblem measures 94.5px at 1440, 89.4px at 1024, 66.7px at 768 and 66.9px at 390 — identical before and after — and the Farsi emblem label keeps its 10.4px offset below the hub. No negative margins. Phones (390×844, 360×800) keep the stacked order and are unchanged. Reduced motion verified: pulses `display:none`, motion button hidden, tile transforms static under `prefers-reduced-motion:reduce`. Screenshots `artifacts/before-*` vs `artifacts/after-*`. |

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
