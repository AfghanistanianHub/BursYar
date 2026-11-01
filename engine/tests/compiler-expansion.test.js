import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEvidence} from '../evidence.js';
import {assessScholarship, simulate} from '../eligibility.js';

// Narrow, explicit grammar additions. Each supported sentence has one exact
// form; every other phrasing stays unsupported and evaluates to unknown.
const FA = 'تفسیر نیاز به بررسی دارد';
const PS = 'تفسیر بیاکتنې ته اړتیا لري';
const GPA = 'Applicants must hold a minimum GPA of 3.0 on a 4.0 scale.';
const TOEFL = 'Applicants must have TOEFL iBT 90 overall, with no section below 20.';
function analyze(lines, selected = lines, profile = {}) {
  const input = {text: lines.join('\n'), sourceUrl: 'https://university.example/admissions', language: 'en'};
  const raw = JSON.stringify({criteria: selected.map(excerpt => ({kind: 'education', required: true, excerpt, en: 'Unreviewed interpretation.', fa: FA, ps: PS})), deadline: null, funding: []});
  const output = normalizeEvidence(raw, input);
  return {output, assessment: assessScholarship(output.compilation.rules, profile)};
}
const fact = (value, origin = 'user_declared') => ({value, origin, claimIds: []});
const toeflScore = (overall, reading = 22) => ({test: 'TOEFL iBT', overall, sections: {reading, listening: 23, speaking: 22, writing: 24}});

test('explicit GPA minimum compiles and compares numerically', () => {
  const {output} = analyze([GPA]);
  assert.equal(output.compilation.rules[0].type, 'minimum_gpa');
  assert.equal(output.compilation.rules[0].compilerStatus, 'supported');
  assert.equal(analyze([GPA], [GPA], {gpa: fact({gpa: 3.5, scale: 4})}).assessment.summary, 'met');
  assert.equal(analyze([GPA], [GPA], {gpa: fact({gpa: 2.5, scale: 4})}).assessment.summary, 'not_met');
  assert.equal(analyze([GPA], [GPA], {}).assessment.summary, 'unknown');
});

test('explicit TOEFL iBT thresholds compile and enforce every section', () => {
  const {output} = analyze([TOEFL]);
  assert.equal(output.compilation.rules[0].type, 'toefl_ibt');
  assert.equal(output.compilation.rules[0].compilerStatus, 'supported');
  assert.equal(analyze([TOEFL], [TOEFL], {languageTest: fact(toeflScore(95))}).assessment.summary, 'met');
  assert.equal(analyze([TOEFL], [TOEFL], {languageTest: fact(toeflScore(100, 18))}).assessment.summary, 'not_met');
  assert.equal(analyze([TOEFL], [TOEFL], {}).assessment.summary, 'unknown');
});

test('same-dimension GPA conflicts flag; different tests stay alternatives', () => {
  const higher = 'Applicants must hold a minimum GPA of 3.5 on a 4.0 scale.';
  const conflicted = analyze([GPA, higher]);
  assert.equal(conflicted.output.compilation.contradictions.length, 1);
  assert.equal(conflicted.assessment.summary, 'unknown');
  const ielts = 'Applicants must have IELTS Academic 6.5 overall, with no band below 6.0.';
  const alternatives = analyze([ielts, TOEFL]);
  assert.equal(alternatives.output.compilation.contradictions.length, 0);
  assert.ok(alternatives.output.compilation.rules.every(r => r.compilerStatus === 'supported'));
});

test('negated requirements never compile into positive rules', () => {
  for (const text of [
    'Applicants do not need a bachelor degree.',
    'No IELTS Academic score is required.',
    'GPA is not considered for admission.',
    'TOEFL iBT scores are not accepted.'
  ]) {
    const {output, assessment} = analyze([text], [text], {degree: fact('doctorate'), gpa: fact({gpa: 4, scale: 4})});
    assert.equal(output.compilation.rules[0].type, 'unsupported');
    assert.equal(assessment.summary, 'unknown');
  }
});

test('one test never satisfies the other test rule', () => {
  const ielts = 'Applicants must have IELTS Academic 6.5 overall, with no band below 6.0.';
  const ieltsFact = {test: 'IELTS Academic', overall: 8, bands: {listening: 8, reading: 8, writing: 8, speaking: 8}};
  assert.equal(analyze([TOEFL], [TOEFL], {languageTest: fact(ieltsFact)}).assessment.summary, 'unknown');
  assert.equal(analyze([ielts], [ielts], {languageTest: fact(toeflScore(110))}).assessment.summary, 'unknown');
});

test('GPA scale mismatch stays unknown and out-of-range values fail closed', () => {
  assert.equal(analyze([GPA], [GPA], {gpa: fact({gpa: 4.5, scale: 5})}).assessment.summary, 'unknown');
  assert.equal(analyze([GPA], [GPA], {gpa: fact({gpa: '3.5', scale: 4})}).assessment.summary, 'unknown');
  assert.equal(analyze([GPA], [GPA], {gpa: fact({gpa: 5, scale: 4})}).assessment.summary, 'unknown');
});

test('GPA counterfactual accepts overrides without mutating the profile', () => {
  const {output} = analyze([GPA]);
  const profile = {gpa: fact({gpa: 2.5, scale: 4})}, before = structuredClone(profile);
  const result = simulate(output.compilation.rules, profile, {gpa: {gpa: 3.2, scale: 4}});
  assert.equal(result.base.summary, 'not_met');
  assert.equal(result.scenario.summary, 'met');
  assert.deepEqual(profile, before);
  assert.throws(() => simulate(output.compilation.rules, profile, {gpa: '3.2'}), /Invalid override value/);
});
