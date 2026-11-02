import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const journey = readFileSync(new URL('../src/journey-navigation.js', import.meta.url), 'utf8');
const journeyCss = readFileSync(new URL('../src/journey-navigation.css', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../src/auth.js', import.meta.url), 'utf8');
const analyzer = readFileSync(new URL('../src/analyzer.js', import.meta.url), 'utf8');
const preview = readFileSync(new URL('../src/source-preview.js', import.meta.url), 'utf8');
const style = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const browserHarness = readFileSync(new URL('../verification/browser.mjs', import.meta.url), 'utf8');

test('journey steps rely on list numbering instead of duplicated prefixes', () => {
  for (const key of ['profile', 'source', 'assessment', 'next']) {
    assert.doesNotMatch(journey, new RegExp(key + ":'[0-9\\u06F0-\\u06F9]"));
  }
  assert.match(journey, /createElement\('ol'\)/);
  assert.match(journeyCss, /list-style-type:decimal/);
  assert.match(journeyCss, /list-style-type:persian/);
});

test('account popover dismisses without obscuring content and auth buttons toggle', () => {
  assert.match(auth, /onAuthChange/);
  assert.match(analyzer, /onAuthChange\(/);
  assert.match(analyzer, /login\.hidden=.*signedIn/);
  assert.match(analyzer, /logout\.hidden=/);
  assert.match(analyzer, /details\.account/);
  assert.match(analyzer, /Escape/);
  assert.match(browserHarness, /onAuthChange/);
});

test('journey navigation marks the visible section without changing links', () => {
  assert.match(journey, /aria-current/);
  assert.match(journey, /IntersectionObserver/);
  assert.match(journeyCss, /aria-current/);
  assert.match(journey, /profile-mount.*assistant.*eligibility-mount.*next-steps/s);
  assert.match(journey, /offline\.addEventListener\('click',\(\)=>\{[^}]*removeAttribute\('aria-current'\)/);
});

test('phone widths wrap journey chips so no step hides in scroll', () => {
  assert.match(journeyCss, /max-width:700px[\s\S]*?\.journey-nav ol\{[^}]*flex-wrap:wrap/);
  assert.match(journeyCss, /max-width:700px[\s\S]*?\.journey-nav li\{[^}]*flex:1 1 40%/);
});

test('barrier guidance exposes per-requirement status and honest counts', () => {
  assert.match(analyzer, /barrier-summary/);
  assert.match(analyzer, /dataset\.status/);
  assert.match(analyzer, /barrierLabels/);
  assert.match(style, /barrier-summary/);
});

test('source progression is visible while approval gating stays intact', () => {
  assert.match(preview, /source-progression/);
  assert.match(preview, /aria-current/);
  assert.equal((preview.match(/steps:\[/g) ?? []).length, 3);
  assert.match(preview, /submit\.disabled=busy\|\|!approval\.checked/);
  assert.match(preview, /!busy&&approval\.checked/);
  assert.match(style, /\.source-steps/);
  assert.match(style, /source-steps.*persian|persian.*source-steps/s);
});
