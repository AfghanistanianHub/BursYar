import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validProfileValue,manualProfileUpdates} from './profile-schema.js';
import {createScholarshipCatalog,evaluateReviewedScholarship} from './deterministic.js';
const source='Applicants must hold a minimum GPA of 3.0 on a 4.0 scale.\nApplicants must have TOEFL iBT 90 overall, with no section below 20.';
const rules=[
 {id:'gpa',type:'minimum_gpa',gpaMin:3,scale:4,sourceExcerpt:source.split('\n')[0]},
 {id:'toefl',type:'toefl_ibt',test:'TOEFL iBT',overallMin:90,eachSectionMin:20,sourceExcerpt:source.split('\n')[1]}
];
const catalog=createScholarshipCatalog([{id:'sample',sourceUrl:'https://university.example.edu/rules',sourceText:source,sourceDigest:createHash('sha256').update(source).digest('hex'),coverageComplete:false,review:{status:'approved',sourceVerification:'official_source_reviewed',reviewedAt:'2026-10-29',expiresAt:'2027-10-29T00:00:00Z'},rules}],{now:()=>Date.parse('2026-10-30T00:00:00Z')});
const toefl={test:'TOEFL iBT',overall:95,sections:{listening:22,reading:23,speaking:24,writing:25}};
test('untrusted profile fields cannot inject academic rules, and GPA scale must match',()=>{
 for(const value of [{gpa:3.5,scale:100},{gpa:4.5,scale:4},{gpa:'3.5',scale:4},{gpa:3.5,scale:5,verified:true}])assert.equal(validProfileValue('gpa',value),false);
 assert.equal(validProfileValue('gpa',{gpa:3.5,scale:4}),true);
 assert.throws(()=>manualProfileUpdates({untrustedEligibility:true}));
});
test('TOEFL requires numeric bounded scores across all four sections',()=>{
 assert.equal(validProfileValue('languageTest',toefl),true);
 for(const modified of [
 {...toefl,overall:121},{...toefl,sections:{...toefl.sections,speaking:31}},
 {...toefl,sections:{...toefl.sections,reading:'23'}},
 {...toefl,sections:{listening:22,reading:23,speaking:24}},
 {...toefl,extra:'unsafe'}
 ])assert.equal(validProfileValue('languageTest',modified),false);
});
test('reviewed deterministic scholarship assessment never needs a model and never promises full eligibility',()=>{
 const p=manualProfileUpdates({gpa:{gpa:3.7,scale:4},languageTest:toefl});
 const result=evaluateReviewedScholarship(catalog.get('sample'),p);
 assert.deepEqual(result.results.map(r=>r.status),['met','met']);
 assert.equal(result.enumeratedSummary,'met');
 assert.equal(result.summary,'unknown');
 assert.equal(result.externalInference,false);
 assert.equal(result.awardGuaranteed,false);
 const missing=evaluateReviewedScholarship(catalog.get('sample'),manualProfileUpdates({gpa:{gpa:3.7,scale:4}}));
 assert.deepEqual(missing.results.map(r=>r.status),['met','unknown']);
});
