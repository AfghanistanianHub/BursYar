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
test('classifies provider HTTP failures without retaining response secrets or retrying',async()=>{
 for(const [status,code,http] of [[400,'provider_request',502],[401,'provider_auth',502],[402,'provider_billing',503],[403,'provider_access',502],[404,'provider_model_or_endpoint',502],[429,'provider_rate_limit',503],[500,'provider_service',502],[503,'provider_service',503],[504,'provider_timeout',504]]){
  let calls=0;const infer=createMetaInference({key:'SECRET',model:'configured',fetchImpl:async()=>{calls++;return new Response('SECRET response',{status});}});
  await assert.rejects(infer([]),e=>e.code===code&&e.status===http&&e.providerStatus===status&&!JSON.stringify(e).includes('SECRET'));assert.equal(calls,1);
 }
});
test('distinguishes output truncation, bad JSON, schema, media type and transport',async()=>{
 for(const [response,code] of [[Response.json({choices:[{finish_reason:'length'}]}),'provider_truncated'],[Response.json({choices:[]}),'provider_schema'],[new Response('{',{headers:{'content-type':'application/json'}}),'provider_json'],[new Response('SECRET'),'provider_content_type']]){
  await assert.rejects(createMetaInference({key:'test',model:'model',fetchImpl:async()=>response})([]),e=>e.code===code);
 }
 await assert.rejects(createMetaInference({key:'test',model:'model',fetchImpl:async()=>{throw Error('SECRET network');}})([]),e=>e.code==='provider_transport'&&!e.message.includes('SECRET'));
});
test('deadline covers delayed headers and streamed body; invalid timeouts fail closed',async()=>{
 for(const timeoutMs of [0,-1,60001,NaN])assert.throws(()=>createMetaInference({key:'test',model:'model',timeoutMs}));
 for(const bodyDelay of [false,true]){
  const infer=createMetaInference({key:'test',model:'model',timeoutMs:15,fetchImpl:async(_url,{signal})=>{
   const wait=()=>new Promise((resolve,reject)=>{const timer=setTimeout(resolve,200);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(signal.reason);},{once:true});});
   if(!bodyDelay){await wait();return Response.json({});}
   return new Response(new ReadableStream({async pull(controller){try{await wait();controller.close();}catch(e){controller.error(e);}}}),{headers:{'content-type':'application/json'}});
  }});
  await assert.rejects(infer([]),e=>e.code==='provider_timeout'&&e.status===504);
 }
});
test('Meta metrics retain only validated provider counts and latency, never credentials or content',async()=>{
 let metric;
 const infer=createMetaInference({key:'SECRET',model:'configured',onMetrics:value=>{metric=value;},fetchImpl:async()=>Response.json({choices:[{finish_reason:'stop',message:{content:'PRIVATE CONTENT'}}],usage:{prompt_tokens:10,completion_tokens:4,total_tokens:14,secret:'SECRET'}})});
 assert.equal(await infer([]),'PRIVATE CONTENT');
 assert.equal(metric.totalTokens,14);assert.equal(metric.costUSD,null);assert.ok(metric.elapsedMs>=0);
 assert.ok(!JSON.stringify(metric).includes('SECRET'));assert.ok(!JSON.stringify(metric).includes('PRIVATE'));
});
