import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const theme = readFileSync(new URL('../src/workspace-theme.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

const aiHero = readFileSync(new URL('../src/ai-hero.css', import.meta.url), 'utf8');
test('M14 AI-first hero has real workflow, source-to-evidence visualization, and original CTAs', () => {
  assert.match(main, /<div class="hero-actions">/);
  assert.match(main, /<p class="hero-kicker">\$\{esc\(j\.heroKicker\)\}<\/p>/);
  assert.match(main, /<aside class="hero-visual ai-hero-visual"/);
  assert.match(main, /class="ai-network"/);
  for (const label of ['SOURCE', 'DOCUMENT', 'CRITERIA', 'EVIDENCE', 'ELIGIBILITY', 'PATHFINDER']) {
    assert.match(main, new RegExp('>' + label + '<'));
  }
  assert.match(main, /class="ai-hero-verdict"/);
  assert.match(main, /\$\{esc\(j\.flowNote\)\}/);
  assert.match(main, /EN · فارسی · پښتو/);
  assert.match(main, /href="#research-explorer" data-open="\.resources"/);
  assert.match(theme, /\.hero-copy h1\{font-size:clamp\(2rem,4\.2vw,3rem\)/);
  assert.match(aiHero, /max-height:none/);
  assert.match(aiHero, /prefers-reduced-motion:reduce/);
  assert.match(aiHero, /\.ai-pulses\{display:none\}/);
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
