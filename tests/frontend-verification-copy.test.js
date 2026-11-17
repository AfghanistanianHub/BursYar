import test from 'node:test';
import assert from 'node:assert/strict';
import {verificationCopy,verificationStatuses} from '../src/verifications.js';
import {dashboardCopy} from '../src/dashboard-copy.js';

const accessTypes=['institution_account','public_lookup','qr_app','issuer_contact','signed_document'];
const statuses=['NOT_REQUESTED','PENDING','VERIFIED_BY_ISSUER','REJECTED_BY_ISSUER','MANUAL_REVIEW_REQUIRED','UNAVAILABLE'];

test('verification UI copy is complete and honest in English, Persian and Pashto',()=>{
 assert.deepEqual(verificationStatuses,statuses);
 for(const language of ['en','fa','ps']){
  const t=verificationCopy[language];
  assert.ok(t,language);
  for(const key of ['title','intro','notice','requestTitle','documentLabel','providerLabel','referenceLabel','referenceHint','consent','submit','submitting','documentsEmpty','requestsTitle','refresh','empty','withdraw','withdrawn','verifiedLocked','requested','confirmedOn','autoNote','official','loading','error','signIn']){
   assert.ok(typeof t[key]==='string'&&t[key].trim(),`${language}.${key}`);
  }
  for(const status of statuses)assert.ok(typeof t.statuses[status]==='string'&&t.statuses[status].trim(),`${language}.${status}`);
  for(const access of accessTypes)assert.ok(typeof t.access[access]==='string'&&t.access[access].trim(),`${language}.${access}`);
  // The interface may never promise automatic issuer confirmation.
  assert.ok(!/verified automatically|تأیید خودکار|په اوتومات/i.test(t.intro));
 }
});

test('dashboard exposes verification and privacy routes in every language',()=>{
 for(const language of ['en','fa','ps']){
  const t=dashboardCopy[language];
  for(const key of ['verifications','mobileVerifications','mobileAccount','privacy','privacyNote','exportData','deleteData','deleteConfirm','deleted','exported','privacyBusy','privacyError','deleteLocalNote']){
   assert.ok(typeof t[key]==='string'&&t[key].trim(),`${language}.${key}`);
  }
 }
});
