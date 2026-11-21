# Multilingual typography milestone — 29 October 2026

Branch `feat/multilingual-typography`, stacked on `agent/bursyar-takeover-df351be` (PR #17 head). No backend, retrieval, inference, auth, quota, or billing changes. No merge, deploy, submit, or paid inference.

## Fonts selected and why (all OFL-1.1, locally hosted WOFF2 via Fontsource, no runtime CDN)

- English: **Inter** 400/500/600/700 (latin + latin-ext, unicode-range partitioned). Neutral grotesque tuned for UI; tabular figures for identifiers.
- Dari: **Vazirmatn** 400/500/600/700 (arabic + latin + latin-ext). Designed for Persian/Arabic script; high x-height match with Inter keeps mixed-language lines even.
- Pashto: **Vazirmatn primary + Noto Naskh Arabic fallback** 400/500/600/700. Vazirmatn was chosen for UI consistency, Noto Naskh Arabic for coverage, not appearance.
- Technical identifiers/URLs/digests: system monospace stack (`ui-monospace, SF Mono, Menlo, Consolas`), always LTR even inside RTL.

## Glyph-coverage evidence (fontTools cmap audit of the vendored files)

- 22 probed codepoints: Pashto letters ټ ځ څ ډ ړ ږ ښ ګ ڼ ې, ی ئ, چ ح? (U+0681 U+0685 U+0693 U+0696 U+069A U+06BC U+06CD U+06D0 U+06CF U+067E U+0686 U+0698 U+06AB U+06B1), kashida U+0640, Extended Arabic-Indic digits, ؟ ، ؛.
- **Vazirmatn arabic-400: 21/22** — misses only U+06B1 (366 glyphs in cmap).
- **Noto Naskh Arabic arabic-400: 22/22** — full coverage (1,225 glyphs in cmap), so the fallback chain `Vazirmatn, "Noto Naskh Arabic"` closes the single gap.
- Browser proof: `verification/typography-probe.mjs` forces `document.fonts.load('16px "Noto Naskh Arabic"', '\u06B1')` and it resolves; all six language/width cases pass with zero external font requests.

## Type system (tokens in `src/style.css`, fonts in `src/fonts.css`)

- `--fs-hero: clamp(2rem, 4.7vw, 3rem)`, `--fs-h2: 1.625rem` (1.375rem ≤600px), `--fs-h3: 1.125rem`, `--fs-lead: 1.125rem` (1.0625rem mobile), body 1rem (never below 16px), small 0.875rem, caption/mono 0.8125rem.
- Line height: Latin body 1.6, RTL body 1.9; headings tight (1.2 hero / 1.35 h2) with 1.6 for RTL hero.
- Letter spacing: −0.035em hero / −0.02em h2 for Latin only; **all Arabic-script headings, buttons, summaries reset to 0** (Latin tracking corrupts joined script).
- Measure: hero 22ch (26ch RTL), lead 52ch, about 65ch; `text-wrap: balance` on headings, `pretty` on paragraphs.
- Mixed text: digests/evidence/`http` links get `direction: ltr; unicode-bidi: embed` inside RTL; `input[type=url]` stays LTR.

## Visual polish (no new components, no redesign)

Alignment, form proportions, and focus ring unchanged (44px targets, 3px `#986038` outline verified by axe). Fixes: RTL letter-spacing reset extended beyond h1/h2; mono treatment for digests; mobile h2 scale; hero text-wrap. No extra cards, gradients, or illustrations.

## Verification

- `verification/typography-probe.mjs`: **6/6 pass** — per-language stack applied, Inter + Vazirmatn loaded, Vazirmatn arabic-400 fetched on fa/ps, Noto on-demand fallback resolves U+06B1, **zero external font requests** (all same-origin WOFF2).
- `npm run test:browser`: **15/15 pass** (en/fa/ps × 320/390/768/1280/1440, axe clean, no horizontal overflow, 200% text + layout zoom, keyboard path) with the new fonts active.
- `npm test` pass, `test:evaluation` 33/33 offline, `npm run build` pass (WOFF2 emitted to `dist/assets`), `npm audit` 0 vulnerabilities.
- Before/after hero shots: `verification/artifacts/typography/before-hero-{en,fa,ps}-{390,1280}.png` (system-ui proxy) vs `after-{lang}-{width}.png`.

## Remaining visual limitations

Human Dari/Pashto typographic review still pending; Naskh fallback is coverage-driven (style blend with Vazirmatn unreviewed); no optical sizing or variable-font tuning; U+06B1 renders in Naskh while surrounding text is Vazirmatn; print styles untouched.
