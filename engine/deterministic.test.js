import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createScholarshipCatalog,evaluateReviewedScholarship} from './deterministic.js';
const sourceText='Applicants must hold a bachelor degree.\nMinimum academic score: 80/100.\nApplicants must provide transcripts.\nApplications must be submitted by 2027-01-01T12:00:00Z.\nFunding requires full-time enrollment.\nA documented language exemption may replace IELTS.';
const excerpts=sourceText.split('\n');
export const program={id:'reviewed-test',coverageComplete:true,sourceUrl:'https://example.edu/scholarship',sourceText,sourceDigest:createHash('sha256').update(sourceText).digest('hex'),review:{status:'approved',sourceVerification:'official_source_reviewed',reviewedAt:'2026-10-29',expiresAt:'2027-01-02T00:00:00Z'},rules:[
 {id:'degree',type:'minimum_degree',minimum:'bachelor',sourceExcerpt:excerpts[0]},
 {id:'academic',type:'academic_minimum',minimum:80,scale:100,sourceExcerpt:excerpts[1]},
 {id:'docs',type:'document_available',document:'transcripts',sourceExcerpt:excerpts[2]},
 {id:'deadline',type:'deadline',deadline:'2027-01-01T12:00:00Z',sourceExcerpt:excerpts[3]},
 {id:'funding',type:'funding_condition',field:'fullTimeEnrollment',expected:true,sourceExcerpt:excerpts[4]},
 {id:'language',type:'any_of',sourceExcerpt:excerpts[5],alternatives:[{type:'ielts_academic',test:'IELTS Academic',overallMin:7,eachBandMin:6.5},{type:'documented_exemption',field:'languageExemption',expected:true}]}
]};
const f=value=>({value,origin:'user_declared',reviewStatus:'confirmed_by_user'});
const profile={degree:f('bachelor'),academicScore:f({score:85,scale:100}),documents:f(['transcripts']),applicationSubmitted:f('2026-12-01T00:00:00Z'),fullTimeEnrollment:f(true),languageExemption:f(true)};
test('reviewed deterministic criteria cover academic, degree, documents, deadlines, funding and explicit alternatives',()=>{
 const catalog=createScholarshipCatalog([program],{now:()=>Date.parse('2026-10-30')});
 const result=evaluateReviewedScholarship(catalog.get(program.id),profile);
 assert.equal(result.summary,'met');assert.equal(result.results.length,6);assert.equal(result.externalInference,false);assert.equal(result.awardGuaranteed,false);
 for(const key of Object.keys(profile))assert.equal(evaluateReviewedScholarship(catalog.get(program.id),{...profile,[key]:{...profile[key],contradicted:true}}).summary,'unknown');
 assert.equal(evaluateReviewedScholarship(catalog.get(program.id),{...profile,academicScore:f({score:50,scale:100})}).summary,'not_met');
 assert.equal(evaluateReviewedScholarship(catalog.get(program.id),{...profile,academicScore:f({score:3.8,scale:4})}).summary,'unknown');
 assert.equal(evaluateReviewedScholarship(catalog.get(program.id),{...profile,languageExemption:f(false)}).summary,'unknown');
});
test('unreviewed, altered, expired or unsupported source criteria never become definite',()=>{
 for(const change of [{review:{status:'pending'}},{sourceText:'altered'}, {rules:[{...program.rules[0],sourceExcerpt:'fabricated'}]}])assert.throws(()=>createScholarshipCatalog([{...program,...change}]));
 const catalog=createScholarshipCatalog([program],{now:()=>Date.parse('2028-01-01')});assert.throws(()=>catalog.get(program.id));
 const unsupported={...program,rules:[{id:'ambiguous',type:'unsupported',sourceExcerpt:excerpts[0]}]};
 assert.equal(evaluateReviewedScholarship(createScholarshipCatalog([unsupported],{now:()=>Date.parse('2026-10-30')}).get(program.id),profile).summary,'unknown');
});
