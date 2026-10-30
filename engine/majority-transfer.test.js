import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from './documents.js';
import {createMajorityTransferService} from './majority-transfer.js';
const sourceScope='family:synthetic-guardian-and-subject',targetUid='verified-adult-synthetic-user';
const verified={approved:true,sourceScope,targetUid,recipientAdultVerified:true,recipientIdentityVerified:true,recipientConsentVerified:true,guardianAuthorityVerified:true,guardianRevocationAuthorized:true};
function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'bursyar-majority-')),documents=new DocumentStore(join(dir,'documents.sqlite'));
 documents.updateProfile(sourceScope,{consent:true,values:{degree:'bachelor'}});
 const doc=documents.upload(sourceScope,{consent:true,mime:'text/plain',text:'Degree: bachelor'});
 return {documents,doc,close:()=>{documents.close();rmSync(dir,{recursive:true,force:true});}};
}
test('revoked, unverified or wrong recipient cannot move any profile or document',async()=>{
 const f=fixture();try{
  for(const change of [{recipientAdultVerified:false},{recipientConsentVerified:false},{guardianAuthorityVerified:false},{guardianRevocationAuthorized:false},{targetUid:'other'},{approved:false}]){
   const service=createMajorityTransferService({documents:f.documents,verifyAuthority:async()=>({...verified,...change})});
   await assert.rejects(service.transfer({sourceScope,targetUid}),{status:403});
   assert.equal(f.documents.profile(sourceScope).degree.value,'bachelor');
   assert.equal(f.documents.list(sourceScope).length,1);
   assert.equal(f.documents.list(targetUid).length,0);
  }
 }finally{f.close();}
});
test('atomic handoff moves profile and all documents, revokes guardian scope, and is idempotent',async()=>{
 const f=fixture();try{
  const service=createMajorityTransferService({documents:f.documents,verifyAuthority:async()=>verified});
  assert.deepEqual(await service.transfer({sourceScope,targetUid}),{transferred:true,alreadyTransferred:false});
  assert.equal(f.documents.isTransferred(sourceScope),true);
  assert.deepEqual(f.documents.profile(sourceScope),{});
  assert.equal(f.documents.list(sourceScope).length,0);
  assert.equal(f.documents.profile(targetUid).degree.value,'bachelor');
  assert.equal(f.documents.get(targetUid,f.doc.id).text,'Degree: bachelor');
  assert.deepEqual(await service.transfer({sourceScope,targetUid}),{transferred:true,alreadyTransferred:true});
  assert.equal(f.documents.list(targetUid).length,1);
  await assert.rejects(service.transfer({sourceScope,targetUid:'other'}),{status:403});
 }finally{f.close();}
});
test('existing destination conflicts roll back without source loss',async()=>{
 const f=fixture();try{
  f.documents.updateProfile(targetUid,{consent:true,values:{degree:'master'}});
  const service=createMajorityTransferService({documents:f.documents,verifyAuthority:async()=>verified});
  await assert.rejects(service.transfer({sourceScope,targetUid}),{status:409});
  assert.equal(f.documents.profile(sourceScope).degree.value,'bachelor');
  assert.equal(f.documents.list(sourceScope).length,1);
  assert.equal(f.documents.profile(targetUid).degree.value,'master');
  assert.equal(f.documents.isTransferred(sourceScope),false);
 }finally{f.close();}
});
test('empty guardian scope never reports a transfer success',async()=>{
 const f=fixture();try{
  const service=createMajorityTransferService({documents:f.documents,verifyAuthority:async()=>({...verified,sourceScope:'family:empty'})});
  await assert.rejects(service.transfer({sourceScope:'family:empty',targetUid}),{status:404});
  assert.equal(f.documents.profile(sourceScope).degree.value,'bachelor');
 }finally{f.close();}
});
