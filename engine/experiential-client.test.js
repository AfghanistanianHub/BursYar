import test from 'node:test';
import assert from 'node:assert/strict';
import {createExperientialClient,EXPERIENTIAL_BASE_URL,EXPERIENTIAL_MODEL} from './experiential-client.js';
test('routes exact model to gateway with bearer authentication and preserves tool calls and usage',async()=>{
 const expected={choices:[{message:{tool_calls:[{id:'call_1',type:'function',function:{name:'lookup',arguments:'{}'}}]}}],usage:{prompt_tokens:3,completion_tokens:5,total_tokens:8}};
 const client=createExperientialClient({apiKey:'test-only',fetchImpl:async(url,options)=>{
  assert.equal(url,EXPERIENTIAL_BASE_URL+'/chat/completions');
  assert.equal(options.headers.authorization,'Bearer test-only');
  assert.deepEqual(JSON.parse(options.body),{model:EXPERIENTIAL_MODEL,messages:[{role:'user',content:'hello'}],tools:[{type:'function',function:{name:'lookup'}}]});
  return Response.json(expected);
 }});
 assert.deepEqual(await client.createChatCompletion({messages:[{role:'user',content:'hello'}],tools:[{type:'function',function:{name:'lookup'}}]}),expected);
});
test('preserves streaming response without consuming SSE',async()=>{
 const response=new Response('data: [DONE]\\n\\n',{headers:{'content-type':'text/event-stream'}});
 const client=createExperientialClient({apiKey:'test-only',fetchImpl:async(_url,options)=>{assert.equal(JSON.parse(options.body).stream,true);return response;}});
 assert.equal(await client.createChatCompletion({messages:[],stream:true}),response);
});
test('fails closed without a key and rejects model substitution',async()=>{
 assert.throws(()=>createExperientialClient({apiKey:''}));
 const client=createExperientialClient({apiKey:'test-only',fetchImpl:()=>{throw Error('must not call network')}});
 await assert.rejects(client.createChatCompletion({model:'other',messages:[]}),/Model mismatch/);
});
