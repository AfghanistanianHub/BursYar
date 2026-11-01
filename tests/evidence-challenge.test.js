import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEvidence} from '../engine/evidence.js';
import {assessScholarship} from '../engine/eligibility.js';

// Challenging offline fixtures. Synthetic sentences only; no live model, no
// real scholarship policy. Every positive case uses an exact source excerpt;
// every insufficient-evidence case must stay unknown, never invented.
const FA = 'تفسیر نیاز به بررسی دارد';
const PS = 'تفسیر بیاکتنې ته اړتیا لري';
function analyze(lines, selected = lines, profile = {}) {
  const input = {text: lines.join('\n'), sourceUrl: 'https://university.example/admissions', language: 'en'};
  const raw = JSON.stringify({criteria: selected.map(excerpt => ({kind: 'education', required: true, excerpt, en: 'Unreviewed interpretation.', fa: FA, ps: PS})), deadline: null, funding: []});
  const output = normalizeEvidence(raw, input);
  return {input, output, assessment: assessScholarship(output.compilation.rules, profile)};
}
const fact = (value, origin = 'user_declared') => ({value, origin, claimIds: []});
const ielts = (overall, writing = 6.5) => ({test: 'IELTS Academic', overall, bands: {listening: 7, reading: 7, writing, speaking: 7}});

test('degree eligibility compares rank without inventing equivalencies', () => {
  const master = 'Applicants must hold a master degree.';
  assert.equal(analyze([master], [master], {degree: fact('bachelor')}).assessment.summary, 'not_met');
  assert.equal(analyze([master], [master], {degree: fact('master')}).assessment.summary, 'met');
  assert.equal(analyze([master], [master], {degree: fact('doctorate')}).assessment.summary, 'met');
  const {output} = analyze([master]);
  assert.equal(output.criteria[0].excerpt, master);
});

test('English certificates enforce exact overall and per-band thresholds', () => {
  const rule = 'Applicants must have IELTS Academic 6.5 overall, with no band below 6.0.';
  assert.equal(analyze([rule], [rule], {languageTest: fact(ielts(6.5, 6.0))}).assessment.summary, 'met');
  assert.equal(analyze([rule], [rule], {languageTest: fact(ielts(7.5, 5.5))}).assessment.summary, 'not_met');
  assert.equal(analyze([rule], [rule], {languageTest: fact({test: 'IELTS Academic', overall: 7, bands: {listening: 7}})}).assessment.summary, 'unknown');
});

test('vague academic standing never becomes a GPA rule', () => {
  for (const text of ['Applicants must have a strong academic record.', 'A minimum GPA is required for admission.', 'Good grades are expected from all candidates.']) {
    const {output, assessment} = analyze([text], [text], {degree: fact('doctorate')});
    assert.equal(output.compilation.rules[0].type, 'unsupported');
    assert.equal(assessment.summary, 'unknown');
  }
});

test('exemptions and equivalent-experience clauses stay unknown', () => {
  for (const text of [
    'Applicants with five years of work experience are exempt from the degree requirement.',
    'Applicants must hold a bachelor degree or equivalent professional experience.',
    'English test requirements may be waived for some applicants.'
  ]) {
    const {assessment} = analyze([text], [text], {degree: fact('doctorate'), languageTest: fact(ielts(8))});
    assert.equal(assessment.summary, 'unknown');
  }
});

test('contradictory degree minima conflict instead of merging', () => {
  const bachelor = 'Applicants must hold a bachelor degree.';
  const master = 'Applicants must hold a master degree.';
  const {output, assessment} = analyze([bachelor, master]);
  assert.equal(output.compilation.contradictions.length, 1);
  assert.deepEqual(output.compilation.contradictions[0].requirementIds, ['criterion-1', 'criterion-2']);
  assert.ok(output.compilation.rules.every(r => r.compilerStatus === 'conflicting'));
  assert.equal(assessment.summary, 'unknown');
});

test('conditional eligibility never compiles into an unconditional rule', () => {
  for (const text of [
    'Applicants must hold a bachelor degree if applying for direct entry.',
    'Applicants must hold a bachelor degree unless they qualify for advanced standing.',
    'Applicants must have IELTS Academic 6.5 overall, with no band below 6.0, for most courses.'
  ]) {
    const {output, assessment} = analyze([text], [text], {degree: fact('doctorate'), languageTest: fact(ielts(8))});
    assert.equal(output.compilation.rules[0].compilerStatus, 'requires_review');
    assert.equal(assessment.summary, 'unknown');
  }
});

test('deadlines require exact source sentences; conflicts stay null', () => {
  const text = 'Applications close on 15 January 2026 for autumn entry. Late applications are not considered.';
  const input = {text, sourceUrl: 'https://university.example/admissions', language: 'en'};
  const exact = 'Applications close on 15 January 2026 for autumn entry.';
  const kept = normalizeEvidence(JSON.stringify({criteria: [], deadline: exact, funding: []}), input);
  assert.equal(kept.deadline, exact);
  assert.throws(() => normalizeEvidence(JSON.stringify({criteria: [], deadline: 'Applications close on 1 March 2026.', funding: []}), input), e => e.code === 'evidence_deadline');
  const conflictSource = 'Course A closes on 15 January 2026. Course B closes on 1 March 2026.';
  const conflicted = normalizeEvidence(JSON.stringify({criteria: [], deadline: null, funding: []}), {...input, text: conflictSource});
  assert.equal(conflicted.deadline, null);
});

test('missing documents yield unknown without inventing alternatives', () => {
  const degree = 'Applicants must hold a bachelor degree.';
  const english = 'Applicants must have IELTS Academic 6.5 overall, with no band below 6.0.';
  const {assessment} = analyze([degree, english]);
  assert.deepEqual(assessment.results.map(r => r.status), ['unknown', 'unknown']);
  assert.ok(assessment.results.every(r => r.reason.startsWith('missing_')));
  assert.ok(!JSON.stringify(assessment).includes('TOEFL'));
});
