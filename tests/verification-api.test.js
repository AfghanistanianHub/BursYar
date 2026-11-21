import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from '../engine/documents.js';
import {VerificationStore,createVerificationService} from '../engine/verification.js';
import {createInferenceServer} from '../engine/http.js';

const origin='http://localhost';
function fixture({maxConcurrent=2}={}){
 const dir=mkdtempSync(join(tmpdir(),'bursyar-verify-api-'));
 const documents=new DocumentStore(join(dir,'documents.db'));
 const verifications=createVerificationService({store:new VerificationStore(join(dir,'verifications.db')),documents});
 const server=createInferenceServer({
  projectId:'demo-bursyar',origin,documents,verifications,maxConcurrent,
  quota:{reserve(){throw Error('verification routes must never reserve inference');}},
  infer:async()=>{throw Error('verification routes must never call a model');},
  verify:async token=>{
   if(!token||token==='revoked')throw Error('no account');
   return {uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true};
  },
  loadFamilyGrant:async()=>null
 });
 return {dir,documents,verifications,server};
}
async function listen(server){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return `http://127.0.0.1:${server.address().port}`;
}
const call=(base,path,{token='alice',method='GET',body,originHeader=origin,contentType='application/json'}={})=>fetch(base+path,{
 method,
 headers:{origin:originHeader,...(token?{authorization:`Bearer ${token}`}:{}),'content-type':contentType},
 ...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})
});

test('verification API is authenticated, consent-gated and cannot self-verify',async()=>{
 const {dir,documents,verifications,server}=fixture();
 const base=await listen(server);
 try{
  const doc=documents.upload('alice',{text:'Degree: bachelor',mime:'text/plain',consent:true});
  assert.equal((await call(base,'/api/verifications',{token:null})).status,401);
  assert.equal((await call(base,'/api/verifications/providers',{token:'revoked'})).status,401);

  const matrix=await call(base,'/api/verifications/providers');
  assert.equal(matrix.status,200);
  const providers=await matrix.json();
  assert.equal(providers.autoVerificationAvailable,false);
  assert.ok(providers.providers.length>=14);
  assert.ok(providers.statuses.includes('VERIFIED_BY_ISSUER'));
  const serialized=JSON.stringify(providers);
  assert.ok(!/apiKey|secret|token/i.test(serialized),'provider matrix must expose no credentials');

  // A client-supplied status or issuer evidence is ignored, never trusted.
  const created=await call(base,'/api/verifications',{method:'POST',body:{
   documentId:doc.id,providerId:'ielts',consent:true,reference:'TRF-0001',
   status:'VERIFIED_BY_ISSUER',issuerEvidence:{kind:'issuer_portal_confirmation'}
  }});
  assert.equal(created.status,201);
  const request=await created.json();
  assert.equal(request.status,'PENDING');
  assert.equal(request.issuerEvidence,null);
  assert.equal(request.provider.autoVerificationAvailable,false);

  assert.equal((await call(base,'/api/verifications',{method:'POST',body:{documentId:doc.id,providerId:'toefl'}})).status,400);
  assert.equal((await call(base,'/api/verifications',{method:'POST',body:{documentId:doc.id,providerId:'not_an_issuer',consent:true}})).status,422);
  assert.equal((await call(base,'/api/verifications',{method:'POST',body:'{bad json'})).status,400);
  assert.equal((await call(base,'/api/verifications',{method:'POST',body:{documentId:doc.id,providerId:'ielts',consent:true},contentType:'text/plain'})).status,415);
  assert.equal((await call(base,'/api/verifications',{method:'POST',body:{documentId:doc.id,providerId:'ielts',consent:true},originHeader:'https://evil.example'})).status,403);

  // Cross-account isolation: another account sees nothing and cannot withdraw.
  assert.deepEqual((await (await call(base,'/api/verifications',{token:'bob'})).json()).requests,[]);
  assert.equal((await call(base,`/api/verifications/${request.id}`,{token:'bob',method:'DELETE'})).status,404);
  assert.equal((await call(base,'/api/verifications',{method:'POST',token:'bob',body:{documentId:doc.id,providerId:'ielts',consent:true}})).status,404);

  const listed=await (await call(base,'/api/verifications')).json();
  assert.equal(listed.requests.length,1);
  assert.equal(listed.requests[0].id,request.id);
  assert.equal(listed.autoVerificationAvailable,false);

  // Data export includes the request history and still claims no authenticity.
  const exported=await (await call(base,'/api/export')).json();
  assert.equal(exported.issuerAuthenticated,false);
  assert.equal(exported.verificationRequests.length,1);
  assert.equal(exported.verificationRequests[0].status,'PENDING');
  assert.equal(exported.verificationRequests[0].issuerEvidence,null);

  // Guardian-scoped family routes never expose the verification workflow.
  assert.equal((await call(base,'/api/family/subject-1/verifications')).status,403);

  assert.equal((await call(base,`/api/verifications/${request.id}`,{method:'DELETE'})).status,200);
  assert.deepEqual((await (await call(base,'/api/verifications')).json()).requests,[]);

  // Account erasure removes verification requests and their audit trail.
  await call(base,'/api/verifications',{method:'POST',body:{documentId:doc.id,providerId:'goethe',consent:true}});
  assert.equal((await call(base,'/api/erase',{method:'DELETE'})).status,200);
  assert.deepEqual((await (await call(base,'/api/verifications')).json()).requests,[]);
  assert.equal(verifications.list('alice').requests.length,0);
 }finally{server.close();rmSync(dir,{recursive:true,force:true});}
});

