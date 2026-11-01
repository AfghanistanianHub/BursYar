import test from 'node:test';
import assert from 'node:assert/strict';
import * as account from '../engine/firebase-account-check.js';
const projectId='demo-bursyar';
const claims={uid:'one',sub:'one',aud:projectId,iss:`https://securetoken.google.com/${projectId}`,auth_time:2000};
const options={projectId,webApiKey:'public-web-api-key'};
const user={localId:'one',validSince:'1000',disabled:false};

test('account checker accepts a fresh matching account using token POST to fixed Google endpoint',async()=>{
 let call;const check=account.createFirebaseAccountCheck({...options,fetchImpl:async(url,request)=>{call={url,request};return Response.json({users:[user]});}});
 await check('SENSITIVE_TOKEN',claims);
 assert.equal(new URL(call.url).origin,'https://identitytoolkit.googleapis.com');assert.equal(new URL(call.url).pathname,'/v1/accounts:lookup');
 assert.ok(!call.url.includes('SENSITIVE_TOKEN'));assert.deepEqual(JSON.parse(call.request.body),{idToken:'SENSITIVE_TOKEN'});
 assert.equal(call.request.redirect,'error');assert.equal(call.request.cache,'no-store');
});
test('disabled, deleted, mismatched, revoked or ambiguous accounts are rejected',async()=>{
 for(const users of [[],[user,user],[{...user,disabled:true}],[{...user,disabled:'false'}],[{...user,localId:'other'}],[{...user,validSince:'2001'}],[{...user,tenantId:'unreviewed'}]]){
  const check=account.createFirebaseAccountCheck({...options,fetchImpl:async()=>Response.json({users})});
  await assert.rejects(check('TOKEN',claims),/^Error: Unauthorized$/);
 }
});
test('missing or malformed revocation evidence fails closed, including numeric overflow',async()=>{
 for(const validSince of [undefined,null,'', '-1','1.5','NaN','9007199254740993',2000]){
  const check=account.createFirebaseAccountCheck({...options,fetchImpl:async()=>Response.json({users:[{...user,validSince}]})});
  await assert.rejects(check('TOKEN',claims));
 }
 const boundary=account.createFirebaseAccountCheck({...options,fetchImpl:async()=>Response.json({users:[{...user,validSince:'2000'}]})});await boundary('TOKEN',claims);
});
test('project, uid, tenant and auth-time evidence are validated before any outgoing lookup',async()=>{
 let calls=0;const check=account.createFirebaseAccountCheck({...options,fetchImpl:async()=>{calls++;return Response.json({users:[user]});}});
 for(const patch of [{aud:'other'},{iss:'https://evil.example'},{sub:'other'},{uid:''},{auth_time:null},{auth_time:NaN},{auth_time:-1},{auth_time:1.1},{firebase:{tenant:'other'}}])await assert.rejects(check('TOKEN',{...claims,...patch}));
 assert.equal(calls,0);
});
test('unknown disabled flag is the documented default enabled value',async()=>{
 const {disabled,...enabled}=user;const check=account.createFirebaseAccountCheck({...options,fetchImpl:async()=>Response.json({users:[enabled]})});await check('TOKEN',claims);
});
test('provider error bodies and transport failures never surface private values',async()=>{
 for(const fetchImpl of [async()=>Response.json({error:'SECRET_TOKEN SECRET_EMAIL'},{status:400}),async()=>{throw Error('SECRET_TOKEN');},async()=>new Response('SECRET_EMAIL',{headers:{'content-type':'text/html'}})]){
  const check=account.createFirebaseAccountCheck({...options,fetchImpl});await assert.rejects(check('TOKEN',claims),error=>error.message==='Unauthorized'&&!error.cause);
 }
});
test('lookup body is bounded and never treated as trusted when oversized or malformed',async()=>{
 for(const response of [()=>new Response('x'.repeat(65537),{headers:{'content-type':'application/json'}}),()=>new Response('{',{headers:{'content-type':'application/json'}}),()=>Response.json({users:null})]){
  const check=account.createFirebaseAccountCheck({...options,fetchImpl:async()=>response()});await assert.rejects(check('TOKEN',claims));
 }
});
test('deadline rejects even if the transport ignores cancellation',async()=>{
 const check=account.createFirebaseAccountCheck({...options,timeoutMs:15,fetchImpl:async()=>new Promise(()=>{})});
 await assert.rejects(check('TOKEN',claims),/^Error: Unauthorized$/);
});
test('deadline rejects a stalled body reader',async()=>{
 const check=account.createFirebaseAccountCheck({...options,timeoutMs:15,fetchImpl:async()=>new Response(new ReadableStream({start(){}}),{headers:{'content-type':'application/json'}})});
 await assert.rejects(check('TOKEN',claims),/^Error: Unauthorized$/);
});
test('Firebase SDK still rejects unsigned tokens before any account lookup',async()=>{
 const {createFirebaseVerifier}=await import('../engine/auth.js');const {deleteApp,getApp}=await import('firebase-admin/app');let calls=0;
 const verify=createFirebaseVerifier({...options,credential:{getAccessToken:async()=>{throw Error('No credentials');}},accountFetch:async()=>{calls++;return Response.json({users:[user]});}});
 try{const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');await assert.rejects(verify(encode({alg:'none',typ:'JWT'})+'.'+encode(claims)+'.'));assert.equal(calls,0);}finally{await deleteApp(getApp('bursyar-inference'));}
});
