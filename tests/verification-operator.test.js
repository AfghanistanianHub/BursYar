import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {DocumentStore} from '../engine/documents.js';
import {VerificationStore,createVerificationService} from '../engine/verification.js';

const secret='s'.repeat(40);
function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'bursyar-operator-'));
 const documents=new DocumentStore(join(dir,'documents.db'));
 const store=new VerificationStore(join(dir,'verifications.db'));
 const service=createVerificationService({store,documents});
 const doc=documents.upload('alice',{text:'Degree: bachelor',mime:'text/plain',consent:true});
 const request=service.create('alice',{documentId:doc.id,providerId:'ielts',consent:true,reference:'TRF-0001'});
 service.close();documents.close();
 return {dir,request,database:join(dir,'verifications.db')};
}
function run(args,env={}){
 try{
  return {code:0,out:execFileSync(process.execPath,['scripts/verification-decision.mjs',...args],{
   encoding:'utf8',env:{...process.env,...env},stdio:['ignore','pipe','pipe']
  })};
 }catch(error){
  return {code:error.status,out:String(error.stdout??''),err:String(error.stderr??'')};
 }
}

test('the operator tool records an issuer decision and the student sees it',()=>{
 const {dir,request,database}=fixture();
 try{
  const result=run(['--uid','alice','--request',request.id,'--status','VERIFIED_BY_ISSUER','--kind','issuer_portal_confirmation',
   '--issuer','IELTS','--authenticated-at','2026-11-21T10:00:00Z','--statement','TRF check page confirms band 6.5.','--reference','TRF-0001','--confirm'],
   {BURSYAR_OPERATOR_SECRET:secret,BURSYAR_VERIFICATION_DB:database});
  assert.equal(result.code,0,result.err);
  const payload=JSON.parse(result.out);
  assert.equal(payload.event,'issuer_decision_recorded');
  assert.equal(payload.status,'VERIFIED_BY_ISSUER');

  const store=new VerificationStore(database);
  const service=createVerificationService({store});
  const listed=service.list('alice').requests.find(r=>r.id===request.id);
  assert.equal(listed.status,'VERIFIED_BY_ISSUER');
  assert.equal(listed.issuerEvidence.kind,'issuer_portal_confirmation');
  assert.equal(listed.issuerEvidence.decidedAt,'2026-11-21T10:00:00Z');
  assert.equal(service.get('alice',request.id).status,'VERIFIED_BY_ISSUER');
  // Another account still cannot read the record.
  assert.throws(()=>service.get('bob',request.id),error=>error.status===404);
  service.close();
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('the operator tool refuses absent authorisation, evidence and confirmation',()=>{
 const {dir,request,database}=fixture();
 try{
  const base=['--uid','alice','--request',request.id,'--status','VERIFIED_BY_ISSUER'];
  assert.notEqual(run(base,{BURSYAR_VERIFICATION_DB:database}).code,0,'missing secret must refuse');
  assert.notEqual(run(base,{BURSYAR_OPERATOR_SECRET:'short',BURSYAR_VERIFICATION_DB:database}).code,0,'short secret must refuse');
  const withSecret={BURSYAR_OPERATOR_SECRET:secret,BURSYAR_VERIFICATION_DB:database};
  assert.notEqual(run(base,withSecret).code,0,'a verified decision without evidence must refuse');
  assert.notEqual(run(['--uid','alice','--request',request.id,'--status','VERIFIED_BY_ISSUER','--kind','issuer_portal_confirmation',
   '--issuer','IELTS','--authenticated-at','2026-11-21T10:00:00Z','--statement','ok'],withSecret).code,0,'missing --confirm must refuse');

  // Ownership is still enforced: a different uid cannot decide this request.
  const other=run(['--uid','bob','--request',request.id,'--status','MANUAL_REVIEW_REQUIRED','--confirm'],withSecret);
  assert.notEqual(other.code,0,'another account cannot decide the request');

  const store=new VerificationStore(database);
  const service=createVerificationService({store});
  assert.equal(service.list('alice').requests[0].status,'PENDING','no refused call may change the status');
  service.close();
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('a service without document storage cannot create a request',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-operator-nodocs-'));
 try{
  const store=new VerificationStore(join(dir,'verifications.db'));
  const service=createVerificationService({store});
  assert.throws(()=>service.create('alice',{documentId:'00000000-0000-0000-0000-000000000000',providerId:'ielts',consent:true}),error=>error.status===503);
  service.close();
 }finally{rmSync(dir,{recursive:true,force:true});}
});
