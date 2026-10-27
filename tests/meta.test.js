import test from 'node:test';
import assert from 'node:assert/strict';
import {createMetaInference} from '../engine/meta.js';
test('Meta adapter pins URL, bounds completions and disables redirects',async()=>{
 const infer=createMetaInference({key:'test-only',model:'configured-model',fetchImpl:async(url,options)=>{assert.equal(url,'https://api.meta.ai/v1/chat/completions');assert.equal(options.redirect,'error');assert.equal(JSON.parse(options.body).max_completion_tokens,4000);return Response.json({choices:[{finish_reason:'stop',message:{content:'{}'}}]});}});
 assert.equal(await infer([]),'{}');
});
test('rejects oversized, incomplete, non-JSON and failed provider replies',async()=>{
 for(const response of [Response.json({choices:[{finish_reason:'length',message:{content:'{}'}}]}),new Response('x'.repeat(140000),{headers:{'content-type':'application/json'}}),new Response('not json'),new Response('sensitive',{status:401})]){
 const infer=createMetaInference({key:'test-only',model:'configured',fetchImpl:async()=>response});await assert.rejects(infer([]));
 }
});
