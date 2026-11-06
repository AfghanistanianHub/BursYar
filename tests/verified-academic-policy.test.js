import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultCatalog} from '../engine/default-catalog.js';
import {createScholarshipCatalog,evaluateReviewedScholarship} from '../engine/deterministic.js';
import {manualProfileUpdates} from '../engine/profile-schema.js';
const id='turkiye-health-academic';
test('official health-sciences threshold is compared only on its exact reported scale',()=>{
 const entry=defaultCatalog.find(p=>p.id===id);assert.ok(entry,'missing checked official academic criterion');
 const now=Date.parse(entry.review.reviewedAt)+1000,program=createScholarshipCatalog([entry],{now:()=>now}).get(id);
 for(const [values,status,reason] of [
  [{academicScore:{score:90,scale:100}},'met','academic_threshold_met'],
  [{academicScore:{score:89,scale:100}},'not_met','academic_threshold_not_met'],
  [{academicScore:{score:18,scale:20}},'unknown','academic_scale_mismatch'],
  [{},'unknown','missing_or_conflicting_academic_score']
 ]){
  const result=evaluateReviewedScholarship(program,manualProfileUpdates(values));
  assert.equal(result.results[0].status,status);assert.equal(result.results[0].reason,reason);
  assert.equal(result.results[0].source.url,'https://www.turkiyeburslari.gov.tr/scholarshipsprograms');
  assert.equal(result.awardGuaranteed,false);if(status==='met')assert.equal(result.summary,'unknown','one criterion never proves complete eligibility');
 }
 const contradicted=evaluateReviewedScholarship(program,{academicScore:{value:{score:95,scale:100},origin:'user_declared',contradicted:true}});assert.equal(contradicted.results[0].status,'unknown');
 assert.throws(()=>createScholarshipCatalog([entry],{now:()=>Date.parse(entry.review.expiresAt)+1}).get(id),/unavailable/);
});
