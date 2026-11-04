import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translations} from '../src/i18n.js';
import {journeyCopy} from '../src/journey-copy.js';
import {recoveryCopy} from '../src/recovery-copy.js';
import {actionText} from '../src/gap-actions.js';
import {assessmentActionText,barrierLabels} from '../src/pathfinder.js';
import {researchCopy} from '../src/research-copy.js';
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
  assertParity('researchCopy', researchCopy);
  assertParity('actionText', actionText);
  assertParity('assessmentActionText', assessmentActionText);
  assertParity('barrierLabels', barrierLabels);
});

test('fa/ps UI copy is present and uses Arabic script', () => {
  assertLocalizedStrings('translations', translations);
  assertLocalizedStrings('journeyCopy', journeyCopy);
  assertLocalizedStrings('recoveryCopy', recoveryCopy);
  assertLocalizedStrings('researchCopy', researchCopy);
  assertLocalizedStrings('actionText', actionText);
  assertLocalizedStrings('assessmentActionText', assessmentActionText);
  assertLocalizedStrings('barrierLabels', barrierLabels);
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
  assert.match(main, /welcome\.understandNote/);
  assert.match(main, /const welcome=\{/);
  assert.match(main, /aria-label="\$\{esc\(t\.close\)\}"/);
  assert.match(main, /new Intl\.NumberFormat\(state\.language\)/);
  assert.match(main, /noResults/);
  assert.match(main, /class="empty-note"/);
  assert.match(main, /class="count" role="status"/);
  assert.match(main, /document\.title=/);
  assert.match(main, /meta\[name="description"\]/);
});

function assertShapeEqual(path, en, other) {
  if (typeof en === 'string' || typeof other === 'string') {
    assert.equal(typeof en, 'string', `${path} en type`);
    assert.equal(typeof other, 'string', `${path} other type`);
    return;
  }
  if (Array.isArray(en) || Array.isArray(other)) {
    assert.ok(Array.isArray(en) && Array.isArray(other), `${path} array`);
    assert.equal(en.length, other.length, `${path} length`);
    en.forEach((item, i) => assertShapeEqual(`${path}[${i}]`, item, other[i]));
    return;
  }
  assert.ok(en && typeof en === 'object', `${path} en object`);
  assert.ok(other && typeof other === 'object', `${path} other object`);
  assert.deepEqual(Object.keys(other).sort(), Object.keys(en).sort(), `${path} keys`);
  for (const key of Object.keys(en)) assertShapeEqual(`${path}.${key}`, en[key], other[key]);
}

function assertParityDeep(name, module) {
  assert.deepEqual(Object.keys(module).sort(), ['en', 'fa', 'ps'], `${name} langs`);
  assertShapeEqual(name, module.en, module.fa);
  assertShapeEqual(name, module.en, module.ps);
}

function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, out);
  else if (value && typeof value === 'object') for (const item of Object.values(value)) collectStrings(item, out);
  return out;
}

function assertLocalizedStringsDeep(name, module) {
  for (const lang of ['fa', 'ps']) {
    const strings = collectStrings(module[lang]);
    assert.ok(strings.length > 0, `${name}.${lang} has strings`);
    for (const value of strings) {
      assert.equal(typeof value, 'string', `${name}.${lang} type`);
      assert.ok(value.length > 0, `${name}.${lang} non-empty`);
      assert.match(value, ARABIC, `${name}.${lang}: ${value.slice(0, 48)}`);
    }
  }
}

let workflowCopyPromise = null;
async function loadWorkflowCopy() {
  workflowCopyPromise ??= (async () => {
    // Mounted modules register document listeners at import time; stub only that surface.
    if (typeof globalThis.document === 'undefined') {
      globalThis.document = {addEventListener() {}, dispatchEvent() {}, querySelector() { return null; }};
    }
    const [journey, analyzer, preview, documents, profile, academic, local, eligibility] = await Promise.all([
      import('../src/journey-navigation.js'),
      import('../src/analyzer.js'),
      import('../src/source-preview.js'),
      import('../src/documents.js'),
      import('../src/profile-form.js'),
      import('../src/academic-evidence-form.js'),
      import('../src/local-workflow.js'),
      import('../src/eligibility-demo.js'),
    ]);
    return {
      journeyNavCopy: journey.journeyNavCopy,
      analyzerCopy: analyzer.analyzerCopy,
      analyzerCoverage: analyzer.analyzerCoverage,
      analyzerInventoryLabels: analyzer.analyzerInventoryLabels,
      analyzerOxfordNotice: analyzer.analyzerOxfordNotice,
      sourcePreviewCopy: preview.sourcePreviewCopy,
      documentsCopy: documents.documentsCopy,
      libraryCopy: documents.libraryCopy,
      profileCopy: profile.profileCopy,
      academicEvidenceCopy: academic.academicEvidenceCopy,
      localWorkflowCopy: local.localWorkflowCopy,
      eligibilityCopy: eligibility.eligibilityCopy,
      eligibilityExtra: eligibility.eligibilityExtra,
      eligibilityOrigins: eligibility.eligibilityOrigins,
      eligibilityLiveCopy: eligibility.eligibilityLiveCopy,
      eligibilityExample: eligibility.eligibilityExample,
    };
  })();
  return workflowCopyPromise;
}

test('mounted workflow copy keeps identical structure across en/fa/ps', async () => {
  const tables = await loadWorkflowCopy();
  for (const [name, module] of Object.entries(tables)) assertParityDeep(name, module);
});

test('mounted workflow fa/ps copy is present and uses Arabic script', async () => {
  const tables = await loadWorkflowCopy();
  for (const [name, module] of Object.entries(tables)) assertLocalizedStringsDeep(name, module);
});
