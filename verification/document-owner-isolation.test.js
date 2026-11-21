import test from 'node:test';
import assert from 'node:assert/strict';
import {DocumentStore,DocumentError} from '../engine/documents.js';

const upload=(store,uid,text='Degree: bachelor',requestId)=>store.upload(uid,{consent:true,mime:'text/plain',text,...(requestId?{requestId}:{})});
const denied=(fn,status=404)=>assert.throws(fn,error=>error instanceof DocumentError&&error.status===status);

test('documents and profiles cannot be read, modified or erased by another user',()=>{
 const store=DocumentStore.memory();
 try{
  const a=upload(store,'student-a');const b=upload(store,'student-b','Degree: master');
  assert.deepEqual(store.list('student-a').map(x=>x.id),[a.id]);
  assert.deepEqual(store.list('student-b').map(x=>x.id),[b.id]);
  denied(()=>store.get('student-b',a.id));
  denied(()=>store.delete('student-b',a.id));
  denied(()=>store.review('student-b',a.id,{}));
  assert.equal(store.get('student-a',a.id).text,'Degree: bachelor');
  assert.equal(store.get('student-b',b.id).text,'Degree: master');
  store.eraseOwner('student-a');
  assert.deepEqual(store.list('student-a'),[]);
  assert.equal(store.get('student-b',b.id).id,b.id);
 }finally{store.close();}
});

test('idempotent document retries remain owner-scoped and reject changed contents',()=>{
 const store=DocumentStore.memory();
 try{
  const requestId='123e4567-e89b-42d3-a456-426614174000';
  const first=upload(store,'student-a','Degree: bachelor',requestId);
  assert.equal(upload(store,'student-a','Degree: bachelor',requestId).id,first.id);
  denied(()=>upload(store,'student-a','Degree: master',requestId),409);
  const second=upload(store,'student-b','Degree: master',requestId);
  assert.notEqual(first.id,second.id);
  assert.equal(store.list('student-a').length,1);
  assert.equal(store.list('student-b').length,1);
 }finally{store.close();}
});

test('profile updates and account erasure are scoped to the authenticated owner',()=>{
 const store=DocumentStore.memory();
 try{
  store.updateProfile('student-a',{consent:true,values:{degree:'bachelor'}});
  store.updateProfile('student-b',{consent:true,values:{degree:'master'}});
  assert.notDeepEqual(store.profile('student-a'),store.profile('student-b'));
  store.eraseOwner('student-a');
  assert.deepEqual(store.profile('student-a'),{});
  assert.notDeepEqual(store.profile('student-b'),{});
 }finally{store.close();}
});

test('document uploads require consent and cannot forge authenticity metadata',()=>{
 const store=DocumentStore.memory();
 try{
  denied(()=>store.upload('student-a',{mime:'text/plain',text:'Degree: bachelor'}),400);
  denied(()=>store.upload('student-a',{consent:true,mime:'application/pdf',text:'Degree: bachelor'}),400);
  denied(()=>store.upload('student-a',{consent:true,mime:'text/plain',text:'Degree: bachelor',extractionMethod:'issuer_verified'}),400);
  const document=store.upload('student-a',{consent:true,mime:'text/plain',text:'Degree: bachelor',authenticity:'verified'});
  assert.equal(document.authenticity,'not_verified');
  assert.equal(document.translationStatus,'not_assessed');
 }finally{store.close();}
});
