import test from 'node:test';
import assert from 'node:assert/strict';
import {planGaps,actionText} from '../src/gap-actions.js';
test('missing test certificate never becomes an assessment of competence or an invented referral',()=>{
 const [gap]=planGaps({results:[{requirementId:'language',status:'unknown',reason:'missing_language_test',source:{url:'https://university.example/requirements'}}]});
 assert.equal(gap.barrierKind,'missing_credential_evidence');
 assert.equal(gap.competenceAssessment,'not_assessed');
 assert.equal(gap.action,'confirm_accepted_tests');
 assert.equal(gap.providerUrl,null);
 for(const lang of ['en','fa','ps']) assert.ok(actionText[lang].confirm_accepted_tests);
});
test('scores below explicitly documented thresholds do not establish overall competence',()=>{
 const [gap]=planGaps({results:[{requirementId:'toefl',status:'not_met',reason:'test_thresholds_not_met',source:{}}]});
 assert.equal(gap.barrierKind,'reported_score_below_stated_threshold');
 assert.equal(gap.competenceAssessment,'not_assessed');
 assert.equal(gap.providerUrl,null);
});
test('missing score sections, unsupported GPA scales and uncertainty never imply a referral',()=>{
 const gaps=planGaps({results:['missing_or_invalid_section','unsupported_gpa_scale','unreviewed_or_unsupported_requirement'].map((reason,i)=>({requirementId:String(i),status:'unknown',reason,source:{}}))});
 assert.ok(gaps.every(g=>g.providerUrl===null&&g.competenceAssessment==='not_assessed'));
 assert.ok(gaps.every(g=>g.action==='clarify_evidence'));
});
