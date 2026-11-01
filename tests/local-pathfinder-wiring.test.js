import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessBarriers, barrierText} from '../src/pathfinder.js';
import {planGaps, actionText} from '../src/gap-actions.js';
const ARABIC = /[\u0600-\u06ff]/;
// Synthetic /api/evaluate-shaped payload; never a real scholarship decision.
const evaluated = {
  summary: 'not_met',
  results: [
    {requirementId: 'degree', status: 'not_met', reason: 'degree_comparison', source: {url: 'https://example.edu/award', excerpt: 'Applicants must hold a bachelor degree.'}},
    {requirementId: 'english', status: 'unknown', reason: 'missing_language_test', source: {url: 'https://example.edu/award', excerpt: 'Applicants must have IELTS Academic 6.5 overall, with no band below 6.0.'}}
  ]
};
test('deterministic workflow renders barrier guidance and gap actions without activating alternatives', () => {
  const workflow = readFileSync(new URL('../src/local-workflow.js', import.meta.url), 'utf8');
  assert.match(workflow, /from '\.\/pathfinder\.js'/);
  assert.match(workflow, /from '\.\/gap-actions\.js'/);
  assert.match(workflow, /assessBarriers\(result\.results\)/);
  assert.match(workflow, /planGaps\(result\)/);
  assert.match(workflow, /barrierText\(barrier,language\)/);
  assert.match(workflow, /bursyar:local-next/);
  assert.doesNotMatch(workflow, /createReviewedAlternativeResolver|use_documented_alternative|alternatives\s*[:=]/);
});
test('evaluate-shaped results map to localized barriers and fail-closed gaps', () => {
  const barriers = assessBarriers(evaluated.results);
  assert.deepEqual(barriers.map(b => b.status), ['potential mismatch', 'cannot determine']);
  assert.ok(barriers.every(b => b.documentedAlternative === null));
  for (const barrier of barriers) for (const lang of ['en', 'fa', 'ps']) {
    const text = barrierText(barrier, lang);
    assert.ok(text.status.length > 0 && text.action.length > 0);
    assert.ok(!/award|admitted|guarantee/i.test(text.action));
    if (lang !== 'en') assert.match(text.action, ARABIC, `${barrier.requirementId}.${lang}`);
  }
  const gaps = planGaps(evaluated);
  assert.equal(gaps.length, 2);
  assert.ok(gaps.every(g => g.providerUrl === null && g.competenceAssessment === 'not_assessed'));
  for (const gap of gaps) for (const lang of ['en', 'fa', 'ps']) assert.ok(actionText[lang][gap.action].length > 0, `${gap.action}.${lang}`);
  assert.equal(gaps.find(g => g.requirementId === 'english').action, 'confirm_accepted_tests');
});
