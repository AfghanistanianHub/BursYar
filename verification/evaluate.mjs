// No provider import or network access. Expected answers remain in this harness.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {normalizeEvidence} from '../engine/evidence.js';
import {assessScholarship,simulate} from '../engine/eligibility.js';
import {OXFORD_CLARENDON} from '../engine/source-inventory.js';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/scholarship-evaluation.json',import.meta.url)));
const results=[];
for(const scenario of fixture.cases)for(const language of ['en','fa','ps']){
 const input={text:scenario.text,sourceUrl:scenario.sourceUrl,language};
 const mock=JSON.stringify({criteria:[{kind:'other',required:null,excerpt:scenario.text,en:'Interpretation requires review.',fa:'تفسیر نیاز به بازبینی دارد.',ps:'تفسیر بیاکتنې ته اړتیا لري.'}],deadline:null,funding:[]});
 const evidence=normalizeEvidence(mock,input);
 const assessment=assessScholarship(evidence.compilation.rules,{degree:{value:'doctorate',origin:'user_declared'}});
 assert.equal(assessment.summary,scenario.expected);
 results.push({case:scenario.id,language,status:assessment.summary,sourceDigest:evidence.sourceDigest,passed:true});
}
// Oxford semantic policy mappings are tested with mocked interpretations only.
// Synthetic compositions are not represented as fetched official documents.
const deferred='Applicants who hold a deferred graduate offer are not eligible to be considered for this scholarship.';
const oxfordText=deferred+'\n'+fixture.cases[0].text;
const f=value=>({value,origin:'user_declared',verificationStatus:'not_verified'});
const policyCases=[
 {id:'oxford-deferred-offer',profile:{deferredOffer:f(true),continuingSameDegree:f(false)},expected:'not_met'},
 {id:'oxford-continuing-degree',profile:{deferredOffer:f(false),continuingSameDegree:f(true)},expected:'not_met'},
 {id:'oxford-enumerated-exclusions-not-reported',profile:{deferredOffer:f(false),continuingSameDegree:f(false)},expected:'met'},
 {id:'oxford-status-missing',profile:{},expected:'unknown'},
 {id:'oxford-course-deadline-unclear',extra:'Apply by the course-specific January deadline.',profile:{deferredOffer:f(false),continuingSameDegree:f(false)},expected:'unknown'},
 {id:'oxford-guideline-is-not-hard-threshold',extra:'The GPA guideline is usually 3.7.',profile:{deferredOffer:f(false),continuingSameDegree:f(false)},expected:'unknown'},
 {id:'oxford-contradictory-exclusion',extra:'Deferred graduate offers are eligible unless another restriction applies.',profile:{deferredOffer:f(true),continuingSameDegree:f(false)},expected:'unknown'},
 {id:'oxford-immutable-counterfactual',profile:{deferredOffer:f(true),continuingSameDegree:f(false)},expected:'not_met',scenario:'met'}
];
for(const scenario of policyCases)for(const language of ['en','fa','ps']){
 const input={text:oxfordText+(scenario.extra?'\n'+scenario.extra:''),sourceUrl:OXFORD_CLARENDON,language};
 const mock=JSON.stringify({criteria:[{kind:'other',required:true,excerpt:deferred,en:'Unreviewed interpretation.',fa:'تفسیر نیاز به بازبینی دارد.',ps:'تفسیر بیاکتنې ته اړتیا لري.'}],deadline:null,funding:[]});
 const evidence=normalizeEvidence(mock,input),before=structuredClone(scenario.profile);
 const assessment=assessScholarship(evidence.compilation.rules,scenario.profile);assert.equal(assessment.summary,scenario.expected);
 if(scenario.scenario){const counterfactual=simulate(evidence.compilation.rules,scenario.profile,{deferredOffer:false});assert.equal(counterfactual.scenario.summary,scenario.scenario);assert.deepEqual(scenario.profile,before);}
 results.push({case:scenario.id,language,status:assessment.summary,sourceDigest:evidence.sourceDigest,syntheticComposition:true,passed:true});
}
const report={mode:fixture.mode,liveMetaVerified:false,semanticModelAccuracyEvaluated:false,coverage:'three official excerpt fixtures plus eight synthetic Oxford policy scenarios in three languages; mocked interpretations; no semantic model accuracy claim',checks:results.length,passed:true,results};
mkdirSync('verification/artifacts',{recursive:true});writeFileSync('verification/artifacts/evaluation-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
