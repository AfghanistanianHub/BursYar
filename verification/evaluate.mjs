// No provider import or network access. Expected answers remain in this harness.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {normalizeEvidence} from '../engine/evidence.js';
import {assessScholarship} from '../engine/eligibility.js';
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
const report={mode:fixture.mode,liveMetaVerified:false,semanticModelAccuracyEvaluated:false,coverage:'three official excerpt fixtures; conservative unknown handling only',checks:results.length,passed:true,results};
mkdirSync('verification/artifacts',{recursive:true});writeFileSync('verification/artifacts/evaluation-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
