import test from 'node:test';
import assert from 'node:assert/strict';
import {decideProviderRoute} from './provider-policy.js';
const adult={model:'muse-spark-1.3',subjectAgeBand:'adult_18_plus',audience:'adult_only',locationDecision:'allowed',consentVerified:true,dataClass:'user_content'};
test('approved standard adult route',()=>assert.equal(decideProviderRoute(adult).route,'meta_standard'));
test('minors and guardian proxies cannot use Meta',()=>{
 for(const change of [{subjectAgeBand:'under_18'},{audience:'minor_targeted'},{subjectAgeBand:'unknown'}])assert.equal(decideProviderRoute({...adult,...change}).allowed,false);
});
test('restricted or unknown geography fails closed',()=>{
 for(const locationDecision of ['restricted','unknown',undefined])assert.equal(decideProviderRoute({...adult,locationDecision}).allowed,false);
});
test('contributor models and unknown models cannot receive application requests',()=>{
 for(const model of ['muse-spark-1.3-contributor','muse-spark-1.2-contributor','unknown'])assert.equal(decideProviderRoute({...adult,model}).allowed,false);
});
test('missing consent or data classification fails closed',()=>{
 assert.equal(decideProviderRoute({...adult,consentVerified:false}).allowed,false);
 assert.equal(decideProviderRoute({...adult,dataClass:'unknown'}).allowed,false);
});
test('deterministic mode never selects Meta',()=>{
 assert.equal(decideProviderRoute({model:'deterministic',subjectAgeBand:'under_18',locationDecision:'restricted'}).route,'deterministic');
});

test('Gemini public source requires eligibility, and private data needs no-training terms',()=>{
 const gemini={...adult,provider:'gemini',model:'gemini-approved',dataClass:'public_source'};
 assert.equal(decideProviderRoute(gemini).route,'gemini_eligible');
 assert.equal(decideProviderRoute({...gemini,dataClass:'user_content'}).allowed,false);
 assert.equal(decideProviderRoute({...gemini,dataClass:'user_content',noTrainingContract:true}).allowed,true);
 assert.equal(decideProviderRoute({...gemini,subjectAgeBand:'under_18'}).allowed,false);
 assert.equal(decideProviderRoute({...gemini,locationDecision:'restricted'}).allowed,false);
});
test('self-hosted model requires explicit legal and security reviews',()=>{
 const local={provider:'self_hosted',model:'qwen3-local',subjectAgeBand:'under_18',audience:'minor_targeted',locationDecision:'restricted',consentVerified:true,dataClass:'user_content'};
 assert.equal(decideProviderRoute(local).allowed,false);
 assert.equal(decideProviderRoute({...local,selfHostedLegalReview:true}).allowed,false);
 assert.equal(decideProviderRoute({...local,selfHostedLegalReview:true,selfHostedSecurityReview:true}).route,'self_hosted');
});
