import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('lazy chunks only mount into the render generation that requested them (BY-17)', () => {
  const guards = [...main.matchAll(/if\(gen!==mountGeneration\)return;/g)];
  assert.ok(guards.length >= 5, `expected a generation guard per lazy mount, found ${guards.length}`);
});

test('a re-render remounts every chunk that was already loaded (BY-17)', () => {
  assert.match(main, /for\(const name of mountedAt\.keys\(\)\)ensureMount\(name\);/);
  assert.match(main, /wireLazyMounts\(\);/);
});

test('eligibility follows the current render, not a stale compilation (BY-17)', () => {
  assert.match(main, /latestCompilation=analyzerInput\.analysis\?\.data\?\.compilation;/);
  assert.match(main, /mountEligibility\(document\.querySelector\('#eligibility-mount'\),state\.language,latestCompilation\?\?document\.querySelector\('#analyze-form'\)\?\.analysis\?\.data\?\.compilation\)/);
});
