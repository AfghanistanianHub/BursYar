# MISSION 14 — Visual Delivery

Mission 14 answered the owner's failed visual acceptance test
("mostly text and infrastructure") with a genuinely designed first viewport
and workflow band, built on the real application. No redesign of approved
components, no new framework, no contract changes.

Branch: `feat/mission-14-visual-rescue` · PR #77, merged as `0617350` ·
Production verified serving `index-CqvJyleI.js` with new hero + 4-stage band.

## Before / After

Evidence screenshots: `docs/mission-14/` (full-resolution originals in
`/tmp/m14cuts/` on the build machine).

| Viewport | Before | After |
|---|---|---|
| 1440 en | `before-en-1440.jpg` | `final-en-1440.jpg` |
| 390 en | `before-en-390.jpg` | `final-en-390.jpg` |
| 1440 fa | `before-fa-1440.jpg` | `final-fa-1440.jpg` |
| 1440 ps | `before-ps-1440.jpg` | `final-ps-1440.jpg` |
| 390 fa | — | `final-fa-390.jpg` |
| 1024 en | — | `a3-en-1024.jpg` |
| 320 en | — | `a3-en-320.jpg` |
| 390 ps | — | `a3-ps-390.jpg` |

macOS: `open docs/mission-14` (or `/tmp/m14cuts` for full resolution).

### Diagnosis (Phase 1)

- Hero was a single narrow text column (`max-width: 70ch`) + two links; no
  focal visual, no product identity, no visible hierarchy beyond type size.
- Workspace below was undifferentiated bordered cards; eligibility verdicts
  differed only in text; PathFinder steps were uncapped prose.
- Journey nav and section headers had no iconography; no workflow narrative.

## Components redesigned

1. **Hero** (`src/main.js`, `workspace-theme.css`): asymmetric 7fr/5fr
   composition — kicker, two-line headline (≤19ch), 3–4 line description,
   two CTAs beside an "evidence chain" preview card (Source details →
   Requirements → My eligibility, real fixture quotation, status pills).
2. **How-it-works band**: 4 linked stage cards (profile → source → assess →
   next steps) with connector track, numbered nodes, anchor links to live
   workspace mounts. Mirrors 4→1 in RTL.
3. **Journey nav icons**: embedded SVG glyph before each step (`--glyph-*`),
   logical-property aware, RTL flips horizontally.
4. **Section headers**: glyph + rule treatment reused from MagicPath audit.
5. **Eligibility verdicts**: status-differentiated surfaces (green/red/amber
   borders + header bands) for MET / NOT MET / UNKNOWN output and `<details>`.
6. **Source surface**: approved/doc text styling consistent with palette.
7. **PathFinder**: CSS-counter numbering scoped to `li` (fieldset-safe), plus
   node styling for generated journey lists.

Palette kept: slate brand `#385675`, ink `#1b2b3a`, high-contrast focus
`#9a6134`. Zero gradients, zero animation, zero new fonts, zero new deps.

## MagicPath assets used

Retrieved live via MCP: project `467709177326874624`, interactive workspace
`crisply-cave-6289` (comp `467709203071508480`, rev `467712587358961664`),
mobile workspace `pure-storm-8589` (comp `467710391615655936`).
Embedded 6 data-URI SVG glyphs (doc, search, meters, shield, user) recolored
to the approved slate brand; slate `#556bd9` prototype blue was rejected to
avoid the generic AI-dashboard tell.

## Functional regressions: none

- All new strings live in existing `journeyCopy` (9 new keys/lang, 22 total).
  Translation scope now 399+399 fa/ps pending human review.
- No route, contract, API, auth, quota, or spending-gate changes.
- `Source details`/`Requirements`/`My eligibility` labels reuse existing
  workspace vocabulary; hero preview is static composition + anchor links.

## Verification

| Suite | Result |
|---|---|
| `npm test` | 337/337 (incl. 6 new mission-14) |
| `npm run test:evaluation` | 60/60 offline |
| `npm run build` | clean (`index-sFMRNDMW.js`) |
| typography probe | 6/6, zero external font requests |
| `npm run test:browser` | 15/15 (mock auth/API) |
| research browser | fa + ps passed, zero POST |
| document-review browser | fa + ps passed, no inference |

Visual QA: 320/390/768/1024/1440 × en/fa/ps inspected; no horizontal
overflow at any width; RTL mirrors correctly (hero flips, stages read 4→1,
glyphs flip).

## Remaining defects

- New fa/ps hero/marketing strings are machine-drafted, unreviewed by a
  fluent speaker (tracked in `docs/TRANSLATION-REVIEW.json`).
- Assistive-tech and real-device review still pending (axe + Chromium only).
- Portal video rules still owner-gated (Mission 13 status unchanged).
