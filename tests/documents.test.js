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

test('private profile edits require consent, preserve quotas, reject promotion and isolate users',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-profile-')),documents=new DocumentStore(join(dir,'docs.db'));let reservations=0,calls=0;
 const server=createInferenceServer({projectId:'demo-bursyar',origin:'http://localhost',documents,quota:{reserve(){reservations++;}},infer:async()=>{calls++;},verify:async token=>({uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const request=(path,method='GET',body,uid='alice')=>fetch(base+path,{method,headers:{origin:'http://localhost',...(uid?{authorization:`Bearer ${uid}`}:{}) ,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 try{
  const edits={consent:true,values:{degree:'master',deferredOffer:false,academicHistory:'SYNTHETIC TEST ONLY',languages:'English (declared)'}};
  assert.equal((await request('/api/profile','PUT',edits,null)).status,401);
  assert.equal((await request('/api/profile','PUT',{...edits,consent:false})).status,400);
  for(const values of [{origin:'issuer_verified'},{degree:{value:'doctorate',origin:'issuer_verified'}},{courseStart:'2026-02-30'}])assert.equal((await request('/api/profile','PUT',{consent:true,values})).status,400);
  const response=await request('/api/profile','PUT',edits);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  const saved=await response.json();assert.equal(saved.degree.origin,'user_declared');assert.equal(saved.deferredOffer.value,false);
  assert.deepEqual(await (await request('/api/profile','GET',null,'bob')).json(),{});
  const doc=await (await request('/api/documents','POST',input)).json();
  assert.equal((await (await request('/api/documents')).json()).length,1);assert.deepEqual(await (await request('/api/documents','GET',null,'bob')).json(),[]);
  await request('/api/profile','DELETE',null,'bob');assert.equal(documents.profile('alice').degree.value,'master');
  await request('/api/profile','DELETE');assert.deepEqual(documents.profile('alice'),{});assert.equal(documents.get('alice',doc.id).id,doc.id);
  assert.equal(reservations,0);assert.equal(calls,0);
 }finally{await new Promise(resolve=>server.close(resolve));documents.close();rmSync(dir,{recursive:true,force:true});}
});
test('profile and document deletion remove prior-fact history without restoring stale claims',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-profile-history-')),store=new DocumentStore(join(dir,'docs.db'));
 const accept=doc=>store.review('alice',doc.id,Object.fromEntries(doc.pending.map(c=>[c.id,{action:'accept'}])));
 try{
  const a=store.upload('alice',input);accept(a);const b=store.upload('alice',input);accept(b);
  assert.equal(store.get('alice',b.id).reviewHistory[0].previousFact.sourceDocumentId,a.id);
  store.updateProfile('alice',{consent:true,values:{languages:'English (synthetic)'}});
  store.delete('alice',a.id);assert.ok(store.get('alice',b.id).reviewHistory.every(h=>h.previousFact===null));
  assert.equal(store.db.prepare('SELECT count(*) AS n FROM profile_history WHERE owner=?').get(store.owner('alice')).n,0);
  store.updateProfile('alice',{consent:true,values:{degree:'doctorate'}});store.deleteProfile('alice');
  assert.deepEqual(store.profile('alice'),{});assert.ok(store.get('alice',b.id).reviewHistory.every(h=>h.previousFact===null));
  assert.throws(()=>store.review('alice',b.id,{}),e=>e.status===409);
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
test('profile history is bounded and issuer-verified facts cannot be overwritten or removed by edits',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-profile-bound-')),store=new DocumentStore(join(dir,'docs.db'));
 try{
  for(let i=0;i<25;i++)store.updateProfile('alice',{consent:true,values:{languages:'SYNTHETIC '+i}});
  assert.equal(store.db.prepare('SELECT count(*) AS n FROM profile_history').get().n,20);
  store.db.prepare('UPDATE profiles SET data=? WHERE owner=?').run(JSON.stringify({degree:{value:'master',origin:'issuer_verified'}}),store.owner('alice'));
  for(const value of ['bachelor',null])assert.throws(()=>store.updateProfile('alice',{consent:true,values:{degree:value}}),e=>e.status===409);
  assert.equal(store.profile('alice').degree.origin,'issuer_verified');
  const doc=store.upload('alice',input);const bad=Object.fromEntries(doc.pending.map(c=>[c.id,{action:'correct',value:'UNSUPPORTED VALUE'}]));
  assert.throws(()=>store.review('alice',doc.id,bad),e=>e.status===400);assert.equal(store.get('alice',doc.id).reviewedAt,undefined);
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
