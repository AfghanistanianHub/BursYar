import test from 'node:test';
import assert from 'node:assert/strict';
import {RemoteQuotaStore,createQuotaStorage} from '../engine/remote-quota.js';
import {QuotaExceeded} from '../engine/quota.js';
const url='https://abcdefghijklmnopqrst.supabase.co',key='sb_secret_SYNTHETIC_TEST_KEY_ONLY_123456';
const limits={userMinute:2,userDay:5,globalDay:20,lifetimeUnits:200000};
test('remote quota registers immutable limits and sends only hashed identity and units',async()=>{
 const bodies=[];const q=new RemoteQuotaStore({url,key,provider:'meta',limits,fetchImpl:async(endpoint,options)=>{bodies.push({endpoint,body:JSON.parse(options.body)});return Response.json(true);}});
 await q.initialize();await q.reserve('private-owner-uid',100);
 assert.ok(bodies[0].endpoint.endsWith('/bursyar_quota_initialize'));assert.deepEqual(bodies[0].body,{p_provider:'meta',p_limits:limits});
 assert.ok(bodies[1].endpoint.endsWith('/bursyar_quota_reserve'));assert.deepEqual(Object.keys(bodies[1].body).sort(),['p_provider','p_subject','p_units']);
 assert.match(bodies[1].body.p_subject,/^[a-f0-9]{64}$/);assert.equal(bodies[1].body.p_units,100);assert.ok(!JSON.stringify(bodies).includes('private-owner-uid'));
});
test('exhaustion is distinct from storage failure and reservations never retry',async()=>{
 for(const response of [false,null,{ok:true}]){
  let calls=0;const q=new RemoteQuotaStore({url,key,provider:'meta',limits,fetchImpl:async()=>{calls++;return Response.json(response);}});
  await assert.rejects(q.reserve('alice',10),e=>response===false?e instanceof QuotaExceeded:e.message==='Quota storage unavailable');assert.equal(calls,1);
 }
 let calls=0;const q=new RemoteQuotaStore({url,key,provider:'meta',limits,fetchImpl:async()=>{calls++;throw Error('PRIVATE_DETAIL');}});
 await assert.rejects(q.reserve('alice',10),e=>e.message==='Quota storage unavailable');assert.equal(calls,1);
});
test('invalid remote quota configuration or units fail before network use',async()=>{
 let calls=0;const config={url,key,provider:'meta',limits,fetchImpl:async()=>{calls++;return Response.json(true);}};
 for(const override of [{provider:'unknown'},{limits:{...limits,userMinute:0}},{limits:{...limits,lifetimeUnits:Infinity}},{limits:{...limits,userDay:1.1}}])assert.throws(()=>new RemoteQuotaStore({...config,...override}));
 const q=new RemoteQuotaStore(config);for(const units of [0,-1,1.5,Infinity,Number.MAX_SAFE_INTEGER+1])await assert.rejects(q.reserve('alice',units));await assert.rejects(q.reserve('',1));assert.equal(calls,0);
});
test('hosted quota factory probes real RPC and rejects local/remote ambiguity',async()=>{
 const env={BURSYAR_QUOTA_STORAGE:'supabase',BURSYAR_DOCUMENT_SUPABASE_URL:url,BURSYAR_DOCUMENT_SUPABASE_KEY:key};let calls=0;
 const q=await createQuotaStorage(env,{provider:'meta',limits,fetchImpl:async()=>{calls++;return Response.json(true);}});assert.equal(calls,1);q.close();
 await assert.rejects(createQuotaStorage({...env,BURSYAR_QUOTA_DB:'/unused'},{provider:'meta',limits}));
 await assert.rejects(createQuotaStorage({...env,BURSYAR_DOCUMENT_SUPABASE_KEY:''},{provider:'meta',limits}));
 await assert.rejects(createQuotaStorage({BURSYAR_QUOTA_STORAGE:'typo'},{provider:'meta',limits}));
 await assert.rejects(createQuotaStorage(env,{provider:'meta',limits,fetchImpl:async()=>Response.json(false)}));
});
