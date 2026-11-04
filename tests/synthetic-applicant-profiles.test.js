// Workstream B (deterministic portion): synthetic applicant profiles against the
// reviewed deterministic engine. No Model API calls; all data is synthetic and
// clearly marked. Asserts matched / not matched / unknown outcomes plus the
// never-promise-eligibility invariants for every profile.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createScholarshipCatalog,evaluateReviewedScholarship} from '../engine/deterministic.js';

const sourceText = 'Applicants must hold a bachelor degree.\nMinimum academic score: 80/100.\nApplicants must provide transcripts.\nApplications must be submitted by 2027-01-01T12:00:00Z.\nFunding requires full-time enrollment.\nA documented language exemption may replace IELTS.';
const excerpts = sourceText.split('\n');
const baseProgram = {
  id: 'synthetic-reviewed', coverageComplete: true,
  sourceUrl: 'https://example.edu/synthetic-scholarship', sourceText,
  sourceDigest: createHash('sha256').update(sourceText).digest('hex'),
  review: {status: 'approved', sourceVerification: 'official_source_reviewed', reviewedAt: '2026-10-29', expiresAt: '2027-01-02T00:00:00Z'},
  rules: [
    {id: 'degree', type: 'minimum_degree', minimum: 'bachelor', sourceExcerpt: excerpts[0]},
    {id: 'academic', type: 'academic_minimum', minimum: 80, scale: 100, sourceExcerpt: excerpts[1]},
    {id: 'docs', type: 'document_available', document: 'transcripts', sourceExcerpt: excerpts[2]},
    {id: 'deadline', type: 'deadline', deadline: '2027-01-01T12:00:00Z', sourceExcerpt: excerpts[3]},
    {id: 'funding', type: 'funding_condition', field: 'fullTimeEnrollment', expected: true, sourceExcerpt: excerpts[4]},
    {id: 'language', type: 'any_of', sourceExcerpt: excerpts[5], alternatives: [
      {type: 'ielts_academic', test: 'IELTS Academic', overallMin: 7, eachBandMin: 6.5},
      {type: 'documented_exemption', field: 'languageExemption', expected: true}]},
  ],
};

const catalog = createScholarshipCatalog([baseProgram], {now: () => Date.parse('2026-10-30')});
const program = catalog.get(baseProgram.id);
const f = (value, extra = {}) => ({value, origin: 'user_declared', reviewStatus: 'confirmed_by_user', ...extra});
const assess = profile => evaluateReviewedScholarship(program, profile);
const statusOf = (result, id) => result.results.find(r => r.requirementId === id).status;

const complete = {
  degree: f('bachelor'),
  academicScore: f({score: 85, scale: 100}),
  documents: f(['transcripts']),
  applicationSubmitted: f('2026-12-01T00:00:00Z'),
  fullTimeEnrollment: f(true),
  languageExemption: f(true),
};

function assertNoPromises(result, profileName) {
  assert.equal(result.externalInference, false, `${profileName}: must not imply inference`);
  assert.equal(result.awardGuaranteed, false, `${profileName}: must never guarantee award`);
  assert.equal(result.requiresHumanReview, true, `${profileName}: must require human review`);
  assert.equal(result.coverage, 'reviewed_enumerated_requirements_only', `${profileName}: coverage label`);
  for (const r of result.results) {
    assert.equal(r.issuerAuthenticated, false, `${profileName}/${r.requirementId}: issuer not authenticated`);
    assert.ok(r.source.url.startsWith('https://'), `${profileName}/${r.requirementId}: https source`);
  }
}

test('control: fully evidenced synthetic profile matches', () => {
  const r = assess(complete);
  assert.equal(r.summary, 'met');
  assert.equal(r.results.length, 6);
  assertNoPromises(r, 'control');
});

test('restricted learner: interrupted degree stays unknown, never not-met-by-default', () => {
  const {degree, ...rest} = complete;
  const r = assess(rest);
  assert.equal(statusOf(r, 'degree'), 'unknown');
  assert.equal(r.summary, 'unknown');
  assertNoPromises(r, 'restricted-learner');
});

test('missing language certificate without exemption stays unknown', () => {
  const {languageExemption, ...rest} = complete;
  const r = assess(rest);
  assert.equal(statusOf(r, 'language'), 'unknown');
  assert.equal(r.summary, 'unknown');
  assertNoPromises(r, 'missing-language');
});

test('incomplete paperwork: absent transcript is missing evidence, not failure', () => {
  const empty = assess({...complete, documents: f([])});
  assert.equal(statusOf(empty, 'docs'), 'unknown');
  assert.equal(empty.summary, 'unknown');
  const pending = assess({...complete, documents: f(['transcripts'], {reviewStatus: 'pending'})});
  assert.equal(statusOf(pending, 'docs'), 'unknown');
  assertNoPromises(empty, 'incomplete-paperwork');
});

test('uncertain deadline: missing or malformed submission date stays unknown', () => {
  const {applicationSubmitted, ...rest} = complete;
  assert.equal(statusOf(assess(rest), 'deadline'), 'unknown');
  const malformed = assess({...complete, applicationSubmitted: f('next month, maybe')});
  assert.equal(statusOf(malformed, 'deadline'), 'unknown');
  assert.equal(malformed.summary, 'unknown');
  const late = assess({...complete, applicationSubmitted: f('2027-02-01T00:00:00Z')});
  assert.equal(statusOf(late, 'deadline'), 'not_met');
  assert.equal(late.summary, 'not_met');
  assertNoPromises(malformed, 'uncertain-deadline');
});

test('access limitation: cannot enrol full-time is a scoped not-met, not a blanket verdict', () => {
  const r = assess({...complete, fullTimeEnrollment: f(false)});
  assert.equal(statusOf(r, 'funding'), 'not_met');
  assert.equal(statusOf(r, 'degree'), 'met');
  assert.equal(r.summary, 'not_met');
  assertNoPromises(r, 'access-limited');
});

test('guardian-managed workflow: unlisted origins fail closed to unknown', () => {
  const guardian = Object.fromEntries(Object.entries(complete).map(([k, v]) => [k, {...v, origin: 'guardian_declared'}]));
  const r = assess(guardian);
  assert.equal(r.summary, 'unknown');
  assert.ok(r.results.every(x => x.status === 'unknown'));
  const contradicted = assess({...complete, degree: f('bachelor', {contradicted: true})});
  assert.equal(statusOf(contradicted, 'degree'), 'unknown');
  assertNoPromises(r, 'guardian-managed');
});

test('partial coverage never reports met even when every enumerated rule matches', () => {
  const partialCatalog = createScholarshipCatalog([{...baseProgram, id: 'synthetic-partial', coverageComplete: false}], {now: () => Date.parse('2026-10-30')});
  const r = evaluateReviewedScholarship(partialCatalog.get('synthetic-partial'), complete);
  assert.equal(r.enumeratedSummary, 'met');
  assert.equal(r.summary, 'unknown');
  assertNoPromises(r, 'partial-coverage');
});

test('below-minimum academic score is not-met; wrong scale is unknown', () => {
  const low = assess({...complete, academicScore: f({score: 50, scale: 100})});
  assert.equal(low.summary, 'not_met');
  const wrongScale = assess({...complete, academicScore: f({score: 3.8, scale: 4})});
  assert.equal(statusOf(wrongScale, 'academic'), 'unknown');
  assertNoPromises(wrongScale, 'academic-scale');
});
