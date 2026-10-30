import test from 'node:test';
import assert from 'node:assert/strict';
import {decideProviderRoute} from './provider-policy.js';
import {adultPolicy} from '../tests/helpers/policy.js';

test('verified subject age cannot substitute for verified caller age',()=>{
 for(const userAgeBand of [undefined,'under_18','unknown'])assert.equal(decideProviderRoute({...adultPolicy,userAgeBand}).allowed,false);
});
test('hosted models also require geographic clearance',()=>{
 assert.equal(decideProviderRoute({...adultPolicy,provider:'self_hosted',model:'qwen3-local',selfHostedLegalReview:true,selfHostedSecurityReview:true,locationDecision:'unknown'}).allowed,false);
});
