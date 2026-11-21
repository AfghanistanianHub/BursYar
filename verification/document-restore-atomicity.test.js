import test from 'node:test';
import assert from 'node:assert/strict';
import {DocumentStore,DocumentError} from '../engine/documents.js';
const upload=(store,uid,text)=>store.upload(uid,{consent:true,mime:'text/plain',text});
const unavailable=fn=>assert.throws(fn,error=>error instanceof DocumentError&&error.status===503);

test('invalid snapshot JSON never partially restores a valid first document',()=>{
 const source=DocumentStore.memory(),target=DocumentStore.memory();
 try{
  upload(source,'alice','Degree: bachelor');
  const state=source.snapshot('alice');
  state.documents.push({id:'123e4567-e89b-42d3-a456-426614174000',data:'not json'});
  unavailable(()=>target.restore('alice',state));
  assert.deepEqual(target.list('alice'),[]);
  assert.deepEqual(target.profile('alice'),{});
 }finally{source.close();target.close();}
});
test('duplicate snapshot document IDs are rejected without mutation',()=>{
 const source=DocumentStore.memory(),target=DocumentStore.memory();
 try{
  upload(source,'alice','Degree: bachelor');
  const state=source.snapshot('alice');state.documents.push({...state.documents[0]});
  unavailable(()=>target.restore('alice',state));
  assert.deepEqual(target.list('alice'),[]);
 }finally{source.close();target.close();}
});
test('snapshot restore rolls back on database conflict',()=>{
 const source=DocumentStore.memory(),target=DocumentStore.memory();
 try{
  upload(source,'alice','Degree: bachelor');
  const state=source.snapshot('alice');
  target.restore('alice',state);
  unavailable(()=>target.restore('alice',state));
  assert.equal(target.list('alice').length,1);
 }finally{source.close();target.close();}
});
test('valid snapshot round-trip preserves documents and profile',()=>{
 const source=DocumentStore.memory(),target=DocumentStore.memory();
 try{
  upload(source,'alice','Degree: bachelor');
  source.updateProfile('alice',{consent:true,values:{degree:'bachelor'}});
  const state=source.snapshot('alice');
  target.restore('alice',state);
  assert.deepEqual(target.snapshot('alice'),state);
  assert.deepEqual(target.list('bob'),[]);
 }finally{source.close();target.close();}
});
