import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,chmodSync,symlinkSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from '../engine/documents.js';
import {VerificationStore,createVerificationService,VerificationError} from '../engine/verification.js';
import {VERIFICATION_STATUSES,getVerificationProvider,isIssuerEvidenceAllowed,listVerificationProviders} from '../engine/verification-providers.js';
const evidence={kind:'issuer_portal_confirmation',issuer:'IELTS',authenticatedAt:'2026-11-17T00:00:00.000Z',issuerStatement:'TRF number confirmed by the issuer portal'};
const workspace=()=>{const dir=mkdtempSync(join(tmpdir(),'bursyar-verify-'));return {dir,docs:new DocumentStore(join(dir,'documents.db')),store:new VerificationStore(join(dir,'verifications.db'))};};

test('verification registry covers every required issuer with official sources and no false automation',()=>{
 const providers=listVerificationProviders(),ids=providers.map(p=>p.id);
 for(const id of ['ielts','toefl','duolingo_english_test','cambridge_english','pte_academic','goethe','testdaf','telc','osd','delf','dalf','tcf','tef','mycreds'])assert.ok(ids.includes(id),id);
 assert.equal(new Set(ids).size,providers.length);
 for(const p of providers){
  assert.equal(p.autoVerificationAvailable,false,'no provider may claim automatic verification');
  assert.equal(new URL(p.officialUrl).protocol,'https:');
  assert.ok(['english','german','french','academic'].includes(p.category));
  assert.ok(['institution_account','public_lookup','qr_app','issuer_contact','signed_document'].includes(p.access));
  assert.ok(p.mechanism.length>10&&p.note.length>20);
  assert.equal(typeof p.requiresIssuerAuthorization,'boolean');
 }
 assert.deepEqual([...VERIFICATION_STATUSES],['NOT_REQUESTED','PENDING','VERIFIED_BY_ISSUER','REJECTED_BY_ISSUER','MANUAL_REVIEW_REQUIRED','UNAVAILABLE']);
 assert.equal(getVerificationProvider('unknown'),null);
 assert.equal(getVerificationProvider('ielts').canAutoVerify,false);
});

test('text extraction, OCR and public mentions are never issuer evidence',()=>{
 for(const kind of ['ocr','text_extraction','user_declaration','public_web_mention','screenshot','model_interpretation']){
  assert.equal(isIssuerEvidenceAllowed('ielts',{...evidence,kind}),false,kind);
 }
 assert.equal(isIssuerEvidenceAllowed('ielts',evidence),true);
 assert.equal(isIssuerEvidenceAllowed('ielts',{...evidence,authenticatedAt:'not-a-date'}),false);
 assert.equal(isIssuerEvidenceAllowed('ielts',{...evidence,issuerStatement:' '}),false);
 assert.equal(isIssuerEvidenceAllowed('ielts',{...evidence,issuer:''}),false);
 assert.equal(isIssuerEvidenceAllowed('not_a_provider',evidence),false);
 assert.equal(isIssuerEvidenceAllowed('ielts',null),false);
});

test('verification requests are consent-gated, owner-scoped, idempotent and persist',()=>{
 const {dir,docs,store}=workspace();
 let reopened=null;
 try{
  const service=createVerificationService({store,documents:docs});
  const doc=docs.upload('alice',{text:'Degree: bachelor',mime:'text/plain',consent:true});
  assert.throws(()=>service.create('alice',{documentId:doc.id,providerId:'ielts'}),e=>e instanceof VerificationError&&e.status===400);
  assert.throws(()=>service.create('alice',{documentId:doc.id,providerId:'ielts',consent:false}),e=>e.status===400);
  assert.throws(()=>service.create('alice',{documentId:doc.id,providerId:'unknown_issuer',consent:true}),e=>e.status===422);
  assert.throws(()=>service.create('alice',{documentId:'not-a-document',providerId:'ielts',consent:true}),e=>e.status===400);
  // Another account cannot request verification for a document it does not own.
  assert.throws(()=>service.create('bob',{documentId:doc.id,providerId:'ielts',consent:true}),e=>e.status===404);
  assert.throws(()=>service.create('alice',{documentId:doc.id,providerId:'ielts',consent:true,reference:'bad\u0000reference'}),e=>e.status===400);

  const request=service.create('alice',{documentId:doc.id,providerId:'ielts',consent:true,reference:' 123456789012345678 '});
  assert.equal(request.status,'PENDING');
  assert.equal(request.reference,'123456789012345678');
  assert.equal(request.issuerEvidence,null);
  assert.equal(request.provider.autoVerificationAvailable,false);
  assert.equal(request.provider.access,'institution_account');
  assert.equal(request.consentVersion,1);
  // A repeated submission is the same request, never a duplicate.
  assert.equal(service.create('alice',{documentId:doc.id,providerId:'ielts',consent:true}).id,request.id);
  assert.equal(service.list('alice').requests.length,1);
  assert.equal(service.list('bob').requests.length,0);
  assert.throws(()=>service.withdraw('bob',request.id),e=>e.status===404);
  assert.throws(()=>service.withdraw('alice','not-a-uuid'),e=>e.status===404);

  // A second connection to the same private database proves durable state.
  reopened=createVerificationService({store:new VerificationStore(join(dir,'verifications.db')),documents:docs});
  const restored=reopened.list('alice').requests;
  assert.equal(restored.length,1);
  assert.equal(restored[0].id,request.id);
  assert.equal(restored[0].status,'PENDING');

  // No HTTP or service caller may mark a credential verified without the issuer.
  assert.throws(()=>reopened.recordIssuerOutcome('alice',request.id,{status:'VERIFIED_BY_ISSUER',evidence}),e=>e.status===403);
  assert.throws(()=>reopened.recordIssuerOutcome('alice',request.id,{authorized:true,status:'VERIFIED_BY_ISSUER',evidence:{...evidence,kind:'ocr'}}),e=>e.status===400);
  assert.throws(()=>reopened.recordIssuerOutcome('alice',request.id,{authorized:true,status:'VERIFIED_BY_ISSUER',evidence:{...evidence,reference:'different-reference'}}),e=>e.status===400);
  assert.throws(()=>reopened.recordIssuerOutcome('alice',request.id,{authorized:true,status:'PENDING',evidence}),e=>e.status===400);
  assert.throws(()=>reopened.recordIssuerOutcome('bob',request.id,{authorized:true,status:'VERIFIED_BY_ISSUER',evidence:{...evidence,reference:request.reference}}),e=>e.status===404);

  const verified=reopened.recordIssuerOutcome('alice',request.id,{authorized:true,status:'VERIFIED_BY_ISSUER',evidence:{...evidence,reference:request.reference}});
  assert.equal(verified.status,'VERIFIED_BY_ISSUER');
  assert.equal(verified.issuerEvidence.kind,'issuer_portal_confirmation');
  assert.equal(verified.issuerEvidence.issuer,'IELTS');
  // A verified status is issuer-owned and cannot be withdrawn by the student.
  assert.throws(()=>reopened.withdraw('alice',request.id),e=>e.status===409);

  reopened.eraseOwner('alice');
  assert.equal(reopened.list('alice').requests.length,0);
 }finally{reopened?.close();try{store.close();}catch{/* already closed */}rmSync(dir,{recursive:true,force:true});}
});

