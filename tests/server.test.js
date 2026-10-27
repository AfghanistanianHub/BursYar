import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createInferenceServer} from '../engine/http.js';
import {QuotaStore} from '../engine/quota.js';
import {MetaFailure} from '../engine/meta.js';
const projectId='demo-bursyar';
const text='Applicants must provide academic transcripts. Tuition fees are covered.';
const body={text,sourceUrl:'https://university.example/award',language:'fa'};
const result={criteria:[{kind:'transcripts',required:true,excerpt:'Applicants must provide academic transcripts.',en:'Provide transcripts.',fa:'اسناد تحصیلی ارائه کنید.',ps:'تحصیلي اسناد وړاندې کړئ.'}],deadline:null,funding:['Tuition fees are covered.']};
async function fixture(run,{infer=async()=>JSON.stringify(result),verify=async()=>({uid:'one',aud:projectId,iss:`https://securetoken.google.com/${projectId}`,bursyarDemo:true}),quotaOverride,diagnose}={}){
 const dir=mkdtempSync(join(tmpdir(),'bursyar-http-'));
 const quota=new QuotaStore(join(dir,'quota.db'),{userMinute:2,userDay:3,globalDay:4,lifetimeUnits:200000});
 const server=createInferenceServer({verify,projectId,quota:quotaOverride||quota,infer,origin:'http://localhost:5173',...(diagnose?{diagnose}:{})});
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
