import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const theme = readFileSync(new URL('../src/workspace-theme.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('hero pairs the document reader with the editable example and retains both entry actions', () => {
  assert.ok(main.includes('${heroDocumentReader(state.language)}</div>${heroDocumentDemo(state.language)}'));
  assert.ok(main.includes('href="#documents-mount" data-open=".workspace"'));
  assert.ok(main.includes('href="#research-explorer" data-open=".resources"'));
});

test('M14 workflow band links the four journey stages', () => {
  assert.match(main, /<section class="how-it-works" aria-label="\$\{esc\(j\.howTitle\)\}">/);
  assert.match(main, /<span class="step-num">\$\{fmt\.format\(1\)\}<\/span>/);
  assert.match(main, /href="#profile-mount" data-open="\.workspace"/);
  assert.match(main, /href="#eligibility-mount"/);
  assert.match(theme, /\.how-it-works ol::before\{[^}]*background:var\(--line\)/);
});

test('M14 icon set uses embedded original SVGs, no gradients', () => {
  for (const glyph of ['glyph-quote', 'glyph-shield', 'glyph-chart', 'glyph-route', 'glyph-profile', 'glyph-check']) {
    assert.match(theme, new RegExp('--' + glyph + ':url\\("data:image\\/svg\\+xml,'));
  }
  assert.doesNotMatch(theme, /linear-gradient|radial-gradient/);
  assert.match(theme, /\.journey-nav li:nth-child\(1\)::after\{background:var\(--glyph-profile\)/);
});

test('M14 verdict cards differentiate the three states', () => {
  assert.match(theme, /#eligibility-demo output\[data-status=met\]::before\{background-image:var\(--glyph-check\)\}/);
  assert.match(theme, /#eligibility-demo output\[data-status=not_met\]::before/);
  assert.match(theme, /#eligibility-demo output\[data-status=unknown\]::before/);
  assert.match(theme, /#eligibility-details li\[data-status=unknown\]\{border-color:var\(--warn\)\}/);
  assert.match(theme, /\.chain-verdicts \[data-status=not_met\]\{color:var\(--bad\)/);
});

test('M14 PathFinder numbers steps without touching fieldsets', () => {
  assert.match(theme, /#next-actions\{counter-reset:by-step\}/);
  assert.match(theme, /#next-actions>\*:not\(fieldset\):not\(\.empty-note\)::before\{counter-increment:by-step/);
  assert.match(theme, /#barrier-guidance p:not\(\.barrier-summary\)::after\{content:counter\(by-barrier\)/);
});

test('M14 keeps full-width bands above the desktop sidebar', () => {
  assert.match(theme, /@media\(min-width:1024px\)\{\.how-it-works\{grid-column:1\/-1\}\}/);
  assert.match(theme, /#journey-nav-mount\{grid-row:3\/span 8\}/);
});
