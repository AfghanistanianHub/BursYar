import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore,DocumentError} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';

const origin='http://localhost';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function fixture({maxConcurrent=2}={}){
 const dir=mkdtempSync(join(tmpdir(),'bursyar-resilience-'));
 const documents=new DocumentStore(join(dir,'documents.db'));
 const records=[];
 const server=createInferenceServer({
  projectId:'demo-bursyar',origin,documents,maxConcurrent,
  quota:{reserve(){throw Error('unused');}},
  infer:async()=>{throw Error('unused');},
  verify:async token=>({uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true}),
  diagnose:record=>records.push(record)
 });
 return {dir,documents,server,records};
}
async function listen(server){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return `http://127.0.0.1:${server.address().port}`;
}
const call=(base,path,{token='alice',method='GET',body}={})=>fetch(base+path,{
 method,
 headers:{origin,authorization:`Bearer ${token}`,'content-type':'application/json'},
 ...(body!==undefined?{body:JSON.stringify(body)}:{})
});

test('a storage fault is a retryable 503, not a client-shaped 422',async()=>{
 const {dir,documents,server,records}=fixture();
 const base=await listen(server);
 try{
  const original=documents.export.bind(documents);
  documents.export=()=>{throw new Error('database is read-only');};
  const failed=await call(base,'/api/export');
  assert.equal(failed.status,503,'a storage fault on a local route is retryable, not a 422');
  const body=await failed.json();
  assert.equal(body.error,'Local processing unavailable');
  assert.ok(!JSON.stringify(body).includes('read-only'),'storage detail must not leak');
  const record=records.find(r=>r.event==='local_route_failed'&&r.status===503);
  assert.ok(record,'a sanitised failure record must be logged');
  assert.ok(!('uid' in record)&&!('token' in record),'the log record carries no identity');

  documents.export=original;
  assert.equal((await call(base,'/api/export')).status,200,'retry after the fault succeeds');

  // A typed client error keeps its own status instead of becoming a 503.
  const originalUpload=documents.upload.bind(documents);
  documents.upload=()=>{throw new DocumentError(413);};
  assert.equal((await call(base,'/api/documents',{method:'POST',body:{text:'x',mime:'text/plain',consent:true}})).status,413);
  documents.upload=originalUpload;
 }finally{server.close();rmSync(dir,{recursive:true,force:true});}
});

test('one saturated route class does not consume another class capacity',async()=>{
 const {dir,documents,server}=fixture({maxConcurrent:2});
 const base=await listen(server);
 try{
  const original=documents.list.bind(documents);
  documents.list=async(...args)=>{await sleep(2600);return original(...args);};
  const slow=Array.from({length:4},()=>call(base,'/api/documents'));
  await sleep(100);
  // A different class answers immediately while documents are saturated.
  const other=await call(base,'/api/scholarships');
  assert.equal(other.status,200,'a local route must not queue behind document reads');
  const busiest=await call(base,'/api/documents');
  assert.equal(busiest.status,429,'a request still waiting after 2 s is told to retry');
  assert.equal(busiest.headers.get('retry-after'),'2');
  const results=await Promise.all(slow);
  for(const response of results)assert.equal(response.status,200);
  documents.list=original;
 }finally{server.close();rmSync(dir,{recursive:true,force:true});}
});
