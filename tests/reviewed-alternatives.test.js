import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReviewedAlternativeResolver} from '../engine/reviewed-alternatives.js';
const sourceText='Official policy allows a language-test waiver for applicants in this exact programme.\nA separate institution may have different rules.';
const sourceUrl='https://university.ac.uk/admissions/policy';
const valid={scholarshipId:'scholar-1',requirementId:'english',policyScope:'masters-2026',sourceUrl,sourceText,sourceDigest:createHash('sha256').update(sourceText).digest('hex'),alternativeExcerpt:sourceText.split('\n')[0],alternativeId:'waiver-1',reviewStatus:'human_approved',sourceStatus:'official_verified',acceptanceDecision:'explicitly_accepted',reviewerId:'curator-1',reviewedOn:'2026-10-01',expiresOn:'2026-11-30',revoked:false};
const request={scholarshipId:'scholar-1',requirementId:'english',policyScope:'masters-2026',source:{url:sourceUrl}};
const resolve=(entries,day='2026-10-30')=>createReviewedAlternativeResolver({entries,today:()=>day})(request);
test('only exact scoped human approved official snapshot can yield a documented option',()=>{
 const result=resolve([valid]);assert.equal(result.alternativeId,'waiver-1');assert.equal(result.reviewStatus,'human_approved');
 assert.equal(result.sourceUrl,sourceUrl);
});
test('reject absent, forged, unreviewed, wrong programme, expired or revoked alternatives',()=>{
 for(const delta of [{reviewStatus:'unreviewed'},{sourceStatus:'user_supplied_unverified'},{acceptanceDecision:'unknown'},{sourceDigest:'0'.repeat(64)},{policyScope:'bachelor-2026'},{scholarshipId:'scholar-2'},{sourceUrl:'https://other.ac.uk/admissions/policy'},{revoked:true},{revoked:undefined},{alternativeExcerpt:'Not present in source'},{reviewerId:''},{expiresOn:'2026-10-20'},{reviewedOn:'2026-11-10'}])
 assert.equal(resolve([{...valid,...delta}]),null,JSON.stringify(delta));
 assert.equal(resolve([]),null);
});
test('duplicate or contradictory approved entries fail closed',()=>{
 assert.equal(resolve([valid,{...valid,alternativeId:'waiver-2'}]),null);
});
test('resolver snapshots operator data to prevent post-initialization modification',()=>{
 const entry=structuredClone(valid),resolveSnapshot=createReviewedAlternativeResolver({entries:[entry],today:()=> '2026-10-30'});
 entry.revoked=true;assert.equal(resolveSnapshot(request).alternativeId,'waiver-1');
});
test('expiry and review dates are checked against current date',()=>{
 assert.equal(resolve([valid],'2026-12-01'),null);
 assert.equal(resolve([{...valid,reviewedOn:'2026-02-30'}]),null);
});
