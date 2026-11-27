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

## Phase 2 — Product correctness

| ID | Area | Status | Evidence |
| --- | --- | --- | --- |
| CAT-01 | Scholarship catalog provenance and freshness handling | VERIFIED | Audited 2026-11-20. 12 rows with unique IDs; every `sourceUrl` resolves through `researchSourceUrl` (https, no credentials, no other scheme); every row keeps `reviewStatus:'needs_reverification'`, `feeVerified:false` and `englishVerified:false`, so the confirmed-only fee/IELTS filters fail closed and no rules or eligibility fields exist. `data/scholarship-sources.json` ledger records are not rendered anywhere (`grep` finds them only in `tests/source-traceability.test.js`), so no unreviewed excerpt reaches the UI. One freshness defect found and fixed: CAT-01a. |
| CAT-01a | Research cards printed `lastCheckedAt` straight from the export: the date was never aged, and a malformed value was printed as a check date, so a 33–40 day-old claim looked identical to a fresh one. | VERIFIED | `researchCheckedOn` now validates an ISO day and `researchFreshness` returns `fresh` inside the provenance's recheck window (30 days for a human source check, 14 for an automated read or unknown provenance), `stale` beyond it, and `unknown` for missing, malformed or future dates; the explorer renders `t.checkStale` for stale rows and falls back to “Unknown — confirm with provider” for an invalid date; `exportResearchSaved` exports the validated date only. On 2026-11-20 all 12 shipped rows measure 33–40 days old, so all 12 render the stale label at 1440×900 in English and Farsi (`document.querySelectorAll('#research-explorer-mount [data-freshness="stale"]').length` = 12 in both). Runtime probe of the module: 2026-11-18 → `fresh`, 2026-10-01 → `stale`, 30 days → `fresh`, 31 days → `stale`, `2026-02-30`/future/non-string → `unknown`. `npm test` 434/434 and `npm run build` exit 0. Follow-up guard: a check date is now only valid with a dated `docs/RESEARCH-RECHECK-<date>.md` naming every row that carries it, so the freshness gate cannot be satisfied by editing dates. Screenshot `artifacts/cat01-research-stale-1440.png`. |
| ELIG-01 | Eligibility evaluation and Barrier PathFinder | OPEN | — |
| DOC-01 | Document extraction hardening (bounded parser vs OCR claims) | OPEN | — |
| AUTH-01 | Authentication and per-user data isolation | OPEN | — |
| DASH-01 | Dashboard functionality | OPEN | — |

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
| TEST-01 | Automated + browser test execution for the release candidate | VERIFIED — see Phase 5 |
| RC-01 | Release candidate and readiness report | OPEN |
| DEPLOY-01 | Production deployment | BLOCKED | Requires explicit owner authorization; not requested. |

## Phase 5 — Verification recovery and accessibility (2026-11-27)

State recovery first: the handover named commits `79a9b54` (accessibility matrix) and
`f1715af` (documentation). Neither object exists in this repository, and the branch was
242 commits ahead of `origin/work/restore-approved-ai-studio-hero` (`b341544`), so the
local history had never been pushed and the reported hashes were never fetched here.
The work below starts from that local head; nothing was recreated or overwritten.

| ID | Defect | Correction | Evidence |
| --- | --- | --- | --- |
| TEST-01 | `npm run test:browser` appeared to hang. It was not deadlocked: the Playwright library default action timeout is `0`, so any element that never became actionable waited forever, and the suite printed nothing until it finished, which looks identical to a hang. | Each case announces itself before it runs and actions are bounded at 45 s, so a stall fails one named case with the locator in the message. The Chromium shared-library helper was also repaired: it resolved sonames through `packages.ubuntu.com`, which times out from CI-shaped networks, and now resolves them from the mirror's Contents index. | 15/15 cases, 0 axe violations, 0 overflow in `verification/artifacts/browser-report.json`; ~9.5 min on 2 vCPU. |
| NAV-01 | `#workspace-overview` mounted only when the intersection observer saw it, so it was an empty labelled `<section>` one pixel tall at y≈3378 on first load. Landmark jumps and hash links reached nothing, the guided entry links did not exist until the reader scrolled within 400 px, and the section grew when it finally mounted (a layout shift). | The workspace start card is a small static chunk and now mounts with the shell; the other regions stay lazy. | Six document/dashboard browser suites that open `#workspace-overview a[href="#profile-mount"]` went from timing out to passing. |
| AUTH-02 | Changing language rebuilt the shell but never re-rendered the account control, so `#account-controls` was left empty: the sign-in button disappeared until the next auth state change. | The language switch re-renders the account control into the fresh node. | Reproduced by reading the node after `selectOption`; `auth-feedback-browser` passes 24 localized cases. |
| AUTH-03 | The analyzer appended its own login/logout/status into the header's `#account-controls`, duplicating the menu entry once the analysis panel mounted, and the header's own button reported failures only to the console. | One control owns sign-in. `src/auth-feedback.js` holds the localized outcome mapping, used by the header control, which now renders a `role=status` message and keeps the button enabled; the analyzer no longer writes into the header. | `auth-feedback-browser` 24/24 in en/fa/ps; raw provider text (`auth/…`, `Firebase`, diagnostic markers) never reaches the message. |
| AUTH-04 | A build without Firebase configuration reported `auth_init` as a client error on every page load, which is an expected deployment state, not a fault. | The account control stays signed out and a sign-in attempt explains the configuration; the unexpected-error path is unchanged. | `responsive-probe` 30/30 viewports with zero console errors (previously 30 failures). |
| A11Y-02 | Scroll-entry animations faded whole sections to 0.55 opacity, so visible muted text measured 2.4–4.15:1 while a section was entering (guided entry kicker and option text, trust cells, source/interpretation pills). | The section entrance is a rise, not a fade: `bursyar-story-enter` animates `translateY` only. Artwork keeps its own fade. | axe (wcag2a, wcag2aa, wcag21aa) reports zero violations at 390 and 1440 with every disclosure open; `audit-remediation-browser` passes. |
| TEST-02 | Five browser suites mocked `src/auth.js` with an older export surface, so the lazy workspace/dashboard chunk's module graph failed and their panels never rendered. | Every mock now mirrors the real exports, and a Node test fails if any mock in `verification/` lags behind `src/auth.js`. | `document-review`, `document-library`, `document-ocr-integration`, `document-preview`, `auth-feedback` and `dashboard` suites pass. |
| TEST-03 | `dashboard-browser` simulated an outage with a real 503 and then asserted an empty console-error list, which cannot both hold: Chromium logs the failed resource itself. | The deliberate `/api/documents` 503 is exempted by name while any other console error and any unexpected 5xx response still fails the run. | `dashboard-browser` passes with the unexpected-response assertion in place. |
| TEST-04 | `audit-remediation-browser` required a server on port 3006 that nothing started, so the gate could not run in CI, and it counted hidden `h1` elements (the dashboard route view) as duplicate page headings. | The gate serves `dist/` itself when `BASE_URL` is unset, and counts visible `h1` elements, which is the actual rule. | `audit-remediation-browser` passes against the production build. |

