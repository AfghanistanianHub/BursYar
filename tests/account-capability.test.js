import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';

const origin='http://localhost';
function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'bursyar-capability-'));
 const documents=new DocumentStore(join(dir,'documents.db'));
 const server=createInferenceServer({
  projectId:'demo-bursyar',origin,documents,
  quota:{reserve(){throw Error('capability routes must never reserve inference');}},
  infer:async()=>{throw Error('capability routes must never call a model');},
  verify:async token=>{
   if(!token||token==='revoked')throw Error('no account');
   // 'alice' carries the closed-pilot claim; 'unlisted' is a valid signed-in
   // Google account that no operator has enrolled yet.
   return {uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:token!=='unlisted'};
  }
 });
 return {dir,documents,server};
}
async function listen(server){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return `http://127.0.0.1:${server.address().port}`;
}
const call=(base,path,{token,method='GET',body,originHeader=origin}={})=>fetch(base+path,{
 method,
 headers:{origin:originHeader,...(token?{authorization:`Bearer ${token}`}:{}),'content-type':'application/json'},
 ...(body!==undefined?{body:JSON.stringify(body)}:{})
});

test('capability probe reports enrolment without authorising private data',async()=>{
 const {dir,server}=fixture();
 const base=await listen(server);
 try{
  assert.equal((await call(base,'/api/me')).status,401);
  assert.equal((await call(base,'/api/me',{token:'revoked'})).status,401);

  const enrolled=await call(base,'/api/me',{token:'alice'});
  assert.equal(enrolled.status,200);
  const enrolledBody=await enrolled.json();
  assert.equal(enrolledBody.authenticated,true);
  assert.equal(enrolledBody.enrolled,true);
  assert.equal(enrolledBody.enrollment,'closed_pilot');
  assert.equal(enrolledBody.capabilities.profile,true);

  // A valid identity without the closed-pilot claim learns why, and is not
  // told its sign-in failed.
  const unlisted=await call(base,'/api/me',{token:'unlisted'});
  assert.equal(unlisted.status,200);
  const unlistedBody=await unlisted.json();
  assert.equal(unlistedBody.enrolled,false);
  assert.equal(unlistedBody.capabilities.documents,false);
  assert.equal(unlistedBody.capabilities.analysis,false);

  // The same identity is refused every private route with a distinct code,
  // so the UI can offer a request-access path instead of another sign-in.
  for(const [path,method] of [['/api/profile','GET'],['/api/documents','GET'],['/api/export','GET'],['/api/verifications','GET']]){
   const response=await call(base,path,{token:'unlisted',method});
   assert.equal(response.status,403,`${method} ${path} must be refused for an unenrolled account`);
   assert.equal((await response.json()).code,'account_not_enrolled');
  }

  const missing=await call(base,'/api/profile');
  assert.equal(missing.status,401);
  assert.equal((await missing.json()).code,'unauthorized');

  // A valid enrolled account still works, and a foreign origin is still denied.
  assert.equal((await call(base,'/api/profile',{token:'alice'})).status,200);
  assert.equal((await call(base,'/api/me',{token:'alice',originHeader:'https://evil.example'})).status,403);
  assert.equal((await call(base,'/api/me',{method:'POST',token:'alice'})).status,405);
 }finally{server.close();rmSync(dir,{recursive:true,force:true});}
});

test('a single verification request can be read by its owner and not by another account',async()=>{
 const {dir,documents,server}=fixture();
 const {VerificationStore,createVerificationService}=await import('../engine/verification.js');
 const verifications=createVerificationService({store:new VerificationStore(join(dir,'verifications.db')),documents});
 const withWorkflow=createInferenceServer({
  projectId:'demo-bursyar',origin,documents,verifications,
  quota:{reserve(){throw Error('unused');}},
  infer:async()=>{throw Error('unused');},
  verify:async token=>({uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true})
 });
 const base=await listen(withWorkflow);
 try{
  const doc=documents.upload('alice',{text:'Degree: bachelor',mime:'text/plain',consent:true});
  const created=await call(base,'/api/verifications',{token:'alice',method:'POST',body:{documentId:doc.id,providerId:'ielts',consent:true}});
  assert.equal(created.status,201);
  const request=await created.json();

  const own=await call(base,`/api/verifications/${request.id}`,{token:'alice'});
  assert.equal(own.status,200);
  assert.equal((await own.json()).id,request.id);
  assert.equal((await call(base,`/api/verifications/${request.id}`,{token:'bob'})).status,404);
  assert.equal((await call(base,'/api/verifications/00000000-0000-0000-0000-000000000000',{token:'alice'})).status,404);
 }finally{withWorkflow.close();rmSync(dir,{recursive:true,force:true});}
});
