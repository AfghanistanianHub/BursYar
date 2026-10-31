import test from 'node:test';
import assert from 'node:assert/strict';
import {assessBarriers} from '../src/pathfinder.js';
const base=[{requirementId:'language',status:'not_met',source:{url:'https://university.example.edu/rules',excerpt:'Only IELTS is accepted.'}}];
test('PathFinder does not promote forged official-domain URL to a documented alternative',()=>{
 const outputs=assessBarriers(base,{alternatives:{language:{text:'Duolingo accepted without evidence',sourceUrl:'https://university.example.edu/rules'}}});
 assert.equal(outputs[0].actionCode,'ask_alternative');
 assert.equal(outputs[0].documentedAlternative,null);
 assert.equal(outputs[0].status,'potential mismatch');
});
test('PathFinder denies malicious, missing and unreviewed alternatives',()=>{
 for(const url of ['https://evil.example/offer','javascript:alert(1)', '', undefined]){
  const [out]=assessBarriers(base,{alternatives:{language:{text:'Guaranteed admission',sourceUrl:url}}});
  assert.equal(out.actionCode,'ask_alternative');
  assert.equal(out.documentedAlternative,null);
 }
});
test('PathFinder preserves tri-state assessment and never predicts admission',()=>{
 const outcomes=assessBarriers([
 {requirementId:'met',status:'met'},{requirementId:'unknown',status:'unknown'},{requirementId:'bad',status:'unrecognized'}
 ]);
 assert.deepEqual(outcomes.map(x=>x.status),['appears to meet','cannot determine','cannot determine']);
 assert.deepEqual(outcomes.map(x=>x.actionCode),['keep_evidence','verify_requirement','verify_requirement']);
});
test('PathFinder never mutates the source assessment',()=>{
 const input=structuredClone(base),snapshot=structuredClone(input);
 assessBarriers(input,{alternatives:{language:{text:'fabricated',sourceUrl:'https://example.edu'}}});
 assert.deepEqual(input,snapshot);
});