## Phase 6 — Narrative motion, suite runtime, emulator rules (2026-11-27)

| ID | Defect | Correction | Evidence |
| --- | --- | --- | --- |
| A11Y-03 | The story and discovery scenes clipped with `overflow:hidden`. An `overflow` container is a scroll container, so it became the nearest scrollport for everything inside, and every `view()` timeline in the scene was pinned at one progress value: the paper and the discovery markers never moved as the reader scrolled, and the text-bearing cards sat at part-way opacity for good. The 2.3–4.1:1 readings behind A11Y-02 were this permanent state, not a transient animation frame. | `overflow:clip` keeps identical visual clipping without creating a scrollport, so the timelines resolve against the page again. The paper, the guidance copy and the discovery markers animate position and scale only. | `verification/animation-accessibility.mjs` (three languages × phone and desktop) sweeps the page and finds 0 contrast failures, measures the paper moving `19.48px → 5.65px → 0px` as it travels up the viewport, and confirms the reduced-motion build shows final state. `tests/narrative-scroll-timelines.test.js` fails if the scenes go back to `overflow:hidden` or a text-bearing entrance regains an opacity fade. |
| TEST-05 | The browser suite gave only a total runtime, so the slow cases were invisible, and it ran 15 cases one after another: 549 s on 2 vCPU. | Each case records its duration in `browser-report.json`, and `verification/browser-parallel.mjs` runs one process per language with a two-worker pool. Every width and every assertion is unchanged; only scheduling changed. | 374 s wall for the same 15 cases, 0 axe violations, 0 overflow, every case still exercised (`caseTimings` in the report). `BROWSER_PARALLEL=1` restores the serial run, `BROWSER_CASE`/`BROWSER_TIMING` narrow or profile one case. |
| TEST-07 | The authenticated dashboard asserted overflow at 320/390/1280 and RTL direction, but it never ran an accessibility scan: every axe gate in the suite stopped at the public pages, so the signed-in workspace, its document lists and its PathFinder panel were unchecked. | The dashboard case now scans itself at each width and in each language, and it needed a browser context rather than a bare page because the scanner opens its own page in the same context. | `dashboard-browser` passes with zero violations at 320, 390 and 1280 px and in fa, ps and en. |
| TEST-06 | `npm run test:emulator` had never run here: there is no JRE in the sandbox, so the Firestore/Auth emulators could not start and the rules were unverified. | A free Temurin 21 JDK installed outside the repository (`JAVA_HOME=/tmp/jdk`) is enough; the emulator jars download on first use. | 58 checks pass in `LOCAL_EMULATORS_WITH_FAKE_MODEL`: published records readable by anonymous and signed-in readers, drafts and review logs denied, every write denied for every context, Google sign-in through the Auth emulator, custom-claim propagation, quota enforcement, and two accounts kept apart in the document store. Live Firebase stays unverified. |

Not verified in this phase: live Google sign-in and hosted document acceptance (owner credentials),
fluent Dari/Pashto semantic review (`docs/TRANSLATION-REVIEW.json`), and production publication
(the release gate requires the commit on `main`, and merging to `main` is out of scope by
instruction).

## Standing constraints

- Production (`bursyar.vercel.app`) returns HTTP 503 from the requested project pause; it is
  not a development baseline and must not be deployed to.
- The Vercel preview is behind deployment protection (`302 → vercel.com/sso-api`); rendered
  checks are performed locally from the verified commit instead.
- No paid inference, no Vercel Agent Review, no unnecessary paid builds.
