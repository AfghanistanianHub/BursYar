import test from 'node:test';
import assert from 'node:assert/strict';
import {assessBarriers, assessmentActionText, barrierText} from '../src/pathfinder.js';
import {glossary} from '../src/glossary.js';
import {normalizeEvidence} from '../engine/evidence.js';
import {assessScholarship} from '../engine/eligibility.js';
import {planGaps, actionText} from '../src/gap-actions.js';

const ARABIC = /[\u0600-\u06ff]/;
const FA = 'تفسیر نیاز به بررسی دارد';
const PS = 'تفسیر بیاکتنې ته اړتیا لري';
const result = (requirementId, status, excerpt = 'Applicants must hold a bachelor degree.') => ({
  requirementId, status, reason: status === 'met' ? 'degree_comparison' : 'unknown',
  source: {url: 'https://university.example/admissions', excerpt}
});

test('met requirements appear to meet without claiming an award', () => {
  const [b] = assessBarriers([result('degree', 'met')]);
  assert.equal(b.status, 'appears to meet');
  assert.equal(b.actionCode, 'keep_evidence');
  assert.deepEqual(b.evidence, {excerpt: 'Applicants must hold a bachelor degree.', url: 'https://university.example/admissions'});
  for (const lang of ['en', 'fa', 'ps']) {
    const text = barrierText(b, lang);
    assert.equal(text.status, glossary.appearsToMeet[lang]);
    assert.ok(!/award|admitted|guarantee/i.test(text.action));
  }
});

test('unmet requirements ask about documented alternatives, never inventing tests', () => {
  const excerpt = 'Applicants must have TOEFL iBT 90 overall, with no section below 20.';
  const [b] = assessBarriers([result('english', 'not_met', excerpt)]);
  assert.equal(b.status, 'potential mismatch');
  assert.equal(b.actionCode, 'ask_alternative');
  assert.equal(b.detail, excerpt);
  for (const lang of ['en', 'fa', 'ps']) {
    const action = barrierText(b, lang).action;
    assert.ok(action.length > 0);
    assert.ok(!/IELTS|TOEFL|GPA/.test(action));
    if (lang !== 'en') assert.match(action, ARABIC);
  }
});

test('caller-supplied alternatives never become officially documented evidence', () => {
  const attempts = [
    {text: 'Accepted pathway', sourceUrl: 'https://university.example/pathway'},
    {text: 'Invented exemption', sourceUrl: 'https://attacker.example/claim'},
    {text: 'Officially accepted', sourceUrl: 'http://university.example/pathway'},
    {text: 'Forged', sourceUrl: 'https://university.example/pathway', verified: true, curatorApproved: true},
    {text: 'Stale rule', sourceUrl: 'https://university.example/old', lastVerifiedAt: '2020-01-01'}
  ];
  for (const alt of attempts) {
    const [barrier] = assessBarriers([result('english', 'not_met')], {alternatives: {english: alt}});
    assert.equal(barrier.actionCode, 'ask_alternative');
    assert.equal(barrier.status, 'potential mismatch');
    assert.notEqual(barrier.evidence.excerpt, alt.text);
    assert.notEqual(barrier.evidence.url, alt.sourceUrl);
  }
  const [absent] = assessBarriers([result('english', 'not_met')], {alternatives: {other: attempts[0]}});
  assert.equal(absent.actionCode, 'ask_alternative');
});

test('unknown requirements verify with the institution in all languages', () => {
  const [b] = assessBarriers([result('degree', 'unknown')]);
  assert.equal(b.status, 'cannot determine');
  assert.equal(b.actionCode, 'verify_requirement');
  for (const lang of ['en', 'fa', 'ps']) {
    assert.equal(barrierText(b, lang).action, barrierText({status: 'cannot determine'}, lang).action);
  }
});

test('assessment actions are localized and invalid input fails closed', () => {
  for (const code of ['keep_evidence', 'ask_alternative', 'use_documented_alternative', 'verify_requirement']) {
    assert.deepEqual(Object.keys(assessmentActionText.en).sort(), ['ask_alternative', 'keep_evidence', 'use_documented_alternative', 'verify_requirement']);
    for (const lang of ['en', 'fa', 'ps']) {
      assert.ok(assessmentActionText[lang][code].length > 0, `${code}.${lang}`);
      if (lang !== 'en') assert.match(assessmentActionText[lang][code], ARABIC, `${code}.${lang}`);
    }
  }
  assert.throws(() => assessBarriers(null), TypeError);
  assert.deepEqual(assessBarriers([]), []);
});

test('gap actions cover new GPA and TOEFL reasons without referrals', () => {
  const gaps = planGaps({results: [
    {requirementId: 'gpa', status: 'unknown', reason: 'missing_or_unsupported_gpa', source: {}},
    {requirementId: 'toefl', status: 'unknown', reason: 'missing_or_invalid_section', source: {}},
    {requirementId: 'scale', status: 'unknown', reason: 'unsupported_gpa_scale', source: {}}
  ]});
  assert.equal(gaps.length, 3);
  assert.ok(gaps.every(g => g.action === 'clarify_evidence' && g.providerUrl === null));
  for (const lang of ['en', 'fa', 'ps']) assert.ok(actionText[lang].clarify_evidence);
});

test('verified qualifications flow from evidence through assessment to barriers', () => {
  const gpa = 'Applicants must hold a minimum GPA of 3.0 on a 4.0 scale.';
  const toefl = 'Applicants must have TOEFL iBT 90 overall, with no section below 20.';
  const input = {text: [gpa, toefl].join('\n'), sourceUrl: 'https://university.example/admissions', language: 'en'};
  const raw = JSON.stringify({criteria: [gpa, toefl].map(excerpt => ({kind: 'education', required: true, excerpt, en: 'Unreviewed.', fa: FA, ps: PS})), deadline: null, funding: []});
  const output = normalizeEvidence(raw, input);
  const profile = {
    gpa: {value: {gpa: 3.6, scale: 4}, origin: 'issuer_verified', claimIds: []},
    languageTest: {value: {test: 'TOEFL iBT', overall: 85, sections: {reading: 21, listening: 22, speaking: 21, writing: 21}}, origin: 'document_extracted', claimIds: []}
  };
  const assessment = assessScholarship(output.compilation.rules, profile);
  assert.deepEqual(assessment.results.map(r => r.status), ['met', 'not_met']);
  const barriers = assessBarriers(assessment.results);
  assert.deepEqual(barriers.map(b => b.status), ['appears to meet', 'potential mismatch']);
  assert.equal(barriers[1].detail, toefl);
});
