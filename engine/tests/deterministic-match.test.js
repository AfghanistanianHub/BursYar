import test from 'node:test';
import assert from 'node:assert/strict';
import {assessScholarship, assessRequirement, simulate} from '../eligibility.js';

const f = (value, extra = {}) => ({value, origin: 'user_declared', verificationStatus: 'not_verified', ...extra});
const degreeRule = minimum => ({id: 'deg1', type: 'minimum_degree', minimum, ambiguous: false, sourceExcerpt: 'Applicants must hold a bachelor degree.', sourceUrl: 'https://example.edu/scholarship'});
const ieltsRule = (overallMin = 6.5, eachBandMin = 6) => ({id: 'eng1', type: 'ielts_academic', test: 'IELTS Academic', overallMin, eachBandMin, ambiguous: false, sourceExcerpt: 'IELTS Academic overall 6.5, no band below 6.', sourceUrl: 'https://example.edu/scholarship'});

test('missing evidence stays unknown, never an automatic rejection', () => {
  assert.equal(assessScholarship([degreeRule('bachelor')], {}).summary, 'unknown');
  assert.equal(assessScholarship([ieltsRule()], {}).summary, 'unknown');
  assert.equal(assessScholarship([degreeRule('bachelor')], {degree: f('bachelor')}).summary, 'met');
  assert.equal(assessScholarship([degreeRule('master')], {degree: f('bachelor')}).summary, 'not_met');
});

test('Duolingo and other tests remain unknown unless the rule explicitly supports them', () => {
  const duolingo = {value: {test: 'Duolingo English Test', overall: 120}, origin: 'user_declared'};
  const out = assessScholarship([ieltsRule()], {languageTest: duolingo});
  assert.equal(out.summary, 'unknown');
  assert.equal(out.results[0].reason, 'unsupported_or_incomplete_test');
});

test('unsupported, ambiguous or contradictory requirements stay unknown', () => {
  const badUrl = {...degreeRule('bachelor'), sourceUrl: 'http://insecure.example/s'};
  assert.equal(assessRequirement(badUrl, {degree: f('doctorate')}).status, 'unknown');
  const ambiguous = {...degreeRule('bachelor'), ambiguous: true};
  assert.equal(assessRequirement(ambiguous, {degree: f('doctorate')}).status, 'unknown');
  const unknownRule = {id: 'x', type: 'gpa_minimum', ambiguous: false, sourceExcerpt: 'GPA guideline usually 3.7.', sourceUrl: 'https://example.edu/s'};
  assert.equal(assessRequirement(unknownRule, {}).status, 'unknown');
});

test('pending, rejected or contradicted facts are not treated as evidence', () => {
  for (const extra of [{reviewStatus: 'pending'}, {verificationStatus: 'rejected'}, {contradicted: true}])
    assert.equal(assessScholarship([degreeRule('bachelor')], {degree: f('bachelor', extra)}).summary, 'unknown');
  // Facts without provenance are refused, including hypothetical placement.
  assert.equal(assessScholarship([degreeRule('bachelor')], {degree: {value: 'bachelor'}}).summary, 'unknown');
});

test('boolean exclusions evaluate only enumerated Oxford fields; counterfactuals stay immutable', () => {
  const rules = [
    {id: 'ox1', type: 'boolean_exclusion', field: 'deferredOffer', excludedValue: true, ambiguous: false, sourceExcerpt: 'Applicants who hold a deferred graduate offer are not eligible.', sourceUrl: 'https://example.edu/s'},
    {id: 'ox2', type: 'boolean_exclusion', field: 'continuingSameDegree', excludedValue: true, ambiguous: false, sourceExcerpt: 'Continuing the same degree is excluded.', sourceUrl: 'https://example.edu/s'},
  ];
  const profile = {deferredOffer: f(true), continuingSameDegree: f(false)};
  const before = structuredClone(profile);
  assert.equal(assessScholarship(rules, profile).summary, 'not_met');
  const cf = simulate(rules, profile, {deferredOffer: false});
  assert.equal(cf.scenario.summary, 'met');
  assert.deepEqual(profile, before);
  assert.equal(cf.base.summary, 'not_met');
});
