import test from 'node:test';
import assert from 'node:assert/strict';
import {RemoteDocumentStore} from '../engine/remote-documents.js';
import {createDocumentStorage} from '../engine/document-storage.js';
import {createInferenceServer} from '../engine/http.js';
const url='https://abcdefghijklmnopqrst.supabase.co';
const key='sb_secret_SYNTHETIC_TEST_KEY_ONLY_123456';
const input={consent:true,mime:'text/plain',text:'SYNTHETIC TEST ONLY\nDegree: bachelor'};
function database(){
 const rows=new Map();let calls=0,conflicts=0,fail=false;
 return {rows,get calls(){return calls;},set conflicts(n){conflicts=n;},set fail(v){fail=v;},async fetch(endpoint,options){
  calls++;assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert.equal(options.credentials,'omit');assert.equal(options.headers.apikey,key);
  if(fail)throw Error('PRIVATE_UPSTREAM_DETAIL');
  const body=JSON.parse(options.body);assert.match(body.p_owner,/^[a-f0-9]{64}$/);
  const current=rows.get(body.p_owner)??{revision:0,state:null};
  if(endpoint.endsWith('/bursyar_document_read'))return Response.json(structuredClone(current));
  assert.ok(endpoint.endsWith('/bursyar_document_compare'));
  if(conflicts-->0)return Response.json(false);
  if(current.revision!==body.p_revision)return Response.json(false);
  rows.set(body.p_owner,{revision:current.revision+1,state:structuredClone(body.p_state)});return Response.json(true);
 }};
}
const store=db=>new RemoteDocumentStore({url,key,fetchImpl:db.fetch.bind(db)});
test('remote documents survive a new adapter, preserve review provenance, isolate and erase',async()=>{
 const db=database();let docs=store(db);
 const doc=await docs.upload('alice',input);assert.equal(doc.authenticity,'not_verified');assert.equal(doc.pending.length,1);
 docs=store(db);assert.equal((await docs.get('alice',doc.id)).text,input.text);
 await assert.rejects(docs.get('bob',doc.id),e=>e.status===404);
 await assert.rejects(docs.review('bob',doc.id,{}),e=>e.status===404);
 const profile=await docs.review('alice',doc.id,{[doc.pending[0].id]:{action:'accept'}});
 assert.equal(profile.degree.origin,'document_extracted');assert.equal(profile.degree.verificationStatus,'not_verified');
 const exported=await docs.export('alice');assert.equal(exported.documents.length,1);assert.equal(exported.issuerAuthenticated,false);
 await docs.delete('alice',doc.id);assert.deepEqual(await docs.profile('alice'),{});
 await docs.updateProfile('alice',{consent:true,values:{degree:'master'}});
 await docs.eraseOwner('alice');assert.deepEqual(await docs.export('alice'),{profile:{},documents:[],issuerAuthenticated:false});
 assert.ok(!JSON.stringify([...db.rows.keys()]).includes('alice'));
});
test('invalid consent and invalid profile promotion never commit',async()=>{
 const db=database(),docs=store(db);
 await assert.rejects(docs.upload('alice',{...input,consent:false}),e=>e.status===400);
 await assert.rejects(docs.updateProfile('alice',{consent:false,values:{degree:'master'}}),e=>e.status===400);
 assert.equal(db.rows.size,0);
});
test('concurrent writes retry revision conflicts without losing either document',async()=>{
 const db=database(),a=store(db),b=store(db);
 const records=await Promise.all([a.upload('alice',input),b.upload('alice',input)]);
 const list=await a.list('alice');assert.equal(list.length,2);assert.deepEqual(new Set(list.map(x=>x.id)),new Set(records.map(x=>x.id)));
});
test('conflict retry is bounded and network errors are never retried',async()=>{
 const db=database(),docs=store(db);db.conflicts=5;
 await assert.rejects(docs.upload('alice',input),e=>e.status===409);assert.equal(db.calls,6);assert.equal(db.rows.size,0);
 db.fail=true;const before=db.calls;
 await assert.rejects(docs.upload('alice',input),e=>e.status===503&&e.message==='Document request unavailable');assert.equal(db.calls,before+1);
});
test('remote snapshot enforces original ten-document limit and profile history erasure',async()=>{
 const db=database(),docs=store(db);
 for(let i=0;i<10;i++)await docs.upload('alice',input);
 await assert.rejects(docs.upload('alice',input),e=>e.status===429);
 await docs.updateProfile('alice',{consent:true,values:{degree:'master'}});
 await docs.deleteProfile('alice');assert.deepEqual(await docs.profile('alice'),{});
 const state=[...db.rows.values()][0].state;assert.deepEqual(state.history,[]);
});
test('remote transport denies untrusted endpoints and browser keys',()=>{
 for(const bad of ['http://abcdefghijklmnopqrst.supabase.co','https://example.com','https://abcdefghijklmnopqrst.supabase.co/extra','https://x@abcdefghijklmnopqrst.supabase.co'])assert.throws(()=>new RemoteDocumentStore({url:bad,key}));
 for(const bad of ['',null,'sb_publishable_not_server','eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYW5vbiJ9.'])assert.throws(()=>new RemoteDocumentStore({url,key:bad}));
});
test('malformed, oversized, failed and stalled storage responses fail closed',async()=>{
 for(const response of [Response.json({revision:0,state:{}}),Response.json({revision:-1,state:null}),Response.json({revision:0,state:null},{status:403}),new Response('not json'),Response.json('x'.repeat(1100000))]){
  const docs=new RemoteDocumentStore({url,key,fetchImpl:async()=>response});
  await assert.rejects(docs.profile('alice'),e=>e.status===503&&e.message==='Document request unavailable');
 }
 for(const fetchImpl of [()=>new Promise(()=>{}),async()=>new Response(new ReadableStream({start(){}}),{headers:{'content-type':'application/json'}})]){
  const docs=new RemoteDocumentStore({url,key,fetchImpl,timeoutMs:20});
  await assert.rejects(docs.profile('alice'),e=>e.status===503);
 }
});
test('remote adapter refuses family scope and configuration ambiguity',async()=>{
 const docs=store(database());await assert.rejects(docs.profile('family:child'),e=>e.status===403);
 await assert.rejects(createDocumentStorage({BURSYAR_DOCUMENT_DB:'/unused',BURSYAR_DOCUMENT_SUPABASE_URL:url,BURSYAR_DOCUMENT_SUPABASE_KEY:key}));
 await assert.rejects(createDocumentStorage({BURSYAR_DOCUMENT_SUPABASE_URL:url}));
 await assert.rejects(createDocumentStorage({BURSYAR_DOCUMENT_SUPABASE_URL:url,BURSYAR_DOCUMENT_SUPABASE_KEY:key,BURSYAR_FAMILY_GRANTS:'/unused'}));
 assert.equal(await createDocumentStorage({}),null);
});
test('HTTP gateway awaits remote operations, exports atomically and denies anonymous users',async()=>{
 const docs=store(database());const server=createInferenceServer({documents:docs,verify:async token=>({uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true}),projectId:'demo-bursyar',origin:'http://localhost',quota:{reserve(){throw Error();}},infer:async()=>{throw Error('no model');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const request=(path,method='GET',body,token='alice')=>fetch(base+path,{method,headers:{origin:'http://localhost',...(token?{authorization:`Bearer ${token}`}:{}) ,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 try{
  assert.equal((await request('/api/documents','POST',input,null)).status,401);
  const response=await request('/api/documents','POST',input);assert.equal(response.status,201);const doc=await response.json();assert.equal(doc.text,input.text);
  assert.equal((await request('/api/documents/'+doc.id,'GET',null,'bob')).status,404);
  assert.equal((await (await request('/api/export')).json()).documents.length,1);
  assert.equal((await request('/api/erase','DELETE')).status,200);assert.deepEqual(await (await request('/api/documents')).json(),[]);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('configured remote storage must pass a real RPC probe before startup reports availability',async()=>{
 let calls=0;
 await assert.rejects(createDocumentStorage({BURSYAR_DOCUMENT_SUPABASE_URL:url,BURSYAR_DOCUMENT_SUPABASE_KEY:key},{fetchImpl:async()=>{calls++;throw Error('PRIVATE_ERROR');}}));
 assert.equal(calls,1);
 const db=database();const docs=await createDocumentStorage({BURSYAR_DOCUMENT_SUPABASE_URL:url,BURSYAR_DOCUMENT_SUPABASE_KEY:key},{fetchImpl:db.fetch.bind(db)});
 assert.equal(db.calls,1);assert.equal(db.rows.size,0);docs.close();
});
