import test from 'node:test';
import assert from 'node:assert/strict';
import {documentRequest} from '../src/document-request.js';

const success=async()=>({ok:true,json:async()=>({ok:true})});
test('document API refuses missing identity token without sending a request',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;return success();};
 for(const token of [undefined,null,'','   ']){
  await assert.rejects(documentRequest('/api/documents',{token,fetchImpl}),e=>e.code==='signInRequired');
 }
 assert.equal(calls,0);
});
test('document API rejects off-origin and malformed request paths',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;return success();};
 for(const path of ['https://example.org/api/documents','//example.org/api/documents','/api/documents?x=1','/health']){
  await assert.rejects(documentRequest(path,{token:'token',fetchImpl}),e=>e.code==='error');
 }
 assert.equal(calls,0);
});
test('authorized document requests omit cookies and include bearer token',async()=>{
 let options;const result=await documentRequest('/api/documents',{token:'test-token',fetchImpl:async(_path,input)=>{options=input;return success();}});
 assert.deepEqual(result,{ok:true});
 assert.equal(options.credentials,'omit');
 assert.equal(options.headers.authorization,'Bearer test-token');
});

test('write failures never silently retry and explicitly mark outcome uncertain',async()=>{
 let calls=0;
 await assert.rejects(documentRequest('/api/documents',{token:'token',method:'POST',body:{consent:true},fetchImpl:async()=>{calls++;throw new TypeError('connection lost');}}),e=>e.code==='mutationUncertain');
 assert.equal(calls,1);
});
test('read timeouts remain distinguishable from network failures',async()=>{
 await assert.rejects(documentRequest('/api/documents',{token:'token',fetchImpl:async()=>{throw Object.assign(new Error('timed out'),{name:'TimeoutError'});}}),e=>e.code==='requestTimedOut');
 await assert.rejects(documentRequest('/api/documents',{token:'token',fetchImpl:async()=>{throw new TypeError('offline');}}),e=>e.code==='requestNetworkError');
});
test('server rejects are reported without retrying a write',async()=>{
 let calls=0;
 await assert.rejects(documentRequest('/api/documents',{token:'token',method:'POST',body:{consent:true},fetchImpl:async()=>{calls++;return {ok:false,status:409};}}),e=>e.code==='conflictError');
 assert.equal(calls,1);
});

test('invalid HTTP methods and timeouts never reach the network',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;return success();};
 for(const method of ['get','PUT','TRACE',''])await assert.rejects(documentRequest('/api/documents',{token:'token',method,fetchImpl}),e=>e.code==='error');
 for(const timeoutMs of [0,-1,NaN,Infinity,121000])await assert.rejects(documentRequest('/api/documents',{token:'token',timeoutMs,fetchImpl}),e=>e.code==='error');
 assert.equal(calls,0);
});
test('explicit false and null JSON bodies are not silently omitted',async()=>{
 for(const body of [false,null]){
  let options;await documentRequest('/api/documents',{token:'token',method:'POST',body,fetchImpl:async(_path,input)=>{options=input;return success();}});
  assert.equal(options.body,JSON.stringify(body));
 }
});
