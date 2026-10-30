import {policyContextForRequest} from './helpers/policy.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createInferenceServer} from './helpers/server.js';
import {createSourceFetcher} from '../engine/source-fetch.js';
const text='Applicants must provide academic transcripts.';
test('authenticated source preview never spends; explicit approval and intact receipt required for analysis',async()=>{
 let calls=0,reserved=0,fetched=0;const records=[];
 const sources=createSourceFetcher({resolve:async()=>[{address:'93.184.216.34',family:4}],transport:async()=>{fetched++;return {body:`<main><p>${text}</p></main>`};}});
 const server=createInferenceServer({policyContextForRequest,sources,projectId:'demo-bursyar',origin:'http://localhost:5173',verify:async()=>({uid:'one',aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true}),quota:{reserve(){reserved++;}},infer:async()=>{calls++;return JSON.stringify({criteria:[{kind:'transcripts',required:true,excerpt:text,en:'Academic transcripts required.',fa:'ارائه کارنامه تحصیلی لازم است.',ps:'د زده کړو سندونه اړین دي.'}],deadline:null,funding:[]});},diagnose:r=>records.push(r)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const post=(path,body,headers={authorization:'Bearer test-only','content-type':'application/json'})=>fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});
 try{
  assert.equal((await post('/api/source',{url:'https://example.com/'},{'content-type':'application/json'})).status,401);assert.equal(fetched,0);
  assert.equal((await post('/api/source',{url:'https://example.com/'},{authorization:'Bearer test-only','content-type':'application/json',origin:'https://evil.example'})).status,403);
  const r=await post('/api/source',{url:'https://example.com/'});assert.equal(r.status,200);const source=await r.json();assert.equal(calls,0);assert.equal(reserved,0);assert.equal(records.length,0);
  const body={text:source.text,sourceUrl:source.receipt.sourceUrl,language:'en',receipt:source.receipt};
  assert.equal((await post('/api/analyze',body)).status,400);
  assert.equal((await post('/api/analyze',{...body,sourceApproved:true,text:text+' edited'})).status,400);assert.equal(calls,0);assert.equal(reserved,0);
  const a=await post('/api/analyze',{...body,sourceApproved:true});assert.equal(a.status,200);const output=await a.json();assert.equal(output.retrieval.digest,output.sourceDigest);assert.equal(output.retrieval.rawDigest.length,64);assert.equal(output.sourceAudits.length,1);assert.equal(output.sourceAudits[0].metadataConsistent,true);assert.equal(output.sourceAudits[0].sourceAuthenticity,'unverified');assert.equal(output.sourceAudits[0].institutionalAcceptance,'unknown');assert.equal(calls,1);assert.equal(reserved,1);
  assert.equal(records[0].event,'analysis_validated');
 }finally{await new Promise(r=>server.close(r));}
});
