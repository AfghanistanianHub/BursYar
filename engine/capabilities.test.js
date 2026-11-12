import test from 'node:test';
import assert from 'node:assert/strict';
import {describeBuild,describeCapabilities,describeMeta,formatCapabilities,resolveBuildCommit} from './capabilities.js';
const configured={providerConfigPresent:true,providerEnabled:true,familyGrantsPresent:false,metaAvailable:true,spendingConfirmed:true,spendingApproved:true,policyRecordsConfigured:true,documentsAvailable:true,catalogAvailable:true};
test('missing provider config disables Meta with an actionable deterministic reason',()=>{
 for(const input of [{}, {providerConfigPresent:false,providerEnabled:true}]){
  const meta=describeMeta(input);
  assert.equal(meta.state,'disabled');assert.equal(meta.reason,'provider_config_missing');
  assert.match(meta.actionable,/BURSYAR_PROVIDER_CONFIG/);assert.equal(meta.inferenceVerified,false);
 }
 const caps=describeCapabilities({});
 assert.equal(caps.meta.state,'disabled');assert.equal(caps.deterministicOnly,true);
 assert.equal(caps.inferenceVerified,false);assert.equal(caps.localAssessment.available,true);
});
test('disabled provider, missing credentials, spending gates and policy records each report distinctly',()=>{
 const cases=[
  [{...configured,providerEnabled:false},'disabled','provider_disabled'],
  [{...configured,metaAvailable:false},'disabled','meta_credentials_missing'],
  [{...configured,spendingConfirmed:false},'disabled','spending_not_confirmed'],
  [{...configured,spendingApproved:false},'disabled','spending_not_approved'],
  [{...configured,policyRecordsConfigured:false},'blocked','policy_records_unavailable'],
  [{...configured,familyGrantsPresent:true},'blocked','family_deployment_disables_meta']
 ];
 for(const [input,state,reason] of cases){
  const meta=describeMeta(input);
  assert.equal(meta.state,state);assert.equal(meta.reason,reason);
  assert.ok(meta.actionable.length>10);assert.equal(meta.inferenceVerified,false);
 }
});
test('configured Meta still requires per-request policy and never claims verified inference',()=>{
 const meta=describeMeta(configured);
 assert.equal(meta.state,'configured');assert.equal(meta.reason,'policy_authorization_required_per_request');
 assert.match(meta.actionable,/valid trusted policy record/);assert.equal(meta.inferenceVerified,false);
 const caps=describeCapabilities(configured);
 assert.equal(caps.deterministicOnly,false);assert.equal(caps.inferenceVerified,false);
 assert.equal(caps.documentStorage.available,true);assert.equal(caps.localAssessment.available,true);
 assert.equal(caps.sourceRetrieval.available,true);
 assert.ok(!JSON.stringify(caps).match(/sk-|Bearer|key|token/i) || JSON.stringify(caps).includes('meta_credentials_missing'));
});
test('document storage and catalog availability are reported separately from Meta',()=>{
 const noDocs=describeCapabilities({...configured,documentsAvailable:false});
 assert.equal(noDocs.documentStorage.available,false);assert.equal(noDocs.documentStorage.reason,'document_database_not_configured');
 assert.equal(noDocs.meta.state,'configured');
 const noCatalog=describeCapabilities({...configured,catalogAvailable:false});
 assert.equal(noCatalog.localAssessment.available,false);assert.equal(noCatalog.localAssessment.reason,'catalog_unavailable');
});
test('build commit reports the deployed SHA and never guesses',()=>{
 assert.equal(describeCapabilities({}).build.commit,'unknown');
 assert.equal(describeCapabilities({build:{commit:'a'.repeat(40)}}).build.commit,'a'.repeat(40));
 assert.equal(describeCapabilities({build:{commit:'ABCDEF1234567890abcdef1234567890ABCDEF12'}}).build.commit,'abcdef1234567890abcdef1234567890abcdef12');
 for(const bad of ['deadbeef','',null,undefined,42,'zz'.repeat(20)]){
  assert.equal(describeCapabilities({build:{commit:bad}}).build.commit,'unknown');
 }
 assert.equal(describeBuild('b'.repeat(40)).commit,'b'.repeat(40));
 assert.equal(resolveBuildCommit({}),undefined);
 assert.equal(resolveBuildCommit({RENDER_GIT_COMMIT:'c'.repeat(40)}),'c'.repeat(40));
 assert.equal(
  resolveBuildCommit({BURSYAR_BUILD_SHA:'d'.repeat(40),RENDER_GIT_COMMIT:'c'.repeat(40)}),
  'd'.repeat(40));
 assert.equal(resolveBuildCommit({RENDER_GIT_COMMIT:'short'}),undefined);
});
test('formatted capabilities never describe health or catalog as successful inference',()=>{
 const text=formatCapabilities(describeCapabilities(configured));
 assert.match(text,/Local assessment available/);assert.match(text,/document storage available/);
 assert.match(text,/Meta configured/);assert.match(text,/Inference verified: false/);
 assert.ok(!/success|verified: true/i.test(text));
 const unknown=formatCapabilities(null);
 assert.match(unknown,/unknown/i);assert.match(unknown,/not verified/i);
});
