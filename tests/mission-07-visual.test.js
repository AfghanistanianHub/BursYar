import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const theme = readFileSync(new URL('../src/workspace-theme.css', import.meta.url), 'utf8');
const explorer = readFileSync(new URL('../src/research-explorer.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('mission 07 theme keeps the approved slate tokens', () => {
  assert.match(theme, /--bg:#f5f7fb/);
  assert.match(theme, /--brand:#385675/);
  assert.match(theme, /--brand-dark:#243f5b/);
});

test('mission 07 uses no gradients, decorative transitions or rotating accents', () => {
  assert.doesNotMatch(theme, /linear-gradient|radial-gradient/);
  assert.doesNotMatch(theme, /transition/);
  assert.doesNotMatch(theme, /nth-child\(3n/);
  // Mission 08 replaced the top rule with a shared header band (M08-3).
  assert.doesNotMatch(theme, /--card-accent/);
  assert.match(theme, /\.scholarship::before\{[^}]*var\(--glyph-doc\)/);
});

test('mission 07 unifies opportunity cards across both explorers', () => {
  assert.match(theme, /\.scholarship\{padding:18px 20px/);
  assert.match(theme, /\.scholarship \.card-bottom\{border-top:1px solid var\(--line-soft\)/);
  assert.match(theme, /\[data-research-save\]\[aria-pressed=true\]/);
});

test('mission 07 gives the research explorer the shared empty state', () => {
  assert.match(explorer, /<p class="empty-note">\$\{esc\(t\.empty\)\}<\/p>/);
});

test('mission 07 keeps RTL-safe kickers and native disclosure markers', () => {
  assert.match(theme, /\[dir=rtl\] \.workspace-kicker\{letter-spacing:0\}/);
  assert.match(theme, /summary::marker\{color:var\(--brand\)\}/);
  assert.match(theme, /scroll-margin-top:90px/);
});

test('mission 07 keeps phone rules and honest busy affordance', () => {
  assert.match(theme, /max-width:700px\)\{\.workspace-overview-grid\{grid-template-columns:1fr\}/);
  assert.match(theme, /\[aria-busy=true\]\{cursor:progress\}/);
});

test('mission 07 matches the browser chrome to the paper background', () => {
  assert.match(index, /<meta name="theme-color" content="#f5f7fb"\/>/);
});
