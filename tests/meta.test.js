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
 for(const timeoutMs of [0,-1,120001,NaN])assert.throws(()=>createMetaInference({key:'test',model:'model',timeoutMs}));
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
const completion=()=>Response.json({choices:[{finish_reason:'stop',message:{content:'{}'}}]});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('default and explicit deadlines are bounded; model defaults and token cap are preserved',async()=>{
 const infer=createMetaInference({key:'SECRET',model:'muse-spark-1.3',fetchImpl:async(_,{body})=>{const request=JSON.parse(body);assert.equal(request.max_completion_tokens,4000);assert.equal(request.stream,false);assert.equal(Object.hasOwn(request,'temperature'),false);assert.equal(Object.hasOwn(request,'reasoning_effort'),false);return completion();}});
 assert.equal(infer.configuration.timeoutMs,60000);assert.equal(infer.configuration.model,'muse-spark-1.3');
 assert.equal(createMetaInference({key:'x',model:'SECRET',timeoutMs:120000}).configuration.model,'other_configured_model');
 assert.equal(await infer([]),'{}');
});
test('deadline during headers is identified without falsely assigning DNS, TLS or generation',async()=>{
 let calls=0;
 const infer=createMetaInference({key:'SECRET',model:'muse-spark-1.3',timeoutMs:15,fetchImpl:async()=>{calls++;await sleep(60);return completion();}});
 await assert.rejects(infer([{role:'user',content:'PRIVATE SOURCE'}]),e=>{
  assert.equal(e.code,'provider_timeout');assert.equal(e.providerStatus,null);
  assert.equal(e.diagnostics.phase,'awaiting_response_headers');assert.equal(e.diagnostics.timeoutCause,'local_deadline');
  assert.equal(e.diagnostics.headersAfterMs,null);assert.equal(e.diagnostics.firstBodyByteAfterMs,null);
  assert.ok(!JSON.stringify(e).includes('SECRET'));assert.ok(!JSON.stringify(e).includes('PRIVATE SOURCE'));return true;
 });assert.equal(calls,1);
});
test('body stalls preserve observed HTTP status, first byte and byte count and cancel the reader',async()=>{
 for(const firstByte of [false,true]){
  let reads=0,cancelled=false;
  const body=new ReadableStream({pull(controller){if(firstByte&&reads++===0){controller.enqueue(new Uint8Array([123]));return;}return new Promise(()=>{});},cancel(){cancelled=true;}});
  const infer=createMetaInference({key:'SECRET',model:'muse-spark-1.3',timeoutMs:20,fetchImpl:async()=>new Response(body,{headers:{'content-type':'application/json'}})});
  await assert.rejects(infer([]),e=>{assert.equal(e.code,'provider_timeout');assert.equal(e.providerStatus,200);assert.equal(e.diagnostics.phase,'reading_response_body');assert.equal(e.diagnostics.timeoutCause,'local_deadline');assert.equal(e.diagnostics.responseBytes,firstByte?1:0);assert.equal(e.diagnostics.firstBodyByteAfterMs===null,!firstByte);return true;});
  assert.equal(cancelled,true);
 }
});
test('slow valid response inside the configured deadline is accepted with numeric milestones',async()=>{
 let metrics;
 const bytes=new TextEncoder().encode(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'{}'}}]}));
 const infer=createMetaInference({key:'SECRET',model:'muse-spark-1.3',timeoutMs:500,onMetrics:x=>metrics=x,fetchImpl:async()=>{await sleep(20);return new Response(new ReadableStream({async start(c){await sleep(20);c.enqueue(bytes);c.close();}}),{headers:{'content-type':'application/json'}});}});
 assert.equal(await infer([]),'{}');assert.ok(metrics.headersAfterMs>=0);assert.ok(metrics.firstBodyByteAfterMs>=metrics.headersAfterMs);assert.equal(metrics.responseBytes,bytes.length);assert.equal(metrics.phase,'validating_response');
});
test('caller cancellation before fetch and during a body read never retries or logs abort reasons',async()=>{
 for(const before of [true,false]){
  const controller=new AbortController();let calls=0;
  const infer=createMetaInference({key:'SECRET',model:'muse-spark-1.3',timeoutMs:200,fetchImpl:async()=>{calls++;return new Response(new ReadableStream({pull(){return new Promise(()=>{});}}),{headers:{'content-type':'application/json'}});}});
  if(before)controller.abort(Error('PRIVATE ABORT REASON'));else setTimeout(()=>controller.abort(Error('PRIVATE ABORT REASON')),15);
  await assert.rejects(infer([],{signal:controller.signal}),e=>{assert.equal(e.code,'provider_cancelled');assert.equal(e.diagnostics.timeoutCause,'caller_cancelled');assert.ok(!JSON.stringify(e).includes('PRIVATE'));return true;});
  assert.equal(calls,before?0:1);
 }
});
test('upstream HTTP 504 is distinct from the local deadline and transport failures are allowlisted',async()=>{
 await assert.rejects(createMetaInference({key:'x',model:'muse-spark-1.3',fetchImpl:async()=>new Response('PRIVATE',{status:504})})([]),e=>e.code==='provider_timeout'&&e.providerStatus===504&&e.diagnostics.timeoutCause==='provider_http_504'&&e.diagnostics.phase==='response_headers');
 for(const code of ['ENOTFOUND','ERR_TLS_CERT_ALTNAME_INVALID','UND_ERR_HEADERS_TIMEOUT','SECRET_UNTRUSTED_CODE']){
  await assert.rejects(createMetaInference({key:'x',model:'muse-spark-1.3',fetchImpl:async()=>{throw Object.assign(Error('PRIVATE ERROR'),{cause:{code}});}})([]),e=>{assert.equal(e.code,'provider_transport');assert.equal(e.diagnostics.transportCode??null,code==='SECRET_UNTRUSTED_CODE'?null:code);assert.ok(!JSON.stringify(e).includes('PRIVATE'));assert.ok(!JSON.stringify(e).includes('SECRET_UNTRUSTED_CODE'));return true;});
 }
});
test('malformed slow response remains invalid rather than being reported as a provider timeout',async()=>{
 await assert.rejects(createMetaInference({key:'x',model:'muse-spark-1.3',timeoutMs:500,fetchImpl:async()=>{await sleep(15);return new Response('{PRIVATE',{headers:{'content-type':'application/json'}});}})([]),e=>e.code==='provider_json'&&e.providerStatus===200&&e.diagnostics.phase==='validating_response'&&!JSON.stringify(e).includes('PRIVATE'));
});
test('synchronous caller abort during dispatch consumes a simultaneous fetch rejection safely',async()=>{
 const controller=new AbortController();let calls=0;
 const infer=createMetaInference({key:'SECRET',model:'muse-spark-1.3',fetchImpl:()=>{calls++;controller.abort(Error('PRIVATE REASON'));return Promise.reject(Error('PRIVATE TRANSPORT'));}});
 await assert.rejects(infer([],{signal:controller.signal}),e=>e.code==='provider_cancelled'&&!JSON.stringify(e).includes('PRIVATE'));
 assert.equal(calls,1);await sleep(5);
});
