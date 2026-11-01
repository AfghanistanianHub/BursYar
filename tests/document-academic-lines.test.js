import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from '../engine/documents.js';
import {assessScholarship} from '../engine/eligibility.js';
const header = 'SYNTHETIC TEST ONLY — NOT A CERTIFICATE';
const gpaLine = 'GPA: 3.25/4.0';
const toeflLine = 'TOEFL iBT: overall=100; listening=25; reading=25; writing=25; speaking=25';
const withStore = run => {
  const dir = mkdtempSync(join(tmpdir(), 'bursyar-docs-academic-'));
  const store = new DocumentStore(join(dir, 'docs.db'));
  try { run(store); } finally { store.close(); rmSync(dir, {recursive: true, force: true}); }
};
test('GPA and TOEFL lines extract as bounded claims and stay unverified through review', () => {
  withStore(store => {
    const doc = store.upload('alice', {text: [header, 'Degree: bachelor', gpaLine, toeflLine].join('\n'), mime: 'text/plain', consent: true});
    assert.equal(doc.authenticity, 'not_verified');
    assert.equal(doc.consistency, 'not_assessed');
    assert.deepEqual(doc.pending.map(c => c.field), ['degree', 'gpa', 'languageTest']);
    const gpa = doc.pending.find(c => c.field === 'gpa');
    assert.deepEqual(gpa.value, {gpa: 3.25, scale: 4});
    assert.equal(gpa.sourceExcerpt, gpaLine);
    const toefl = doc.pending.find(c => c.field === 'languageTest');
    assert.deepEqual(toefl.value, {test: 'TOEFL iBT', overall: 100, sections: {listening: 25, reading: 25, writing: 25, speaking: 25}});
    const profile = store.review('alice', doc.id, Object.fromEntries(doc.pending.map(c => [c.id, {action: 'accept'}])));
    assert.equal(profile.gpa.origin, 'document_extracted');
    assert.equal(profile.gpa.verificationStatus, 'not_verified');
    assert.equal(profile.languageTest.origin, 'document_extracted');
    assert.equal(profile.languageTest.value.test, 'TOEFL iBT');
  });
});
test('extracted GPA and TOEFL facts feed deterministic matching without claiming awards', () => {
  withStore(store => {
    const doc = store.upload('alice', {text: [header, gpaLine, toeflLine].join('\n'), mime: 'text/plain', consent: true});
    const profile = store.review('alice', doc.id, Object.fromEntries(doc.pending.map(c => [c.id, {action: 'accept'}])));
    const source = {sourceUrl: 'https://example.edu/admissions', sourceExcerpt: 'Example fixture only; not a real scholarship.', ambiguous: false};
    const assessment = assessScholarship([
      {...source, id: 'gpa', type: 'minimum_gpa', gpaMin: 3.0, scale: 4},
      {...source, id: 'toefl', type: 'toefl_ibt', test: 'TOEFL iBT', overallMin: 90, eachSectionMin: 20}
    ], profile);
    assert.equal(assessment.summary, 'met');
    assert.equal(Object.hasOwn(assessment, 'authentic'), false);
  });
});
test('out-of-range or malformed academic lines extract nothing', () => {
  withStore(store => {
    for (const line of ['GPA: 4.5/4.0', 'GPA: 3.25/6', 'GPA: 3.256/4', 'GPA 3.25/4', 'gpa: 3/4', 'TOEFL iBT: overall=130; listening=25; reading=25; writing=25; speaking=25', 'TOEFL iBT: overall=100; listening=31; reading=25; writing=25; speaking=25', 'TOEFL: overall=100; listening=25; reading=25; writing=25; speaking=25']) {
      const doc = store.upload('alice', {text: [header, line].join('\n'), mime: 'text/plain', consent: true});
      assert.deepEqual(doc.pending, [], line);
      assert.equal(doc.consistency, 'not_assessed', line);
    }
  });
});
test('duplicate academic claims require manual review instead of merging', () => {
  withStore(store => {
    const twoGpa = store.upload('alice', {text: [header, gpaLine, 'GPA: 3.50/4.0'].join('\n'), mime: 'text/plain', consent: true});
    assert.equal(twoGpa.consistency, 'discrepancy_requires_review');
    assert.deepEqual(twoGpa.pending, []);
    assert.throws(() => store.review('alice', twoGpa.id, {}), e => e.status === 409);
    const twoTests = store.upload('alice', {text: [header, toeflLine, 'IELTS Academic: overall=7; listening=7; reading=7; writing=6; speaking=7'].join('\n'), mime: 'text/plain', consent: true});
    assert.equal(twoTests.consistency, 'discrepancy_requires_review');
    assert.deepEqual(twoTests.pending, []);
  });
});
test('academic corrections stay bounded by the profile schema', () => {
  withStore(store => {
    const doc = store.upload('alice', {text: [header, gpaLine].join('\n'), mime: 'text/plain', consent: true});
    const bad = Object.fromEntries(doc.pending.map(c => [c.id, {action: 'correct', value: {gpa: 9, scale: 4}}]));
    assert.throws(() => store.review('alice', doc.id, bad), e => e.status === 400);
    assert.equal(store.get('alice', doc.id).reviewedAt, undefined);
    const profile = store.review('alice', doc.id, Object.fromEntries(doc.pending.map(c => [c.id, {action: 'correct', value: {gpa: 3.5, scale: 4}}])));
    assert.equal(profile.gpa.origin, 'user_declared');
    assert.equal(profile.gpa.value.gpa, 3.5);
  });
});
test('document review UI renders GPA and TOEFL editors in three languages without a model path', () => {
  const form = readFileSync(new URL('../src/documents.js', import.meta.url), 'utf8');
  assert.match(form, /toeflTest/);
  assert.match(form, /claim\.value\?\.test==='TOEFL iBT'/);
  assert.match(form, /sections/);
  assert.match(form, /gpa/);
  for (const language of ['en', 'fa', 'ps']) assert.match(form, new RegExp('\\b' + language + ':\\{title:'));
  assert.match(form, /gpa:'[^']*'/);
  assert.match(form, /toeflTest:'[^']*'/);
  assert.doesNotMatch(form, /\/api\/analyze|contributor/i);
});
