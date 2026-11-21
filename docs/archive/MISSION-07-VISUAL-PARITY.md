# Mission 07 — MagicPath visual parity record

Verified 2026-11-02 against the live MagicPath account (Ali Azad) via MCP.

## Designs actually inspected (content retrieved, not assumed)

- Project `467709177326874624` — "BursYar — Scholarship Workspace".
- Interactive workspace `467709203071508480` (`crisply-cave-6289`),
  revision `467712587358961664`: full TSX + CSS retrieved
  (`BursYarWorkspaceInteractive`, `BursYarFeatureWorkspace`).
- Mobile `467710391615655936` (`pure-storm-8589`): full TSX retrieved;
  it wraps the same interactive workspace with a mobile default
  (fa lang, profile page).
- No custom theme on the project; components share the Default
  Tailwind theme plus hand-written CSS.

Retrieved MagicPath tokens/patterns: paper `#f7f9fc`, white surfaces,
line `#e9edf3`, ink `#1e2939`, prototype blue `#556bd9` / `#5269d8`,
active-nav pill `#edf0ff`, eyebrow kickers, `page-heading` blocks,
`cards-grid` with art header + tags + `card-bottom` status row,
`studio-grid` two-column surfaces (radius 13px), timeline PathFinder
with progress track, badges/tabs, skeleton + empty states, RTL via
`dir` + logical flow, mobile drawer + single column under 600–850px.

## What Mission 07 integrated into the production app

All changes are CSS-first in `src/workspace-theme.css` (the approved
override layer); no framework, logic, auth, i18n-string, or API change:

- Solid paper overview panel (gradient removed per mission rule),
  eyebrow kicker + numbered start cards (MagicPath `page-heading` /
  inventory pattern), RTL letter-spacing reset.
- One shared card system for both explorers: unified padding,
  `card-bottom` status row with top rule, single `--card-accent` top
  rule replacing the three rotating border colors (clutter reduction;
  structure preserved).
- Visible saved state via `[aria-pressed=true]` on the save toggle.
- Shared `.empty-note` empty state in the research explorer (was a
  plain paragraph), matching the sample explorer.
- Brand-tinted native disclosure markers, `cursor:progress` busy
  affordance (no animation), two-part footer row, phone card padding.
- `theme-color` aligned with `--bg` (`#f5f7fb`).

## Deliberately kept (with reason)

- Slate brand `#385675` instead of the prototype blue `#556bd9`:
  already approved in production and avoids an indigo-accent AI tell.
- `#9a6134` focus outline instead of MagicPath `#b4c2ff`: stronger
  contrast on light paper.
- Blockquote inline-start accent for source quotations: functional
  evidence/source distinction required by the evidence-first design,
  not decoration.
- Zero transitions: nothing to guard under `prefers-reduced-motion`.

## Not verified / remaining

- Fluent fa/ps review still pending (TRANSLATION-REVIEW.json).
- Assistive-technology and real-device review still pending; automated
  axe checks only.
- MagicPath art headers, icon set, and timeline checklist were not
  ported (would need new assets/markup; avoided before the deadline).