test('issuer decision is atomic with audit and verified state is terminal',()=>{
 const {dir,docs,store}=workspace();
 try{
  const service=createVerificationService({store,documents:docs});
  const doc=docs.upload('alice',{text:'Transcript',mime:'text/plain',consent:true});
  const request=service.create('alice',{documentId:doc.id,providerId:'ielts',consent:true});
  const originalEvent=store.event.bind(store);
  store.event=()=>{throw Error('audit unavailable');};
  assert.throws(()=>service.recordIssuerOutcome('alice',request.id,{authorized:true,status:'VERIFIED_BY_ISSUER',evidence}),/audit unavailable/);
  assert.equal(service.list('alice').requests[0].status,'PENDING');
  assert.equal(service.list('alice').requests[0].issuerEvidence,null);
  store.event=originalEvent;
  const verified=service.recordIssuerOutcome('alice',request.id,{authorized:true,status:'VERIFIED_BY_ISSUER',evidence});
  assert.equal(verified.status,'VERIFIED_BY_ISSUER');
  assert.throws(()=>service.recordIssuerOutcome('alice',request.id,{authorized:true,status:'REJECTED_BY_ISSUER',evidence}),error=>error.status===409);
  assert.equal(service.list('alice').requests[0].status,'VERIFIED_BY_ISSUER');
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});

test('issuer outcome cannot be recorded after withdrawal and account erasure clears audit',()=>{
 const {dir,docs,store}=workspace();
 try{
  const service=createVerificationService({store,documents:docs});
  const doc=docs.upload('alice',{text:'Diploma',mime:'text/plain',consent:true});
  const request=service.create('alice',{documentId:doc.id,providerId:'ielts',consent:true});
  assert.equal(service.withdraw('alice',request.id).withdrawn,true);
  assert.throws(()=>service.recordIssuerOutcome('alice',request.id,{authorized:true,status:'VERIFIED_BY_ISSUER',evidence}),error=>error.status===404);
  assert.equal(service.list('alice').requests.length,0);
  const next=service.create('alice',{documentId:doc.id,providerId:'ielts',consent:true});
  assert.notEqual(next.id,request.id);
  service.eraseOwner('alice');
  assert.equal(service.list('alice').requests.length,0);
  assert.equal(store.db.prepare('SELECT COUNT(*) AS count FROM verification_events WHERE owner=?').get(store.owner('alice')).count,0);
  assert.equal(store.db.prepare('SELECT COUNT(*) AS count FROM verification_requests WHERE owner=?').get(store.owner('alice')).count,0);
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});

test('request count is bounded and private database refusals stay enforced',()=>{
 const {dir,docs,store}=workspace();
 try{
  const service=createVerificationService({store,documents:docs});
  const ids=[];
  for(let i=0;i<10;i++)ids.push(docs.upload('alice',{text:`Degree: bachelor\nGPA: 3.${i}/4`,mime:'text/plain',consent:true}).id);
  let created=0,capped=false;
  outer:for(const id of ids)for(const providerId of ['ielts','toefl','goethe']){
   try{service.create('alice',{documentId:id,providerId,consent:true});created++;}
   catch(error){assert.equal(error.status,429);capped=true;break outer;}
  }
  // 25 is the documented cap; the 26th distinct request is refused.
  assert.equal(created,25);assert.equal(capped,true);
  assert.throws(()=>service.create('alice',{documentId:ids[9],providerId:'telc',consent:true}),e=>e.status===429);
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
 const publicDir=mkdtempSync(join(tmpdir(),'bursyar-verify-public-'));
 try{
  chmodSync(publicDir,0o755);
  assert.throws(()=>new VerificationStore(join(publicDir,'verifications.db')));
  chmodSync(publicDir,0o700);
  symlinkSync(join(publicDir,'target'),join(publicDir,'verifications.db'));
  assert.throws(()=>new VerificationStore(join(publicDir,'verifications.db')));
 }finally{rmSync(publicDir,{recursive:true,force:true});}
});
