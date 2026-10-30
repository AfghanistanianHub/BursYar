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
