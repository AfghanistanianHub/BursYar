import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {journeyCopy} from '../src/journey-copy.js';
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../src/workspace-theme.css', import.meta.url), 'utf8');

test('M16 next-steps section is always visible with a localized empty state', () => {
  assert.doesNotMatch(main, /<section id="next-steps" hidden>/);
  assert.match(main, /<section id="next-steps"><h2>/);
  assert.match(main, /<p class="empty-note">\$\{esc\(j\.nextEmpty\)\} <a href="#assistant">\$\{esc\(j\.nextEmptyCta\)\}<\/a><\/p>/);
  for (const lang of ['en', 'fa', 'ps']) {
    assert.ok(journeyCopy[lang].nextEmpty?.length > 10, `${lang}.nextEmpty`);
    assert.ok(journeyCopy[lang].nextEmptyCta?.length > 3, `${lang}.nextEmptyCta`);
  }
});

test('M16 inactive analysis restores the empty state instead of hiding', () => {
  assert.match(main, /function paintNextEmpty\(\)/);
  assert.match(main, /if\(!active\)paintNextEmpty\(\)/);
  assert.doesNotMatch(main, /querySelector\('#next-steps'\)\.hidden/);
  assert.match(theme, /#next-actions>\*:not\(fieldset\):not\(\.empty-note\)::before/);
});

test('M16 stage-4 and journey links target a rendered section', () => {
  assert.match(main, /href="#next-steps"/);
  assert.match(main, /<div id="next-actions">/);
});
