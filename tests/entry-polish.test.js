import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translations} from '../src/i18n.js';
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const style = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const explorer = readFileSync(new URL('../src/research-explorer.js', import.meta.url), 'utf8');
const ARABIC = /[\u0600-\u06ff]/;

test('entry offers a skip link targeting the focusable main landmark', () => {
  assert.match(main, /<a class="skip-link" href="#top">\$\{esc\(t\.skipToContent\)\}<\/a>/);
  assert.match(main, /<main id="top" tabindex="-1">/);
  assert.match(style, /\.skip-link\{[^}]*position:fixed/);
  assert.match(style, /\.skip-link:focus-visible\{[^}]*top:8px/);
});

test('hero actions reuse localized labels and open their disclosures', () => {
  assert.match(main, /<div class="hero-actions">/);
  assert.match(main, /<a class="primary-link" href="#research-explorer" data-open="\.resources">\$\{esc\(ed\.explore\)\}/);
  assert.match(main, /<a class="primary-link secondary" href="#profile-mount" data-open="\.workspace">\$\{esc\(j\.profile\)\}<\/a>/);
  assert.match(main, /querySelectorAll\('\[data-open\]'\)/);
  assert.match(main, /el\.dataset\.open/);
});

test('hero action targets and disclosures exist in the shell', () => {
  assert.match(explorer, /<section id="research-explorer"/);
  assert.match(main, /id="research-explorer-mount"/);
  assert.match(main, /id="profile-mount"/);
  assert.match(main, /<details class="workspace">/);
  assert.match(main, /<details class="resources">/);
  assert.match(style, /\.hero-actions\{display:flex;flex-wrap:wrap/);
  assert.match(style, /max-width:700px\)\{\.hero-actions>\*\{flex:1 1 100%\}/);
});

test('skip link label is localized in English, Farsi and Pashto', () => {
  assert.equal(typeof translations.en.skipToContent, 'string');
  assert.ok(translations.en.skipToContent.length > 0);
  for (const lang of ['fa', 'ps']) {
    assert.equal(typeof translations[lang].skipToContent, 'string', lang);
    assert.match(translations[lang].skipToContent, ARABIC, lang);
  }
});
