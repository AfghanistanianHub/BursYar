import test from 'node:test';
import assert from 'node:assert/strict';
import {documentRequest} from '../src/document-request.js';
test('slow readable response succeeds within the configurable timeout without retrying',async()=>{
 let calls=0;const result=await documentRequest('/api/documents',{token:'synthetic',timeoutMs:100,fetchImpl:async(_url,options)=>{calls++;assert.equal(options.credentials,'omit');assert.equal(options.headers.authorization,'Bearer synthetic');assert.equal(options.signal.aborted,false);await new Promise(r=>setTimeout(r,10));return {ok:true,json:async()=>[]};}});
 assert.deepEqual(result,[]);assert.equal(calls,1);
});
test('read timeout and uncertain write response produce different recovery codes, never retries',async()=>{
 for(const [method,code]of [['GET','requestTimedOut'],['POST','mutationUncertain'],['DELETE','mutationUncertain']]){
  let calls=0;await assert.rejects(()=>documentRequest('/api/documents',{token:'synthetic',method,fetchImpl:async()=>{calls++;throw new DOMException('Timed out','TimeoutError');}}),e=>e.code===code);assert.equal(calls,1);
 }
});
test('lost or malformed write responses never imply the mutation failed',async()=>{
 for(const fetchImpl of [async()=>{throw new TypeError('network')},async()=>({ok:true,json:async()=>{throw Error('bad JSON')}})])await assert.rejects(()=>documentRequest('/api/documents',{token:'synthetic',method:'POST',fetchImpl}),e=>e.code==='mutationUncertain');
});
test('safe HTTP error mapping never exposes server response text or credentials',async()=>{
 for(const [status,code]of [[401,'signInRequired'],[403,'signInRequired'],[409,'conflictError'],[429,'limitError'],[503,'unavailableError']])await assert.rejects(()=>documentRequest('/api/documents',{token:'synthetic',fetchImpl:async()=>({ok:false,status,text:async()=>'PRIVATE'})}),e=>e.code===code&&!e.message.includes('PRIVATE')&&!e.message.includes('synthetic'));
});
test('configured timeout actually aborts a stalled fetch exactly once',async()=>{
 let calls=0;
 await assert.rejects(()=>documentRequest('/api/documents',{token:'synthetic',timeoutMs:5,fetchImpl:async(_path,{signal})=>{calls++;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>resolve({ok:true,json:async()=>[]}),1000);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(signal.reason)},{once:true});});}}),error=>error.code==='requestTimedOut');
 assert.equal(calls,1);
});
