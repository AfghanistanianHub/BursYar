import {CLIENT_ANALYSIS_TIMEOUT_MS} from '../engine/provider-config.js';
// Explicit real-integration test. Never supplies fake tokens/provider replies or prints secrets.
import {writeFileSync,mkdirSync} from 'node:fs';
import {readOfficialSource} from './official-source.mjs';
const report={mode:'REAL_GATEWAY_AND_META_REQUIRED',passed:false,translationHumanReview:'pending'};
mkdirSync('verification/artifacts',{recursive:true});
try{
 if(process.env.BURSYAR_LIVE_TEST!=='1')throw Error('Set BURSYAR_LIVE_TEST=1 only after account spend limits and approved demo identity are configured');
 const token=process.env.BURSYAR_TEST_ID_TOKEN;
 if(!token)throw Error('Approved Firebase ID token required through secure process environment');
 const gateway=new URL(process.env.BURSYAR_GATEWAY_URL||'http://127.0.0.1:8080');
 if(gateway.origin!=='http://127.0.0.1:8080')throw Error('Live smoke runner restricted to local gateway');
 const source=await readOfficialSource();
 const start=performance.now();
 const response=await fetch(new URL('/api/analyze',gateway),{method:'POST',redirect:'error',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({text:source.text,sourceUrl:source.sourceUrl,language:'en'}),signal:AbortSignal.timeout(CLIENT_ANALYSIS_TIMEOUT_MS)});
 report.httpStatus=response.status;report.latencyMs=Math.round(performance.now()-start);
 if(!response.ok)throw Error('Gateway did not return a successful analysis');
 const analysis=await response.json();
 if(analysis.sourceDigest!==source.sourceDigest||analysis.requiresHumanReview!==true||analysis.verifiedAt!==null||!Array.isArray(analysis.criteria)||analysis.criteria.length===0||!analysis.funding.some(x=>/course fees/i.test(x)))throw Error('Analysis failed official-source evidence checks');
 if(!analysis.criteria.every(c=>source.text.includes(c.excerpt)&&c.en&&/[\u0600-\u06ff]/.test(c.fa)&&/[\u0600-\u06ff]/.test(c.ps)))throw Error('Missing evidence or translation fields');
 if(analysis.deadline!==null && (!source.text.includes(analysis.deadline)||!/December|January/i.test(analysis.deadline)))throw Error('Deadline is not the source course-specific wording');
 report.passed=true;report.sourceUrl=source.sourceUrl;report.sourceDigest=source.sourceDigest;report.criteriaCount=analysis.criteria.length;report.resultSchemaVerified=true;report.semanticHumanReview='pending';
 // Public scholarship model output retained locally for human review, never credential headers.
 writeFileSync('verification/artifacts/live-analysis.json',JSON.stringify(analysis,null,2));
}catch(error){report.blocker=error.message;process.exitCode=1;}
finally{writeFileSync('verification/artifacts/live-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
