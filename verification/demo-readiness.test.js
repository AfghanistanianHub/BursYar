import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyCatalogAttempt,catalogUnavailableEvent,catalogVerifiedEvent,buildReadinessLines,readyLine} from './demo-readiness.mjs';
import {describeCapabilities} from '../engine/capabilities.js';
test('deterministic startup skips catalog without a key or model',()=>{
 for(const input of [{}, {hasKey:false,hasModel:true}, {hasKey:true,hasModel:false}])
  assert.deepEqual(classifyCatalogAttempt(input),{event:'meta_model_access_skipped',reason:'meta_key_or_model_not_configured',inferenceVerified:false,deterministicOnly:true});
 assert.equal(classifyCatalogAttempt({hasKey:true,hasModel:true}),null);
 assert.deepEqual(catalogVerifiedEvent(),{event:'meta_model_access_verified',inferenceVerified:false});
 const unavailable=catalogUnavailableEvent('model_catalog_unreachable');
 assert.equal(unavailable.event,'meta_model_access_unavailable');assert.equal(unavailable.inferenceVerified,false);assert.equal(unavailable.deterministicOnly,true);
});
test('readiness messaging distinguishes deterministic-only from configured Meta',()=>{
 const deterministic=buildReadinessLines({spendingConfirmed:false,spendLimitUSD:0,capabilities:describeCapabilities({})});
 assert.equal(deterministic.deterministicOnly,true);
 assert.match(deterministic.lines.join('\n'),/Live inference DISABLED/);
 assert.match(deterministic.lines.join('\n'),/Meta disabled \(provider_config_missing\)/);
 assert.match(deterministic.lines.join('\n'),/Inference verified: false/);
 const configured=buildReadinessLines({spendingConfirmed:true,spendLimitUSD:5,capabilities:describeCapabilities({providerConfigPresent:true,providerEnabled:true,metaAvailable:true,spendingConfirmed:true,spendingApproved:true,policyRecordsConfigured:true,documentsAvailable:true})});
 assert.equal(configured.deterministicOnly,false);
 assert.match(configured.lines.join('\n'),/Spending confirmation loaded: USD 5/);
 assert.match(configured.lines.join('\n'),/Meta configured/);
 assert.match(configured.lines.join('\n'),/Inference verified: false/);
 for(const {lines} of [deterministic,configured]){
  const text=lines.join('\n');
  assert.ok(!/verified: true|succeeded|successfully inferred/i.test(text));
  assert.match(text,/never imply successful inference/);
 }
});
test('missing backend capabilities fall back to deterministic-only without implying inference',()=>{
 const {lines,deterministicOnly}=buildReadinessLines({spendingConfirmed:true,spendLimitUSD:5,capabilities:null});
 assert.equal(deterministicOnly,true);
 assert.match(lines.join('\n'),/deterministic features only/);assert.match(lines.join('\n'),/Inference verified: false/);
});
test('ready line labels deterministic-only mode explicitly',()=>{
 assert.match(readyLine({origin:'http://localhost:5173',deterministicOnly:true}),/ready \(deterministic-only\) at http:\/\/localhost:5173/);
 assert.match(readyLine({origin:'http://localhost:5173',deterministicOnly:false}),/ready at http:\/\/localhost:5173/);
 assert.ok(!readyLine({origin:'http://localhost:5173',deterministicOnly:false}).includes('deterministic-only'));
});
