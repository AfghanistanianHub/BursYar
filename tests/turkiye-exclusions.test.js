import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultCatalog} from '../engine/default-catalog.js';
import {createScholarshipCatalog,evaluateReviewedScholarship} from '../engine/deterministic.js';
import {manualProfileUpdates,validProfileValue} from '../engine/profile-schema.js';
import {planGaps} from '../src/gap-actions.js';
const id='turkiye-general-exclusions';
function program(){const entry=defaultCatalog.find(p=>p.id===id);assert.ok(entry,'reviewed exclusion record missing');return createScholarshipCatalog([entry],{now:()=>Date.parse(entry.review.reviewedAt)+1}).get(id);}
test('Türkiye explicit current/former citizenship and same-level enrolment exclusions are independent',()=>{
 const p=program();
 for(const [a,b,statuses,summary]of [[false,false,['met','met'],'unknown'],[true,false,['not_met','met'],'not_met'],[false,true,['met','not_met'],'not_met']]){
  const r=evaluateReviewedScholarship(p,manualProfileUpdates({targetDegree:'master',turkishCitizenshipHistory:a,enrolledInTurkiyeAtTargetLevel:b}));
  assert.deepEqual(r.results.map(r=>r.status),statuses);assert.equal(r.summary,summary);assert.equal(r.awardGuaranteed,false);
 }
});
test('missing, pending and contradicted exclusion evidence stays UNKNOWN without nationality guesses',()=>{
 const p=program();
 for(const profile of [{},{nationality:{value:'AF',origin:'user_declared'}},{turkishCitizenshipHistory:{value:false,origin:'user_declared',contradicted:true}},{turkishCitizenshipHistory:{value:false,origin:'document_extracted',reviewStatus:'pending'}}]){
  assert.equal(evaluateReviewedScholarship(p,profile).summary,'unknown');
  assert.ok(evaluateReviewedScholarship(p,profile).results.every(r=>r.status==='unknown'));
 }
});
test('exclusion profile fields accept explicit booleans only and PathFinder preserves official evidence',()=>{
 for(const field of ['turkishCitizenshipHistory','enrolledInTurkiyeAtTargetLevel']){
  assert.equal(validProfileValue(field,false),true);for(const value of ['false',0,[],{}])assert.equal(validProfileValue(field,value),false);
 }
 const r=evaluateReviewedScholarship(program(),manualProfileUpdates({turkishCitizenshipHistory:true}));
 const gaps=planGaps(r);assert.equal(gaps[0].action,'review_exclusion');
 assert.equal(gaps[1].action,'confirm_application_status');
 assert.ok(gaps.every(g=>g.source.url==='https://www.turkiyeburslari.gov.tr/scholarshipsprograms'));
});

test('same-level declaration is unknown after intended degree changes',()=>{
 const p=program(),profile=manualProfileUpdates({targetDegree:'bachelor',enrolledInTurkiyeAtTargetLevel:true});
 assert.equal(evaluateReviewedScholarship(p,profile).results[1].status,'not_met');
 profile.targetDegree={value:'master',origin:'user_declared'};
 assert.equal(evaluateReviewedScholarship(p,profile).results[1].status,'unknown');
});

test('private profile storage binds new enrolment declarations to the current target only',async()=>{
 const {DocumentStore}=await import('../engine/documents.js');
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const dir=mkdtempSync(join(tmpdir(),'bursyar-target-context-')),store=new DocumentStore(join(dir,'synthetic.db'));
 try{
  store.updateProfile('synthetic',{consent:true,values:{targetDegree:'bachelor'}});
  let profile=store.updateProfile('synthetic',{consent:true,values:{enrolledInTurkiyeAtTargetLevel:true}});
  assert.equal(evaluateReviewedScholarship(program(),profile).results[1].status,'not_met');
  profile=store.updateProfile('synthetic',{consent:true,values:{targetDegree:'master'}});
  assert.equal(evaluateReviewedScholarship(program(),profile).results[1].status,'unknown');
  profile=store.updateProfile('synthetic',{consent:true,values:{enrolledInTurkiyeAtTargetLevel:false}});
  assert.equal(evaluateReviewedScholarship(program(),profile).results[1].status,'met');
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
