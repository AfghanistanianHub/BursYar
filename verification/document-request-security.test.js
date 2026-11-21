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
