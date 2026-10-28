import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createInferenceServer} from '../engine/http.js';
import {QuotaStore} from '../engine/quota.js';
import {MetaFailure,createMetaInference} from '../engine/meta.js';
const projectId='demo-bursyar';
const text='Applicants must provide academic transcripts. Tuition fees are covered.';
const body={text,sourceUrl:'https://university.example/award',language:'fa'};
const result={criteria:[{kind:'transcripts',required:true,excerpt:'Applicants must provide academic transcripts.',en:'Provide transcripts.',fa:'اسناد تحصیلی ارائه کنید.',ps:'تحصیلي اسناد وړاندې کړئ.'}],deadline:null,funding:['Tuition fees are covered.']};
async function fixture(run,{infer=async()=>JSON.stringify(result),verify=async()=>({uid:'one',aud:projectId,iss:`https://securetoken.google.com/${projectId}`,bursyarDemo:true}),quotaOverride,diagnose,canInfer}={}){
 const dir=mkdtempSync(join(tmpdir(),'bursyar-http-'));
 const quota=new QuotaStore(join(dir,'quota.db'),{userMinute:2,userDay:3,globalDay:4,lifetimeUnits:200000});
 const server=createInferenceServer({verify,projectId,quota:quotaOverride||quota,infer,origin:'http://localhost:5173',...(diagnose?{diagnose}:{}),...(canInfer?{canInfer}:{})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/api/analyze`;
 const post=(payload=body,headers={authorization:'Bearer signed-token','content-type':'application/json'})=>fetch(url,{method:'POST',headers,body:typeof payload==='string'?payload:JSON.stringify(payload)});
 try{await run({post,url,quota});}finally{await new Promise(resolve=>server.close(resolve));quota.close();rmSync(dir,{recursive:true,force:true});}
}
test('authenticated mock-provider flow returns evidence, translated fields, quota enforcement and no persisted applicant answers',async()=>fixture(async({post})=>{
 const r=await post();assert.equal(r.status,200);const a=await r.json();assert.equal(a.requiresHumanReview,true);assert.equal(a.criteria[0].fa,result.criteria[0].fa);assert.equal(a.sourceDigest.length,64);
 assert.equal((await post()).status,200);assert.equal((await post()).status,429);
}));
test('rejects unauthorized, cross-origin, malformed, oversized and invalid source requests before inference',async()=>{
 let calls=0;await fixture(async({post})=>{
 assert.equal((await post(body,{'content-type':'application/json'})).status,401);
 assert.equal((await post(body,{authorization:'Bearer x','content-type':'application/json',origin:'https://evil.example'})).status,403);
 assert.equal((await post('{')).status,400);
 assert.equal((await post({...body,sourceUrl:'javascript:alert(1)'})).status,400);
 assert.equal((await post('x'.repeat(60000))).status,413);
 assert.equal(calls,0);
 },{infer:async()=>{calls++;return JSON.stringify(result);}});
});
test('storage failure prevents provider calls',async()=>{let calls=0;await fixture(async({post})=>assert.equal((await post()).status,503),{quotaOverride:{reserve(){throw Error('disk failed');}},infer:async()=>{calls++;}});assert.equal(calls,0);});
test('provider failures are generic and still consume reserved quota',async()=>fixture(async({post})=>{
 for(let i=0;i<2;i++){const r=await post();assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'Analysis unavailable'});}assert.equal((await post()).status,429);
},{infer:async()=>{throw Error('SECRET provider response');}}));

test('diagnostics distinguish evidence, upstream authentication and timeouts without source or identity',async()=>{
 for(const [infer,code,status,stage] of [[async()=>'{','evidence_json',502,'evidence'],[async()=>{throw new MetaFailure('provider_auth',502,401);},'provider_auth',502,'provider'],[async()=>{throw new MetaFailure('provider_timeout',504);},'provider_timeout',504,'provider']]){
  const records=[];await fixture(async({post})=>{const r=await post();assert.equal(r.status,status);assert.deepEqual(await r.json(),{error:'Analysis unavailable'});},{infer,diagnose:r=>records.push(r)});
  assert.equal(records.length,1);assert.equal(records[0].code,code);assert.equal(records[0].stage,stage);
  assert.deepEqual(Object.keys(records[0]).sort(),['code','elapsedMs','event','providerStatus','requestId','stage']);
  assert.ok(!JSON.stringify(records).includes(text));assert.ok(!JSON.stringify(records).includes('signed-token'));
 }
});
test('logging failure preserves safe HTTP failure and consumed quota',async()=>fixture(async({post})=>{assert.equal((await post()).status,504);assert.equal((await post()).status,504);assert.equal((await post()).status,429);},{infer:async()=>{throw new MetaFailure('provider_timeout',504);},diagnose:()=>{throw Error('logger failed');}}));

test('unconfirmed spending blocks inference before persistent quota reservation',async()=>{
 let reservations=0,calls=0;
 await fixture(async({post})=>{for(let i=0;i<3;i++){const r=await post();assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'Analysis unavailable'});}},{canInfer:()=>false,quotaOverride:{reserve(){reservations++;}},infer:async()=>{calls++;}});
 assert.equal(reservations,0);assert.equal(calls,0);
});

test('actual adapter deadlines retain reservations, return safe diagnostics and never retry',async()=>{
 let calls=0;const records=[];
 const infer=createMetaInference({key:'SECRET KEY',model:'muse-spark-1.3',timeoutMs:15,fetchImpl:async()=>{calls++;return new Promise(()=>{});}});
 await fixture(async({post,quota})=>{
  for(let i=0;i<2;i++){const response=await post();assert.equal(response.status,504);assert.deepEqual(await response.json(),{error:'Analysis unavailable'});}
  assert.equal((await post()).status,429);assert.equal(calls,2);
  assert.ok(quota.db.prepare("SELECT used FROM quota WHERE bucket='lifetime'").get().used>0);
 },{infer,diagnose:record=>records.push(record)});
 assert.equal(records.length,2);
 for(const record of records){assert.equal(record.provider.phase,'awaiting_response_headers');assert.equal(record.provider.timeoutCause,'local_deadline');assert.equal(record.provider.timeoutMs,15);assert.equal(record.provider.maxCompletionTokens,4000);}
 const logged=JSON.stringify(records);for(const forbidden of ['SECRET KEY','signed-token',text,'one','authorization'])assert.ok(!logged.includes(forbidden));
});
test('client disconnect aborts provider work but never refunds the reserved quota',async()=>{
 let started,finished;const ready=new Promise(resolve=>started=resolve),cancelled=new Promise(resolve=>finished=resolve);let calls=0;
 const infer=createMetaInference({key:'SECRET',model:'muse-spark-1.3',timeoutMs:1000,fetchImpl:async(_,{signal})=>{calls++;signal.addEventListener('abort',finished,{once:true});started();return new Promise(()=>{});}});
 const records=[];
 await fixture(async({url,quota,post})=>{
  const controller=new AbortController();
  const request=fetch(url,{method:'POST',headers:{authorization:'Bearer signed-token','content-type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
  // Attach before cancelling so an expected rejection can never be unhandled.
  const rejected=assert.rejects(request);await ready;controller.abort();await rejected;
  await Promise.race([cancelled,new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Provider cancellation not propagated')),500);t.unref();})]);
  assert.equal(calls,1);assert.ok(quota.db.prepare("SELECT used FROM quota WHERE bucket='lifetime'").get().used>0);
  quota.reserve('one',1);assert.equal((await post()).status,429);assert.equal(calls,1);
 },{infer,diagnose:record=>records.push(record)});
 assert.equal(records[0].code,'provider_cancelled');assert.equal(records[0].provider.timeoutCause,'caller_cancelled');
});
test('gateway filters arbitrary provider diagnostic properties again before logging',async()=>{
 const error=new MetaFailure('provider_timeout',504);
 error.diagnostics={phase:'awaiting_response_headers',timeoutCause:'local_deadline',timeoutMs:15,model:'SECRET MODEL',authorization:'SECRET KEY',headers:'PRIVATE',responseBytes:NaN,requestBytes:-1,transportCode:'PRIVATE',source:text};
 const records=[];await fixture(async({post})=>assert.equal((await post()).status,504),{infer:async()=>{throw error;},diagnose:record=>records.push(record)});
 assert.deepEqual(records[0].provider,{phase:'awaiting_response_headers',timeoutCause:'local_deadline',timeoutMs:15});
});
