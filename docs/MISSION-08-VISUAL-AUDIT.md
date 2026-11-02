# Mission 08 — MagicPath visual audit

Audited 2026-11-02: production build `7a74f8f` (PR #71) rendered locally
in Chromium against retrieved MagicPath source (project
`467709177326874624`, `crisply-cave-6289` rev `467712587358961664`,
`pure-storm-8589`). Screenshots: viewport captures at 320/390/1280 in
en/fa/ps plus full-page harness artifacts. No design scores assigned;
only observable defects and differences.

## P0 — Broken or blocking

None found. No horizontal overflow at 320px in any language, no
overlapping controls, no broken navigation, directionality correct.

## P1 — Significant visual or usability problems

### M08-1 · Source/analysis panel has no visible heading

- Area: layout clarity, first-impression journey.
- Observation: `.assistant` opens directly with helper copy; its name
  ("AI Scholarship Explainer") exists only as `aria-label`. Every
  other stage has a visible heading.
- MagicPath reference: `surface-title` with number + heading on the
  source-review surface.
- Disposition: fix in Mission 08 by adding an `h2` reusing the
  existing `t.assistant` key (zero new strings).

### M08-2 · Pre-analysis eligibility disclosure renders uncarded

- Area: card structure, journey stage 3.
- Observation: `#eligibility-example` is a bare `<details>` with no
  panel styling, so the stage looks anchorless before analysis.
- MagicPath reference: every stage sits on a `surface` card.
- Disposition: fix in Mission 08 with card styling (CSS only).

### M08-3 · Opportunity cards lack graphical headers

- Area: card structure, discovery delight.
- Observation: cards open directly with meta text; MagicPath cards
  carry an art header with glyph and index label.
- MagicPath reference: `.by-art` flat pastel header + `.art-core`
  glyph + `.art-index` label.
- Disposition: fix in Mission 08 with a flat CSS-only header band
  (embedded SVG glyph, no gradients, no new assets); replaces the
  Mission 07 top rule so both explorers share one treatment.

### M08-4 · PathFinder / next-step visualization is weak

- Area: journey stages 5–6, next-step clarity.
- Observation: `#next-actions` rail is thin and barrier items are
  undifferentiated paragraphs apart from small status dots.
- MagicPath reference: `timeline-item` rail with numbered nodes and a
  `path-summary` panel with progress track.
- Disposition: fix in Mission 08 by strengthening rails, spacing, and
  status dots (CSS only). Numbered nodes via pseudo-elements were
  rejected: `::before` already carries functional status color and
  `fieldset` children render pseudo-elements inconsistently.

### M08-5 · Eligibility result hierarchy is flat

- Area: journey stage 4, result comprehension.
- Observation: the summary `output` and per-requirement items share
  similar weight; the verdict does not stand out on first scan.
- MagicPath reference: `scenario-result` blocks with status-tinted
  backgrounds and larger summary type.
- Disposition: fix in Mission 08 by promoting the summary output
  (size, padding) and item header weight (CSS only). Verdict logic
  untouched.

## P2 — Minor refinements

### M08-6 · Consent checkbox follows its label text

- Area: documents, profile, academic-scores forms.
- Observation: the box renders at the inline end, after the sentence.
- Disposition: fix in Mission 08 with `order:-1` on the input
  (harmless where the box already leads; association unchanged).

### M08-7 · Empty states lack the icon treatment

- Area: discovery empty states.
- Observation: `.empty-note` is text-only; MagicPath pairs empty
  states with a glyph.
- Disposition: fix in Mission 08 with a small centered SVG glyph via
  `::before` (CSS only, symmetric, RTL-safe).

### M08-8 · Card-bottom actions differ between explorers

- Area: discovery consistency.
- Observation: research cards use link + primary + save; sample cards
  use pill + text button.
- Disposition: accepted. The two explorers have different purposes
  (real URLs vs illustrative rows); unifying actions would mislead.

### M08-9 · Journey nav lacks icon pills

- Area: navigation.
- Observation: MagicPath sidebar uses icon + label pills; production
  uses a native numbered list.
- Disposition: accepted. Native `ol` numbering (decimal/persian) is
  pinned by tests and is the correct trilingual pattern.

## Out of scope (unchanged)

- Fluent fa/ps review still pending (390 + 390 strings).
- Assistive-technology and real-device review still pending.
- No new i18n strings in Mission 08; translation scope counts stand.