test('lost response retry returns the existing request, not a duplicate',async()=>{
 const {dir,documents,verifications,server}=fixture();
 const base=await listen(server);
 try{
  const doc=documents.upload('alice',{text:'Transcript for verification',mime:'text/plain',consent:true});
  const body={documentId:doc.id,providerId:'ielts',consent:true,reference:'TRF-2026'};
  const first=await call(base,'/api/verifications',{method:'POST',body});
  assert.equal(first.status,201);
  const firstRecord=await first.json();
  // Simulate a lost client response by repeating the exact POST.
  const retry=await call(base,'/api/verifications',{method:'POST',body});
  assert.ok([200,201].includes(retry.status));
  const retried=await retry.json();
  assert.equal(retried.id,firstRecord.id);
  assert.equal(verifications.list('alice').requests.length,1);
  // A different issuer must remain an independent request.
  const other=await call(base,'/api/verifications',{method:'POST',body:{...body,providerId:'toefl'}});
  assert.equal(other.status,201);
  assert.notEqual((await other.json()).id,firstRecord.id);
  assert.equal(verifications.list('alice').requests.length,2);
  // Once withdrawn, a new request is permitted and gets a new identity.
  assert.equal((await call(base,`/api/verifications/${firstRecord.id}`,{method:'DELETE'})).status,200);
  const replacement=await call(base,'/api/verifications',{method:'POST',body});
  assert.equal(replacement.status,201);
  assert.notEqual((await replacement.json()).id,firstRecord.id);
  assert.equal(verifications.list('alice').requests.length,2);
 }finally{server.close();rmSync(dir,{recursive:true,force:true});}
});

test('concurrent verification submissions preserve one active request per document and issuer',async()=>{
 const {dir,documents,verifications,server}=fixture({maxConcurrent:16});
 const base=await listen(server);
 try{
  const doc=documents.upload('alice',{text:'Transcript',mime:'text/plain',consent:true});
  const body={documentId:doc.id,providerId:'ielts',consent:true,reference:'TRF-CONCURRENT'};
  const responses=await Promise.all(Array.from({length:8},()=>call(base,'/api/verifications',{method:'POST',body})));
  for(const response of responses) assert.ok([200,201].includes(response.status),`Unexpected HTTP status ${response.status}`);
  const records=await Promise.all(responses.map(response=>response.json()));
  assert.equal(new Set(records.map(record=>record.id)).size,1);
  assert.equal(verifications.list('alice').requests.length,1);
 }finally{server.close();rmSync(dir,{recursive:true,force:true});}
});

test('separate SQLite connections share the active-request idempotency guarantee',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-verify-connections-'));
 const documents=new DocumentStore(join(dir,'documents.db'));
 const firstStore=new VerificationStore(join(dir,'verifications.db'));
 const secondStore=new VerificationStore(join(dir,'verifications.db'));
 const first=createVerificationService({store:firstStore,documents});
 const second=createVerificationService({store:secondStore,documents});
 try{
  const doc=documents.upload('alice',{text:'Diploma',mime:'text/plain',consent:true});
  const input={documentId:doc.id,providerId:'ielts',consent:true,reference:'TRF-SHARED'};
  const original=first.create('alice',input);
  const duplicate=second.create('alice',input);
  assert.equal(duplicate.id,original.id);
  assert.equal(first.list('alice').requests.length,1);
  assert.equal(second.list('alice').requests.length,1);
  second.withdraw('alice',original.id);
  const next=first.create('alice',input);
  assert.notEqual(next.id,original.id);
  assert.equal(second.list('alice').requests.length,1);
 }finally{first.close();second.close();rmSync(dir,{recursive:true,force:true});}
});

test('verification routes report unavailable instead of pretending to work',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-verify-off-'));
 const documents=new DocumentStore(join(dir,'documents.db'));
 const server=createInferenceServer({
  projectId:'demo-bursyar',origin,documents,
  quota:{reserve(){throw Error('unused');}},infer:async()=>{},
  verify:async token=>({uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true})
 });
 const base=await listen(server);
 try{
  assert.equal((await call(base,'/api/verifications')).status,503);
  assert.equal((await call(base,'/api/verifications/providers')).status,503);
 }finally{server.close();rmSync(dir,{recursive:true,force:true});}
});
