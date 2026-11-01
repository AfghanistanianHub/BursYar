import {CLIENT_ANALYSIS_TIMEOUT_MS} from '../engine/provider-config.js';
// Opt-in live end-to-end check: real Google sign-in (via owner-supplied ID token)
// → official public scholarship text → explicit source approval (gateway receipt)
// → exactly one Meta request → validated evidence → rendered-result schema.
// Browser fixtures (BROWSER_WITH_MOCK_AUTH_AND_API) are offline rehearsal only
// and must never be presented as live verification. This runner makes no
// inference unless BURSYAR_LIVE_TEST=1 with an approved token. Never prints
// keys, tokens, private documents, or cost estimates.
import {writeFileSync,mkdirSync} from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readOfficialSource,SOURCE_URL} from './official-source.mjs';
const run=promisify(execFile);
const report={mode:'REAL_GATEWAY_AND_META_REQUIRED',fixture:false,liveMetaRequired:true,passed:false,translationHumanReview:'pending',semanticHumanReview:'pending'};
mkdirSync('verification/artifacts',{recursive:true});
try{
 if(process.env.BURSYAR_LIVE_TEST!=='1')throw Error('Set BURSYAR_LIVE_TEST=1 only after account spend limits and approved demo identity are configured');
 const token=process.env.BURSYAR_TEST_ID_TOKEN;
 if(!token)throw Error('Approved Firebase ID token required through secure process environment');
 const gateway=new URL(process.env.BURSYAR_GATEWAY_URL||'http://127.0.0.1:8080');
 if(gateway.origin!=='http://127.0.0.1:8080')throw Error('Live smoke runner restricted to local gateway');
 try{report.codeVersion=(await run('git',['rev-parse','HEAD'],{timeout:10000})).stdout.trim()||null;}catch{report.codeVersion=null;}
 // Public scholarship text only; synthetic applicant data only (no profile sent).
 const source=await readOfficialSource();
 const auth={'content-type':'application/json',authorization:`Bearer ${token}`};
 // Explicit source approval: obtain a gateway receipt before analysis. A
 // server fetch proves collection time only, never issuer authenticity.
 let receipt=null,receiptKind=null;
 try{
  const fetched=await fetch(new URL('/api/source',gateway),{method:'POST',redirect:'error',headers:auth,body:JSON.stringify({url:SOURCE_URL}),signal:AbortSignal.timeout(30000)});
  if(fetched.ok){const data=await fetched.json();if(data.receipt?.signature&&data.text===source.text){receipt=data.receipt;receiptKind=data.receipt.kind;}}
 }catch{}
 if(!receipt){
  const imported=await fetch(new URL('/api/source/import',gateway),{method:'POST',redirect:'error',headers:auth,body:JSON.stringify({url:source.sourceUrl,format:'text',contentBase64:Buffer.from(source.text,'utf8').toString('base64')}),signal:AbortSignal.timeout(30000)});
  if(!imported.ok)throw Error('Gateway source approval unavailable; no inference attempted');
  const data=await imported.json();
  if(!data.receipt?.signature)throw Error('Gateway source approval unavailable; no inference attempted');
  receipt=data.receipt;receiptKind=data.receipt.kind;
 }
 report.receiptKind=receiptKind;
 const start=performance.now();
 const response=await fetch(new URL('/api/analyze',gateway),{method:'POST',redirect:'error',headers:auth,body:JSON.stringify({text:source.text,sourceUrl:source.sourceUrl,language:'en',receipt,sourceApproved:true}),signal:AbortSignal.timeout(CLIENT_ANALYSIS_TIMEOUT_MS)});
 report.httpStatus=response.status;report.latencyMs=Math.round(performance.now()-start);
 if(!response.ok)throw Error('Gateway did not return a successful analysis');
 const analysis=await response.json();
 if(analysis.sourceDigest!==source.sourceDigest||analysis.requiresHumanReview!==true||analysis.verifiedAt!==null||!Array.isArray(analysis.criteria)||analysis.criteria.length===0||!analysis.funding.some(x=>/course fees/i.test(x)))throw Error('Analysis failed official-source evidence checks');
 if(!analysis.criteria.every(c=>source.text.includes(c.excerpt)&&c.en&&/[\u0600-\u06ff]/.test(c.fa)&&/[\u0600-\u06ff]/.test(c.ps)))throw Error('Missing evidence or translation fields');
 if(analysis.deadline!==null && (!source.text.includes(analysis.deadline)||!/December|January/i.test(analysis.deadline)))throw Error('Deadline is not the source course-specific wording');
 report.passed=true;report.validationOutcome='analysis_validated';report.sourceUrl=source.sourceUrl;report.sourceDigest=source.sourceDigest;report.criteriaCount=analysis.criteria.length;report.resultSchemaVerified=true;
 report.correlationNote='Correlate requestId, model, and provider token counts from the backend meta_response + analysis_validated log pair (same requestId). This report never carries keys, tokens, or cost estimates.';
 // Public scholarship model output retained locally for human review, never credential headers.
 writeFileSync('verification/artifacts/live-analysis.json',JSON.stringify(analysis,null,2));
}catch(error){report.blocker=error.message;report.validationOutcome='not_validated';process.exitCode=1;}
finally{writeFileSync('verification/artifacts/live-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
