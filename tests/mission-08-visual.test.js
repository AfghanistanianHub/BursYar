import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const theme = readFileSync(new URL('../src/workspace-theme.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('M08-1: source panel carries a visible heading reusing its label', () => {
  assert.match(main, /<section class="assistant" id="assistant" aria-labelledby="assistant-heading"><h2 id="assistant-heading">\$\{esc\(welcome\.understand\)\}<\/h2>/);
  assert.match(theme, /\.assistant>h2\{margin:0 0 4px\}/);
});

test('M08-2: pre-analysis eligibility disclosure renders as a card', () => {
  assert.match(theme, /#eligibility-example\{background:var\(--surface\);border:1px solid var\(--line\)/);
  assert.match(theme, /#eligibility-example>summary::marker/);
});

test('M08-3: cards share a flat embedded-glyph header band', () => {
  assert.match(theme, /--glyph-doc:url\("data:image\/svg\+xml,/);
  assert.match(theme, /\.scholarship::before\{[^}]*background:var\(--brand-ghost\) var\(--glyph-doc\) no-repeat center/);
  assert.match(theme, /\.scholarship\{padding:18px 20px;gap:8px;overflow:hidden\}/);
  assert.match(theme, /\.scholarship::before\{margin-block-start:-16px;margin-inline:-16px/);
  assert.doesNotMatch(theme, /linear-gradient|radial-gradient/);
});

test('M08-4: PathFinder rails and status dots read as a timeline', () => {
  assert.match(theme, /#next-actions\{gap:12px;border-inline-start-width:3px/);
  assert.match(theme, /#barrier-guidance\{border-inline-start-width:3px\}/);
  assert.match(theme, /#barrier-guidance p::before\{width:12px;height:12px\}/);
});

test('M08-5: eligibility verdict outweighs per-requirement items', () => {
  assert.match(theme, /#eligibility-demo #eligibility-result\{font-size:1\.0625rem;padding:14px 16px\}/);
});

test('M08-6: consent checkboxes lead their labels', () => {
  assert.match(theme, /#documents label:has\(input\[type=checkbox\]\) input,#profile label:has\(input\[type=checkbox\]\) input\{order:-1\}/);
  assert.match(theme, /#academic-evidence label:has\(input\[type=checkbox\]\)\{display:flex/);
});

test('M08-7: empty states pair centered text with a glyph', () => {
  assert.match(theme, /--glyph-search:url\("data:image\/svg\+xml,/);
  assert.match(theme, /\.empty-note\{text-align:center\}/);
  assert.match(theme, /\.empty-note::before\{[^}]*var\(--glyph-search\)/);
});
