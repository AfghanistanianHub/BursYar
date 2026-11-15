import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  reviewedProgramRequirements,
  programAcceptance,
  programForId
} from '../src/program-acceptance.js';
import {
  officialVerificationReviewedAt,
  officialVerificationRoutes,
  routeForExactTest,
  reviewedOfficialUrl,
  createVerificationState
} from '../src/official-verification.js';

const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
const uts = programForId('uts-twente-2027');
const nyuad = programForId('nyuad-2027');
const yenching = programForId('yenching-2027');

test('reviewed program requirements use exact catalog programs and reviewed official sources', () => {
  const seen = new Set();
  for (const entry of reviewedProgramRequirements) {
    const program = programForId(entry.programId);
    assert.ok(program, `${entry.programId} exists in the catalog`);
    const route = routeForExactTest(entry.variant);
    assert.ok(route, `${entry.variant} is a reviewed verification route`);
    assert.equal(route.test, entry.test, `${entry.variant} test matches the route`);
    assert.ok(reviewedOfficialUrl(entry.sourceUrl), `${entry.programId} has a safe official source`);
    const {hostname} = new URL(entry.sourceUrl);
    assert.ok(
      ['www.utwente.nl', 'www.nyu.edu', 'yenchingacademy.pku.edu.cn'].includes(hostname),
      `${entry.programId} source hostname is reviewed`
    );
    assert.equal(entry.reviewedAt, officialVerificationReviewedAt);
    assert.ok(entry.sourceExcerpt.trim().length > 20);
    assert.match(normalize(entry.sourceExcerpt), new RegExp(normalize(entry.variant)), `${entry.variant} named in source`);
    const key = `${entry.programId}|${normalize(entry.test)}|${normalize(entry.variant)}`;
    assert.ok(!seen.has(key), `duplicate requirement ${key}`);
    seen.add(key);
  }
});

test('University of Twente acceptance is confirmed only for the exact reviewed tests', () => {
  const ielts = programAcceptance({programId: 'uts-twente-2027', test: 'IELTS', variant: 'IELTS Academic'});
  assert.equal(ielts.status, 'confirmed');
  assert.equal(ielts.program.id, 'uts-twente-2027');
  assert.equal(ielts.program.title, uts.title);
  assert.equal(ielts.sourceUrl, 'https://www.utwente.nl/en/education/master/application-admission/admission/language-requirement');
  assert.equal(ielts.reviewedAt, officialVerificationReviewedAt);
  assert.ok(ielts.sourceExcerpt.includes('General Training are not accepted'));

  assert.equal(programAcceptance({programId: 'uts-twente-2027', test: 'TOEFL iBT', variant: 'TOEFL iBT'}).status, 'confirmed');

  for (const [test, variant] of [
    ['IELTS', 'IELTS General Training'],
    ['Duolingo English Test', 'Duolingo English Test'],
    ['TestDaF', 'TestDaF'],
    ['IELTS', 'IELTS'],
    ['TOEFL iBT', 'IELTS Academic']
  ]) {
    const result = programAcceptance({programId: 'uts-twente-2027', test, variant});
    assert.equal(result.status, 'not_confirmed', `${test}/${variant} must not be confirmed`);
    assert.equal(result.sourceUrl, undefined);
  }
});

test('NYU Abu Dhabi acceptance follows its reviewed exact-credential list', () => {
  for (const [test, variant] of [
    ['IELTS', 'IELTS Academic'],
    ['TOEFL iBT', 'TOEFL iBT'],
    ['Duolingo English Test', 'Duolingo English Test']
  ]) {
    const result = programAcceptance({programId: 'nyuad-2027', test, variant});
    assert.equal(result.status, 'confirmed', `${variant} should be confirmed for NYUAD`);
    assert.equal(result.program.title, nyuad.title);
    assert.equal(result.sourceUrl, 'https://www.nyu.edu/admissions/undergraduate-admissions/how-to-apply/standardized-tests/english-language-testing.html');
    assert.equal(result.reviewedAt, officialVerificationReviewedAt);
  }
  for (const [test, variant] of [
    ['IELTS', 'IELTS General Training'],
    ['TestDaF', 'TestDaF'],
    ['TEF Études', 'TEF Études']
  ]) {
    assert.equal(programAcceptance({programId: 'nyuad-2027', test, variant}).status, 'not_confirmed');
  }
});

