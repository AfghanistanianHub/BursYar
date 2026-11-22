import test from 'node:test';
import assert from 'node:assert/strict';
import {createProvider} from './providers.js';
test('disabled and unconfigured providers are explicitly unavailable',()=>{
 for(const provider of ['meta','gemini','self_hosted'])assert.equal(createProvider({provider}).available,false);
});
test('Gemini and Qwen adapters validate wire responses, model, deadline and bounded output without live calls',async()=>{
 for(const provider of ['gemini','self_hosted']){
  const model=provider==='gemini'?'gemini-2.5-flash':'qwen3-local';let calls=0;
  const config={provider,enabled:true,key:'TEST',model,endpoint:'http://127.0.0.1:8000/v1/chat/completions',timeoutMs:50};
  const adapter=createProvider({...config,fetchImpl:async(_url,options)=>{calls++;assert.equal(options.redirect,'error');return Response.json(provider==='gemini'?{candidates:[{finishReason:'STOP',content:{parts:[{text:'{"criteria":[]}'}]}}]}:{choices:[{finish_reason:'stop',message:{content:'{"criteria":[]}'}}]});}});
  assert.equal(adapter.provider,provider);assert.equal(adapter.model,model);assert.equal(await adapter.infer([{role:'user',content:'test'}]),'{"criteria":[]}');assert.equal(calls,1);
  const stalled=createProvider({...config,timeoutMs:10,fetchImpl:async()=>new Promise(()=>{})});await assert.rejects(stalled.infer([{role:'user',content:'test'}]),e=>e.code==='provider_timeout');
  const malformed=createProvider({...config,fetchImpl:async()=>Response.json({SECRET:'private'})});await assert.rejects(malformed.infer([{role:'user',content:'test'}]));
  const large=createProvider({...config,fetchImpl:async()=>new Response('x'.repeat(131073),{headers:{'content-type':'application/json'}})});await assert.rejects(large.infer([{role:'user',content:'test'}]));
 }
 assert.throws(()=>createProvider({provider:'self_hosted',enabled:true,model:'qwen3-local',endpoint:'https://evil.example'}));
});

test('Experiential adapter uses exact gateway and retains evidence contract',async()=>{
 const adapter=createProvider({provider:'experiential',enabled:true,key:'test-key',model:'claude-opus-5.5',fetchImpl:async(url,options)=>{
  assert.equal(url,'https://api.experientiallabs.ai/v1/chat/completions');
  assert.equal(options.headers.authorization,'Bearer test-key');
  const body=JSON.parse(options.body);
  assert.equal(body.model,'claude-opus-5.5');
  assert.equal(body.stream,false);
  return Response.json({choices:[{finish_reason:'stop',message:{content:'{"criteria":[]}'}}],usage:{prompt_tokens:2,completion_tokens:3,total_tokens:5}});
 }});
 assert.equal(adapter.available,true);
 assert.equal(await adapter.infer([{role:'user',content:'test'}]),'{"criteria":[]}');
 assert.throws(()=>createProvider({provider:'experiential',enabled:true,key:'test-key',model:'other'}));
});
