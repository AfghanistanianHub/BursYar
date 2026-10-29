import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,statSync,chmodSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';
const synthetic='SYNTHETIC TEST ONLY — NOT A CERTIFICATE\nDegree: bachelor\nIELTS Academic: overall=7; listening=7; reading=7; writing=6; speaking=7';
const input={text:synthetic,mime:'text/plain',consent:true};
test('private documents require consent, support review and correction, persist, isolate and delete',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-docs-')),path=join(dir,'documents.db');let store;
 try{
  store=new DocumentStore(path);
  assert.equal(statSync(path).mode&0o077,0);
  for(const bad of [{...input,consent:false},{...input,mime:'application/pdf'},{...input,text:'x'.repeat(12001)},{...input,text:'\x00PDF'}])assert.throws(()=>store.upload('alice',bad));
  const doc=store.upload('alice',input);
  assert.equal(doc.authenticity,'not_verified');assert.equal(doc.translationStatus,'not_assessed');assert.equal(doc.pending.length,2);
  assert.deepEqual(store.profile('alice'),{});
  assert.throws(()=>store.get('bob',doc.id),e=>e.status===404);
  assert.throws(()=>store.review('bob',doc.id,{}),e=>e.status===404);
  assert.throws(()=>store.delete('bob',doc.id),e=>e.status===404);
  assert.throws(()=>store.review('alice',doc.id,{}),e=>e.status===400);
  const decisions=Object.fromEntries(doc.pending.map(c=>[c.id,c.field==='degree'?{action:'correct',value:'master'}:{action:'accept'}]));
  const profile=store.review('alice',doc.id,decisions);
  assert.equal(profile.degree.origin,'user_declared');assert.deepEqual(profile.degree.claimIds,[]);
  assert.equal(profile.languageTest.origin,'document_extracted');assert.equal(profile.languageTest.verificationStatus,'not_verified');
  assert.throws(()=>store.review('alice',doc.id,decisions),e=>e.status===409);
  store.close();store=new DocumentStore(path);assert.deepEqual(store.profile('alice'),profile);
  assert.equal(store.get('alice',doc.id).reviewHistory.length,2);
  assert.equal(store.delete('alice',doc.id).deleted,true);assert.deepEqual(store.profile('alice'),{});
  assert.throws(()=>store.get('alice',doc.id),e=>e.status===404);
 }finally{store?.close();rmSync(dir,{recursive:true,force:true});}
});
test('conflicting document lines require review and retained-document count is bounded',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-docs-'));const store=new DocumentStore(join(dir,'docs.db'));
 try{
  const doc=store.upload('alice',{...input,text:synthetic+'\nDegree: master'});
  assert.equal(doc.consistency,'discrepancy_requires_review');assert.deepEqual(doc.pending,[]);
  assert.throws(()=>store.review('alice',doc.id,{}),e=>e.status===409);
  for(let i=0;i<9;i++)store.upload('alice',input);
  assert.throws(()=>store.upload('alice',input),e=>e.status===429);
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
test('document database refuses public directories and symlinks',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-docs-'));
 try{
  chmodSync(dir,0o755);assert.throws(()=>new DocumentStore(join(dir,'docs.db')));
  chmodSync(dir,0o700);symlinkSync(join(dir,'target'),join(dir,'docs.db'));
  assert.throws(()=>new DocumentStore(join(dir,'docs.db')));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('authenticated document API derives owner from verified identity and never calls model',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-docs-')),documents=new DocumentStore(join(dir,'docs.db'));
 let disabled=false,calls=0;
 const server=createInferenceServer({projectId:'demo-bursyar',origin:'http://localhost',documents,quota:{reserve(){throw Error('must not reserve inference');}},infer:async()=>{calls++;},verify:async token=>{if(disabled)throw Error();return {uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true};}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const request=(path,method='GET',body,token='alice',origin='http://localhost')=>fetch(base+path,{method,headers:{origin,...(token?{authorization:`Bearer ${token}`}:{}) ,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 try{
  assert.equal((await request('/api/documents','POST',input,null)).status,401);
  assert.equal((await request('/api/documents','POST',input,'alice','https://attacker.example')).status,403);
  const response=await request('/api/documents','POST',{...input,uid:'bob'});assert.equal(response.status,201);
  assert.equal(response.headers.get('cache-control'),'no-store');const doc=await response.json();
  assert.equal((await request('/api/documents/'+doc.id,'GET',null,'bob')).status,404);
  assert.equal((await request('/api/documents/'+doc.id,'GET')).status,200);
  assert.equal((await request('/api/documents/'+doc.id+'/review','POST',{decisions:Object.fromEntries(doc.pending.map(c=>[c.id,{action:'accept'}]))})).status,200);
  assert.equal((await (await request('/api/profile')).json()).degree.origin,'document_extracted');
  disabled=true;assert.equal((await request('/api/profile')).status,401);disabled=false;
  assert.equal((await request('/api/documents/'+doc.id,'DELETE')).status,200);
  assert.equal((await request('/api/documents/'+doc.id)).status,404);assert.equal(calls,0);
 }finally{await new Promise(resolve=>server.close(resolve));documents.close();rmSync(dir,{recursive:true,force:true});}
});
