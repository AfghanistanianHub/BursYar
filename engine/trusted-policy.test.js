import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrustedPolicyResolver} from './trusted-policy.js';
const provider={provider:'meta',enabled:true,model:'muse-spark-1.3',models:['muse-spark-1.3'],termsReviewed:true,termsValidUntil:4000,privacyReviewed:true,audience:'adult_only',regions:['CA'],consentVersion:1,maxReservationUnits:50000,dataClasses:['user_content']};
const record={uid:'one',subjectId:'one',provider:'meta',country:'CA',locationVerified:true,jurisdictionDecision:'allowed',ageVerified:true,subjectAgeVerified:true,userAgeBand:'adult_18_plus',subjectAgeBand:'adult_18_plus',verifiedAt:1000,expiresAt:3000,consent:{active:true,version:1,provider:'meta',subjectId:'one'}};
test('trusted resolver binds identity, expiry, region, contract, consent and exact configured model',async()=>{
 const resolve=(r=record,p=provider)=>createTrustedPolicyResolver({loadRecord:async()=>r,providers:{meta:p},now:()=>2000});
 assert.equal((await resolve()({uid:'one'})).model,'muse-spark-1.3');
 for(const change of [{uid:'two'},{subjectId:'child'},{country:'AF'},{country:'IR'},{country:'PK'},{country:null},{expiresAt:2000},{verifiedAt:3000},{revoked:true},{locationVerified:false},{ageVerified:false},{subjectAgeVerified:false},{consent:{...record.consent,active:false}},{consent:{...record.consent,version:0}}])await assert.rejects(resolve({...record,...change})({uid:'one'}));
 for(const change of [{enabled:false},{termsReviewed:false},{termsValidUntil:2000},{privacyReviewed:false},{model:'contributor'},{regions:[]},{dataClasses:[]},{maxReservationUnits:0}])await assert.rejects(resolve(record,{...provider,...change})({uid:'one'}));
});
test('resolver reloads evidence on every call and supplies no HTTP input to loader',async()=>{
 let r=record;let args;const resolve=createTrustedPolicyResolver({loadRecord:async(...a)=>{args=a;return r;},providers:{meta:provider},now:()=>2000});
 await resolve({uid:'one',country:'CA',headers:{country:'CA'}});assert.deepEqual(args,['one',null]);r={...record,revoked:true};await assert.rejects(resolve({uid:'one'}));
});

test('Meta country prohibitions cannot be overridden by a configured allowlist',async()=>{for(const country of ['AF','IR','PK','HK','RU']){const resolve=createTrustedPolicyResolver({loadRecord:async()=>({...record,country}),providers:{meta:{...provider,regions:[country]}},now:()=>2000});await assert.rejects(resolve({uid:'one'}));}});