test('Yenching Academy acceptance uses its exact published variants', () => {
  for (const [test, variant] of [
    ['IELTS', 'IELTS Academic'],
    ['TOEFL iBT', 'TOEFL iBT']
  ]) {
    const result = programAcceptance({programId: 'yenching-2027', test, variant});
    assert.equal(result.status, 'confirmed', `${variant} should be confirmed for Yenching`);
    assert.equal(result.program.title, yenching.title);
    assert.equal(result.sourceUrl, 'https://yenchingacademy.pku.edu.cn/ADMISSIONS.htm');
    assert.equal(result.reviewedAt, officialVerificationReviewedAt);
  }
  for (const [test, variant] of [
    ['IELTS', 'IELTS General Training'],
    ['TOEFL iBT', 'TOEFL iBT Home Edition']
  ]) {
    const result = programAcceptance({programId: 'yenching-2027', test, variant});
    assert.equal(result.status, 'not_confirmed', `${test}/${variant} must not be confirmed`);
    assert.equal(result.sourceUrl, undefined);
  }
});

test('programs without reviewed exact-credential wording default to not confirmed', () => {
  for (const programId of ['kaust-2027', 'radboud-2027', 'chevening-2027']) {
    const result = programAcceptance({programId, test: 'IELTS', variant: 'IELTS Academic'});
    assert.equal(result.status, 'not_confirmed', `${programId} must not infer acceptance`);
    assert.equal(result.reason, 'exact_credential_not_named');
    assert.ok(result.program, `${programId} still identifies the program`);
    assert.equal(result.sourceUrl, undefined);
    assert.equal(result.reviewedAt, undefined);
  }
  assert.equal(programAcceptance({programId: 'unknown-program', test: 'IELTS', variant: 'IELTS Academic'}).status, 'not_confirmed');
  assert.equal(programAcceptance({programId: '', test: 'IELTS', variant: 'IELTS Academic'}).status, 'not_confirmed');
  assert.equal(programAcceptance({programId: 'uts-twente-2027'}).reason, 'no_credential');
});

test('exact matching tolerates case and whitespace but never a different credential', () => {
  const result = programAcceptance({programId: 'uts-twente-2027', test: '  IELTS  ', variant: ' ielts   academic '});
  assert.equal(result.status, 'confirmed');
  assert.equal(programAcceptance({programId: 'uts-twente-2027', test: 'IELTS', variant: 'IELTS Academic Online'}).status, 'not_confirmed');
  assert.equal(programAcceptance({programId: 'uts-twente-2027', test: 'TOEFL Essentials', variant: 'TOEFL Essentials'}).status, 'not_confirmed');
});

test('acceptance is independent from credential verification and the panel has no promotion path', () => {
  const state = createVerificationState();
  programAcceptance({programId: 'uts-twente-2027', test: 'IELTS', variant: 'IELTS Academic'});
  assert.equal(state.credential, 'not_verified');
  assert.equal(state.identity, 'not_verified');

  const source = readFileSync(new URL('../src/program-acceptance.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /issuer_verified/);
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|sendBeacon/);

  const panel = readFileSync(new URL('../src/document-verification.js', import.meta.url), 'utf8');
  assert.match(panel, /programAcceptance\(/);
  assert.match(panel, /programSelect/);
  assert.match(panel, /verification-acceptance/);
  assert.match(panel, /researchScholarships/);
  assert.doesNotMatch(panel, /issuer_verified/);
});

test('every reviewed route can be evaluated without inventing an acceptance entry', () => {
  for (const route of officialVerificationRoutes) {
    for (const variant of route.variants) {
      const result = programAcceptance({programId: 'uts-twente-2027', test: route.test, variant});
      assert.ok(['confirmed', 'not_confirmed'].includes(result.status));
    }
  }
});
