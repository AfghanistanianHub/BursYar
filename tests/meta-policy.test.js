import test from 'node:test';
import assert from 'node:assert/strict';
import {createMetaInference} from '../engine/meta.js';
import {buildMetaRequest,metaReservationUnits} from '../engine/meta-request.js';
import {EVIDENCE_RESPONSE_FORMAT,EVIDENCE_LIMITS} from '../engine/evidence-contract.js';
const source='Applicants must provide academic transcripts.';
const content=()=>JSON.stringify({criteria:[{kind:'transcripts',required:true,excerpt:source,en:'Provide transcripts.',fa:'اسناد تحصیلی ارائه کنید.',ps:'تحصیلي اسناد وړاندې کړئ.'}],deadline:null,funding:[]});
const envelope=(finish='stop',usage)=>({choices:[{finish_reason:finish,message:{content:content()}}],...(usage?{usage}:{})});
const usage={prompt_tokens:1200,completion_tokens:4000,total_tokens:5200,completion_tokens_details:{reasoning_tokens:3990,private_reasoning:'PRIVATE CHAIN'}};
test('compact schema is strict, bounded, immutable and every object declares all required fields',()=>{
 assert.equal(EVIDENCE_RESPONSE_FORMAT.type,'json_schema');assert.equal(EVIDENCE_RESPONSE_FORMAT.json_schema.strict,true);
 const visit=s=>{if(!s||typeof s!=='object')return;if(s.type==='object'){assert.equal(s.additionalProperties,false);assert.deepEqual([...s.required].sort(),Object.keys(s.properties).sort());}for(const v of Object.values(s))visit(v);};
 visit(EVIDENCE_RESPONSE_FORMAT.json_schema.schema);
 assert.equal(EVIDENCE_RESPONSE_FORMAT.json_schema.schema.properties.criteria.maxItems,4);
 assert.equal(EVIDENCE_RESPONSE_FORMAT.json_schema.schema.properties.funding.maxItems,2);
 assert.equal(EVIDENCE_RESPONSE_FORMAT.json_schema.schema.properties.criteria.items.properties.en.maxLength,120);
 assert.ok(Object.isFrozen(EVIDENCE_RESPONSE_FORMAT.json_schema.schema));
});
test('truncated reasoning responses retain finish/usage counters before rejection and never emit success metrics',async()=>{
 let calls=0,success=0;
 const infer=createMetaInference({key:'PRIVATE KEY',model:'muse-spark-1.3',onMetrics:()=>success++,fetchImpl:async(_,{body})=>{
  calls++;const request=JSON.parse(body);assert.equal(request.reasoning_effort,'low');assert.equal(request.max_completion_tokens,4000);assert.equal(request.response_format.json_schema.name,'bursyar_evidence_v1');
  const raw=envelope('length',{...usage,completion_tokens_details:{reasoning_tokens:4000,private_reasoning:'PRIVATE CHAIN'}});raw.choices[0].message.content=null;return Response.json({...raw,private_output:'PRIVATE MODEL OUTPUT'});
 }});
 await assert.rejects(infer([{role:'user',content:'PRIVATE SOURCE'}]),e=>{
  assert.equal(e.code,'provider_truncated');assert.equal(e.providerStatus,200);assert.equal(e.diagnostics.phase,'validating_response');
  assert.equal(e.diagnostics.finishReason,'length');assert.equal(e.diagnostics.promptTokens,1200);assert.equal(e.diagnostics.completionTokens,4000);assert.equal(e.diagnostics.reasoningTokens,4000);assert.equal(e.diagnostics.totalTokens,5200);
  assert.equal(e.diagnostics.reasoningEffort,'low');assert.equal(e.diagnostics.responseFormat,'json_schema');assert.ok(!JSON.stringify(e).includes('PRIVATE'));return true;
 });assert.equal(calls,1);assert.equal(success,0);
});
test('length is always rejected even when visible content is parseable and schema-valid',async()=>{
 const raw=envelope('length');assert.ok(JSON.parse(raw.choices[0].message.content).criteria);
 await assert.rejects(createMetaInference({key:'x',model:'muse-spark-1.3',fetchImpl:async()=>Response.json(raw)})([]),e=>e.code==='provider_truncated'&&e.diagnostics.finishReason==='length'&&e.diagnostics.reasoningTokens===null);
});
test('valid stop records provider-reported reasoning usage without raw output or reasoning text',async()=>{
 let metrics;const infer=createMetaInference({key:'PRIVATE KEY',model:'muse-spark-1.3',onMetrics:m=>metrics=m,fetchImpl:async()=>Response.json(envelope('stop',{...usage,completion_tokens:1300,total_tokens:2500,completion_tokens_details:{reasoning_tokens:500,private_reasoning:'PRIVATE CHAIN'}}))});
 assert.equal(await infer([]),content());assert.equal(metrics.finishReason,'stop');assert.equal(metrics.reasoningTokens,500);assert.equal(metrics.completionTokens,1300);assert.equal(metrics.costUSD,null);
 assert.ok(!JSON.stringify(metrics).includes(source));assert.ok(!JSON.stringify(metrics).includes('PRIVATE'));
});
test('missing or malformed usage is unknown; arbitrary finish strings and metadata never leak',async()=>{
 for(const tokens of [undefined,-1,1.5,'PRIVATE COUNT',Infinity,10000001]){
  const u={prompt_tokens:tokens,completion_tokens:tokens,total_tokens:tokens,completion_tokens_details:{reasoning_tokens:tokens}};
  await assert.rejects(createMetaInference({key:'x',model:'muse-spark-1.3',fetchImpl:async()=>Response.json(envelope('PRIVATE FINISH',u))})([]),e=>{assert.equal(e.code,'provider_schema');assert.equal(e.diagnostics.finishReason,'unrecognized');for(const k of ['promptTokens','completionTokens','totalTokens','reasoningTokens'])assert.equal(e.diagnostics[k],null);assert.ok(!JSON.stringify(e).includes('PRIVATE'));return true;});
 }
});
test('refusals, extra choices and malformed provider envelopes remain hard failures',async()=>{
 for(const response of [{choices:[{finish_reason:'stop',message:{content:content(),refusal:'PRIVATE REFUSAL'}}]}, {choices:[...envelope().choices,...envelope().choices]}, null]){
  await assert.rejects(createMetaInference({key:'x',model:'muse-spark-1.3',fetchImpl:async()=>Response.json(response)})([]),e=>['provider_refusal','provider_schema'].includes(e.code)&&!JSON.stringify(e).includes('PRIVATE'));
 }
});
test('quota units cover the exact full request including schema while the completion cap stays unchanged',async()=>{
 const messages=[{role:'developer',content:'Synthetic extraction only.'},{role:'user',content:'SYNTHETIC TEST SOURCE'}];let bytes;
 const infer=createMetaInference({key:'PRIVATE KEY',model:'muse-spark-1.3',fetchImpl:async(_,{body})=>{bytes=Buffer.byteLength(body,'utf8');assert.deepEqual(JSON.parse(body),buildMetaRequest('muse-spark-1.3',messages));return Response.json(envelope());}});
 await infer(messages);
 assert.equal(infer.reservationUnits(messages),bytes+4000);assert.equal(infer.reservationUnits(messages),metaReservationUnits('muse-spark-1.3',messages));
 assert.ok(bytes>Buffer.byteLength(JSON.stringify(messages)));assert.equal(EVIDENCE_LIMITS.criteria,4);
});
test('only a safe local UUID may correlate metadata; no correlation field is sent to the model',async()=>{
 for(const requestId of ['12345678-1234-1234-1234-123456789abc','PRIVATE TOKEN']){
  let metrics;const infer=createMetaInference({key:'PRIVATE KEY',model:'muse-spark-1.3',onMetrics:m=>metrics=m,fetchImpl:async(_,{body})=>{assert.equal(Object.hasOwn(JSON.parse(body),'requestId'),false);return Response.json(envelope());}});
  await infer([],{requestId});assert.equal(metrics.requestId,requestId==='PRIVATE TOKEN'?undefined:requestId);assert.ok(!JSON.stringify(metrics).includes('PRIVATE'));
 }
});
