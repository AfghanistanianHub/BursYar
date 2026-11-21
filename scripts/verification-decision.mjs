#!/usr/bin/env node
// Operator tool: record an issuer's decision on a credential-verification
// request. This is the only path that can set a verified status, and it is a
// deliberate, audited command run by the operator on the host that holds the
// private verification database — never an HTTP route and never a client field.
//
// It cannot read documents: the service is constructed without document storage.
// The operator secret below is a guard against accidental invocation, not an
// authentication boundary; the real boundary is access to the private database.
//
// Usage:
//   BURSYAR_OPERATOR_SECRET=<32+ chars> \
//   BURSYAR_VERIFICATION_DB=/var/lib/bursyar/verifications.db \
//   node scripts/verification-decision.mjs \
//     --uid <firebase-uid> --request <uuid> \
//     --status VERIFIED_BY_ISSUER \
//     --kind issuer_portal_confirmation \
//     --issuer "IELTS (British Council)" \
//     --authenticated-at 2026-11-21T10:00:00Z \
//     --statement "TRF verification page confirms overall band 6.5 for this candidate." \
//     [--reference TRF-0001] [--confirm]
import {VerificationStore,createVerificationService,VerificationError} from '../engine/verification.js';
import {ISSUER_EVIDENCE_KINDS} from '../engine/verification-providers.js';

const args=process.argv.slice(2);
const flag=name=>{const i=args.indexOf(`--${name}`);return i>=0?args[i+1]:undefined;};
const has=name=>args.includes(`--${name}`);
const fail=(message,code=2)=>{console.error(JSON.stringify({event:'verification_decision_rejected',reason:message},null,2));process.exit(code);};

const secret=process.env.BURSYAR_OPERATOR_SECRET;
if(!secret||secret.length<32)fail('BURSYAR_OPERATOR_SECRET must be set to at least 32 characters');
const database=process.env.BURSYAR_VERIFICATION_DB;
if(!database)fail('BURSYAR_VERIFICATION_DB must point at the private verification database');

const uid=flag('uid'),request=flag('request'),status=flag('status'),kind=flag('kind'),issuer=flag('issuer');
const authenticatedAt=flag('authenticated-at'),statement=flag('statement'),reference=flag('reference');
if(!uid||!request)fail('--uid and --request are required');
if(!status)fail('--status is required (VERIFIED_BY_ISSUER, REJECTED_BY_ISSUER, MANUAL_REVIEW_REQUIRED, UNAVAILABLE)');
const needsEvidence=status==='VERIFIED_BY_ISSUER'||status==='REJECTED_BY_ISSUER';
if(needsEvidence){
 if(!kind||!ISSUER_EVIDENCE_KINDS.includes(kind))fail(`--kind must be one of ${ISSUER_EVIDENCE_KINDS.join(', ')}`);
 if(!issuer||!authenticatedAt||!statement)fail('--issuer, --authenticated-at and --statement are required with issuer evidence');
}
if(!has('confirm'))fail('Refusing to write without --confirm (this is an append-only decision)');

let store;
try{store=new VerificationStore(database);}
catch(error){fail(`Verification database unavailable: ${error.message}`,3);}

const service=createVerificationService({store});
try{
 const record=service.recordIssuerOutcome(uid,request,{
  authorized:true,
  status,
  ...(needsEvidence?{evidence:{kind,issuer,authenticatedAt,issuerStatement:statement,...(reference?{reference}:{})}}:{})
 });
 console.log(JSON.stringify({
  event:'issuer_decision_recorded',
  request:record.id,
  status:record.status,
  reference:record.reference,
  decidedAt:record.issuerEvidence?.decidedAt??null,
  // The student sees this on the next list load; nothing is pushed to them.
  next:'The request status is now visible in the student’s verification centre.'
 },null,2));
}catch(error){
 const status=error instanceof VerificationError?error.status:500;
 fail(`Decision not recorded (${status}): ${error.message}`,1);
}finally{
 try{service.close();}catch{/* already closed */}
}
