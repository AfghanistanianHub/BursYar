import test from 'node:test';
import assert from 'node:assert/strict';
import {createInferenceServer} from '../engine/http.js';
import {describeCapabilities} from '../engine/capabilities.js';
import {adultPolicy} from './helpers/policy.js';
const projectId='demo-bursyar';
const body={text:'Applicants must provide academic transcripts. Tuition fees are covered.',sourceUrl:'https://university.example/award',language:'en'};
async function withServer(options,run){
 const server=createInferenceServer({projectId,origin:'http://localhost:5173',verify:async()=>({uid:'one',aud:projectId,iss:`https://securetoken.google.com/${projectId}`,bursyarDemo:true}),quota:{reserve(){throw Error('must not reserve');}},diagnose(){},...options});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{await run(`http://127.0.0.1:${server.address().port}`);}finally{await new Promise(r=>server.close(r));}
}
test('health reports truthful capabilities without authentication and never claims inference',async()=>{
 const capabilities=describeCapabilities({});
 await withServer({capabilities,infer:async()=>{throw Error('must not infer');}},async base=>{
  const r=await fetch(`${base}/health`);
  assert.equal(r.status,200);
  const data=await r.json();
  assert.equal(data.ok,true);assert.equal(data.capabilities.meta.state,'disabled');
  assert.equal(data.capabilities.meta.reason,'provider_config_missing');
  assert.equal(data.capabilities.inferenceVerified,false);
  assert.equal(data.capabilities.localAssessment.available,true);
  assert.ok(!JSON.stringify(data).includes('SECRET'));
 });
 await withServer({infer:async()=>{throw Error('must not infer');}},async base=>{
  assert.deepEqual(await (await fetch(`${base}/health`)).json(),{ok:true});
 });
});
test('JSON responses carry baseline hardening headers',async()=>{
 await withServer({infer:async()=>{throw Error('must not infer');}},async base=>{
  for(const path of ['/health','/no-such-route']){
   const r=await fetch(`${base}${path}`);
   assert.equal(r.headers.get('x-content-type-options'),'nosniff');
   assert.equal(r.headers.get('cache-control'),'no-store');
   assert.equal(r.headers.get('referrer-policy'),'no-referrer');
   assert.equal(r.headers.get('content-security-policy'),"default-src 'none'; frame-ancestors 'none'");
  }
 });
});
test('missing policy records deny analysis before provider or quota',async()=>{
 let calls=0,reservations=0;
 await withServer({policyContextForRequest:async()=>{throw Error('Trusted evidence unavailable');},infer:async()=>{calls++;return '{}';},quota:{reserve(){reservations++;}}},async base=>{
  const r=await fetch(`${base}/api/analyze`,{method:'POST',headers:{authorization:'Bearer [REDACTED]','content-type':'application/json'},body:JSON.stringify(body)});
  assert.equal(r.status,403);assert.deepEqual(await r.json(),{error:'Analysis unavailable for this request'});
 });
 assert.equal(calls,0);assert.equal(reservations,0);
});
test('expired and revoked policy records deny without provider calls',async()=>{
 const {createTrustedPolicyResolver}=await import('../engine/trusted-policy.js');
 const provider={provider:'meta',enabled:true,model:'muse-spark-1.3',models:['muse-spark-1.3'],termsReviewed:true,termsValidUntil:4000,privacyReviewed:true,audience:'adult_only',regions:['CA'],consentVersion:1,maxReservationUnits:50000,dataClasses:['user_content']};
 const record={uid:'one',subjectId:'one',provider:'meta',country:'CA',locationVerified:true,jurisdictionDecision:'allowed',ageVerified:true,subjectAgeVerified:true,userAgeBand:'adult_18_plus',subjectAgeBand:'adult_18_plus',verifiedAt:1000,expiresAt:3000,consent:{active:true,version:1,provider:'meta',subjectId:'one'}};
 for(const change of [{expiresAt:2000}, {revoked:true}, {verifiedAt:3000}]){
  const resolve=createTrustedPolicyResolver({loadRecord:async()=>({...record,...change}),providers:{meta:provider},now:()=>2000});
  await assert.rejects(resolve({uid:'one'}),/Policy not cleared/);
 }
 const missing=createTrustedPolicyResolver({loadRecord:async()=>undefined,providers:{meta:provider},now:()=>2000});
 await assert.rejects(missing({uid:'one'}),/Policy not cleared/);
});
test('missing provider adapter denies with 503 after policy allows, without transport',async()=>{
 let calls=0;
 const unavailable={provider:'meta',model:'muse-spark-1.3',available:false};
 await withServer({providers:{meta:unavailable},policyContextForRequest:async()=>({...adultPolicy}),quota:{reserve(){throw Error('must not reserve');}}},async base=>{
  const r=await fetch(`${base}/api/analyze`,{method:'POST',headers:{authorization:'Bearer [REDACTED]','content-type':'application/json'},body:JSON.stringify(body)});
  assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'Analysis unavailable'});
 });
 assert.equal(calls,0);
});
test('unconfirmed spending denies before quota even when policy and adapter allow',async()=>{
 let reservations=0,calls=0;
 const adapter={provider:'meta',model:'muse-spark-1.3',available:true,infer:async()=>{calls++;return '{}';},reservationUnits:()=>1,quota:{reserve(){reservations++;}}};
 await withServer({providers:{meta:adapter},policyContextForRequest:async()=>({...adultPolicy}),canInfer:()=>false},async base=>{
  const r=await fetch(`${base}/api/analyze`,{method:'POST',headers:{authorization:'Bearer [REDACTED]','content-type':'application/json'},body:JSON.stringify(body)});
  assert.equal(r.status,503);
 });
 assert.equal(calls,0);assert.equal(reservations,0);
});
