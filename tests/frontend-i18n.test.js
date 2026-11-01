import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translations} from '../src/i18n.js';
import {journeyCopy} from '../src/journey-copy.js';
import {recoveryCopy} from '../src/recovery-copy.js';
import {actionText} from '../src/gap-actions.js';
import {assessmentActionText} from '../src/pathfinder.js';
import {sampleScholarships,filterScholarships,localizedCountry,localizedLevel,countryLabels,levelLabels} from '../src/catalog.js';

const ARABIC = /[\u0600-\u06ff]/;
const LANGS = ['en', 'fa', 'ps'];

function assertParity(name, module) {
  const keys = Object.keys(module.en).sort();
  assert.ok(keys.length > 3, `${name}.en`);
  for (const lang of ['fa', 'ps']) assert.deepEqual(Object.keys(module[lang]).sort(), keys, `${name}.${lang}`);
}

function assertLocalizedStrings(name, module) {
  for (const lang of ['fa', 'ps']) {
    for (const [key, value] of Object.entries(module[lang])) {
      assert.equal(typeof value, 'string', `${name}.${lang}.${key}`);
      assert.ok(value.length > 0, `${name}.${lang}.${key}`);
      assert.match(value, ARABIC, `${name}.${lang}.${key}`);
    }
  }
}

test('exported UI copy keeps identical keys across en/fa/ps', () => {
  assertParity('translations', translations);
  assertParity('journeyCopy', journeyCopy);
  assertParity('recoveryCopy', recoveryCopy);
  assertParity('actionText', actionText);
  assertParity('assessmentActionText', assessmentActionText);
});

test('fa/ps UI copy is present and uses Arabic script', () => {
  assertLocalizedStrings('translations', translations);
  assertLocalizedStrings('journeyCopy', journeyCopy);
  assertLocalizedStrings('recoveryCopy', recoveryCopy);
  assertLocalizedStrings('actionText', actionText);
  assertLocalizedStrings('assessmentActionText', assessmentActionText);
});

test('demo explorer labels cover every sample country and level', () => {
  for (const entry of [...Object.values(countryLabels), ...Object.values(levelLabels)]) {
    assert.deepEqual(Object.keys(entry).sort(), ['en', 'fa', 'ps']);
    assert.match(entry.fa, ARABIC);
    assert.match(entry.ps, ARABIC);
  }
  for (const row of sampleScholarships) {
    assert.ok(countryLabels[row.country], row.country);
    assert.ok(levelLabels[row.level], row.level);
    assert.equal(localizedCountry(row.country, 'en'), row.country);
    assert.equal(localizedLevel(row.level, 'en'), row.level);
  }
  assert.equal(localizedCountry('Atlantis', 'fa'), 'Atlantis');
  assert.equal(localizedLevel('Certificate', 'ps'), 'Certificate');
});

test('demo search matches English and localized country/level names', () => {
  assert.equal(filterScholarships(sampleScholarships, {q: 'canada'}).length, 1);
  assert.equal(filterScholarships(sampleScholarships, {q: 'کانادا'}).length, 1);
  assert.equal(filterScholarships(sampleScholarships, {q: 'کاناډا'}).length, 1);
  assert.equal(filterScholarships(sampleScholarships, {q: 'جرمني'}).length, 1);
  assert.equal(filterScholarships(sampleScholarships, {q: 'ماستری'}).length, 1);
  assert.equal(filterScholarships(sampleScholarships, {q: 'nonexistent'}).length, 0);
  assert.equal(filterScholarships(sampleScholarships, {country: 'Germany'}).length, 1);
  assert.equal(filterScholarships(sampleScholarships, {level: 'PhD'}).length, 1);
});

test('main shell wires localized copy, counts and accessible close', () => {
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(main, /localizedCountry\(/);
  assert.match(main, /localizedLevel\(/);
  assert.match(main, /assistantCopy/);
  assert.match(main, /aria-label="\$\{esc\(t\.close\)\}"/);
  assert.match(main, /new Intl\.NumberFormat\(state\.language\)/);
  assert.match(main, /document\.title=/);
  assert.match(main, /meta\[name="description"\]/);
});
