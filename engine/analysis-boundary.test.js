import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeAnalysisContext} from './provider-policy.js';

// Entire request body is user-controlled: source snippets cannot be declared
// public-only merely by a policy record, regardless of apparent source URL.
const adult={provider:'meta',model:'muse-spark-1.3',userAgeBand:'adult_18_plus',subjectAgeBand:'adult_18_plus',audience:'adult_only',locationDecision:'allowed',consentVerified:true,dataClass:'user_content'};
test('the analysis gateway requires private user-content classification',()=>{
 assert.equal(authorizeAnalysisContext(adult).allowed,true);
 for(const dataClass of ['public_source','synthetic_only','contributor',undefined,null])
  assert.equal(authorizeAnalysisContext({...adult,dataClass}).allowed,false);
});
test('Meta contributor IDs, unknown ages, and minor-targeted requests fail closed',()=>{
 for(const change of [
  {model:'muse-spark-1.3-contributor'},
  {model:'muse-spark-1.2-contributor'},
  {userAgeBand:'unknown'},
  {subjectAgeBand:'under_18'},
  {audience:'minor_targeted'},
  {locationDecision:'restricted'},
  {consentVerified:false}
 ])assert.equal(authorizeAnalysisContext({...adult,...change}).allowed,false);
});
test('guardian consent cannot override an underage subject on hosted providers',()=>{
 for(const provider of ['meta','gemini']){
  const model=provider==='meta'?'muse-spark-1.3':'gemini-2.5-flash';
  const ctx={...adult,provider,model,subjectAgeBand:'under_18',consentVerified:true,noTrainingContract:true};
  assert.equal(authorizeAnalysisContext(ctx).allowed,false);
 }
});
test('never default a missing policy, model, or private data class to an allowed inference',()=>{
 for(const x of [null,undefined,{}, {...adult,provider:'unknown'}, {...adult,model:'unknown'}])assert.equal(authorizeAnalysisContext(x).allowed,false);
});
