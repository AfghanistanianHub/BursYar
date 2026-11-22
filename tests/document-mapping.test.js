import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';

// A realistic Dari transcript: no English field labels and no `معدل: 3.4/4`
// shape, so the bounded parser extracts nothing. This is the case BY-12 is about.
const dari='دانشگاه کابل — رونوشت تحصیلی\nفارغ‌التحصیل رشتهٔ حقوق\nمعدل کل ۳٫۴ از ۴\nنتیجهٔ آزمون زبان: آیلتس ۶٫۵';
const upload={text:dari,mime:'text/plain',consent:true,extractionMethod:'local_image_ocr'};
const dirStore=()=>{const dir=mkdtempSync(join(tmpdir(),'bursyar-map-'));return {dir,store:new DocumentStore(join(dir,'docs.db'))};};

test('a Dari transcript with no parsed claims can be mapped manually with per-field provenance',()=>{
 const {dir,store}=dirStore();
 try{
  const doc=store.upload('alice',upload);
  // The parser found nothing; the review step, not the parser, is the product.
  assert.deepEqual(doc.pending,[]);
  assert.equal(doc.consistency,'not_assessed');
  const profile=store.map('alice',doc.id,{fields:[
   {field:'degree',value:'bachelor',sourceLine:'فارغ‌التحصیل رشتهٔ حقوق'},
   {field:'gpa',value:{gpa:3.4,scale:4},sourceLine:'معدل کل ۳٫۴ از ۴'},
   {field:'languageTest',value:{test:'IELTS Academic',overall:6.5,bands:{listening:6.5,reading:6.5,writing:6,speaking:6}},sourceLine:'نتیجهٔ آزمون زبان: آیلتس ۶٫۵'}
  ]});
  assert.equal(profile.degree.value,'bachelor');
  assert.equal(profile.degree.origin,'user_declared');
  assert.deepEqual(profile.degree.claimIds,[]);
  assert.equal(profile.degree.reviewStatus,'mapped_from_document');
  assert.equal(profile.degree.verificationStatus,'not_verified');
  assert.equal(profile.degree.sourceDocumentId,doc.id);
  assert.equal(profile.degree.sourceExcerpt,'فارغ‌التحصیل رشتهٔ حقوق');
  assert.equal(profile.gpa.value.gpa,3.4);
  assert.equal(profile.gpa.sourceExcerpt,'معدل کل ۳٫۴ از ۴');
  // The stored document keeps the mapping it was built from.
  const stored=store.get('alice',doc.id);
  assert.equal(stored.mapping.length,3);
  assert.deepEqual(stored.mapping.map(entry=>entry.field).sort(),['degree','gpa','languageTest']);
  assert.ok(stored.mappedAt);
  store.close();
  const reopened=new DocumentStore(join(dir,'docs.db'));
  try{
   assert.equal(reopened.profile('alice').gpa.sourceExcerpt,'معدل کل ۳٫۴ از ۴');
   assert.equal(reopened.get('alice',doc.id).mapping.length,3);
  }finally{reopened.close();}
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('mapping never invents a value: the quoted line must exist verbatim and values stay bounded',()=>{
 const {dir,store}=dirStore();
 try{
  const doc=store.upload('alice',upload);
  const bad=[
   [{field:'gpa',value:{gpa:3.4,scale:4},sourceLine:'معدل کل 3.4 از 4'}], // re-typed, not the stored line
   [{field:'gpa',value:{gpa:3.4,scale:4},sourceLine:'معدل'}],              // a fragment
   [{field:'gpa',value:{gpa:7,scale:4},sourceLine:'معدل کل ۳٫۴ از ۴'}],   // out of scale
   [{field:'degree',value:'phd',sourceLine:'فارغ‌التحصیل رشتهٔ حقوق'}],   // unsupported value
   [{field:'languages',value:'Dari',sourceLine:'فارغ‌التحصیل رشتهٔ حقوق'}], // outside the guided set
   [{field:'gpa',value:{gpa:3.4,scale:4},sourceLine:'   '}]
  ];
  for(const fields of bad)assert.throws(()=>store.map('alice',doc.id,{fields}),e=>e.status===400,JSON.stringify(fields));
  assert.throws(()=>store.map('alice',doc.id,{fields:[{field:'gpa',value:{gpa:3,scale:4},sourceLine:'فارغ‌التحصیل رشتهٔ حقوق'},{field:'gpa',value:{gpa:3.5,scale:4},sourceLine:'فارغ‌التحصیل رشتهٔ حقوق'}]}),e=>e.status===400);
  assert.throws(()=>store.map('alice',doc.id,{fields:[]}),e=>e.status===400);
  assert.throws(()=>store.map('alice',doc.id,{}),e=>e.status===400);
  assert.throws(()=>store.map('bob',doc.id,{fields:[{field:'degree',value:'bachelor',sourceLine:'فارغ‌التحصیل رشتهٔ حقوق'}]}),e=>e.status===404);
  assert.deepEqual(store.profile('alice'),{});
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});

test('a mapped field does not fill any other field and issuer-verified facts stay locked',()=>{
 const {dir,store}=dirStore();
 try{
  const doc=store.upload('alice',upload);
  const mapped=store.map('alice',doc.id,{fields:[{field:'degree',value:'bachelor',sourceLine:'فارغ‌التحصیل رشتهٔ حقوق'}]});
  // No implicit GPA, test or date is derived from a document that mentions them.
  assert.deepEqual(Object.keys(mapped),['degree']);
  assert.equal(mapped.gpa,undefined);
  assert.equal(mapped.languageTest,undefined);
  assert.equal(store.db.prepare('SELECT count(*) AS n FROM profile_history').get().n,1);
  store.db.prepare('UPDATE profiles SET data=? WHERE owner=?').run(JSON.stringify({degree:{value:'master',origin:'issuer_verified'}}),store.owner('alice'));
  assert.throws(()=>store.map('alice',doc.id,{fields:[{field:'degree',value:'doctorate',sourceLine:'فارغ‌التحصیل رشتهٔ حقوق'}]}),e=>e.status===409);
  assert.equal(store.profile('alice').degree.origin,'issuer_verified');
  // Deleting the document removes only facts that cite it.
  const doc2=store.upload('alice',{text:'دانشگاه هرات\nسند دوم',mime:'text/plain',consent:true});
  store.map('alice',doc2.id,{fields:[{field:'courseStart',value:'2026-03-01',sourceLine:'سند دوم'}]});
  store.db.prepare('UPDATE profiles SET data=? WHERE owner=?').run(JSON.stringify({degree:{value:'master',origin:'issuer_verified'}}),store.owner('alice'));
  store.delete('alice',doc2.id);
  assert.equal(store.profile('alice').courseStart,undefined);
  assert.equal(store.profile('alice').degree.origin,'issuer_verified');
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});

test('the mapping route is authenticated, owner-scoped and never calls a model',async()=>{
 const {dir,store}=dirStore();
 let calls=0;
 const server=createInferenceServer({projectId:'demo-bursyar',origin:'http://localhost',documents:store,quota:{reserve(){throw Error('must not reserve inference');}},infer:async()=>{calls++;},verify:async token=>({uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const request=(path,method='GET',body,token='alice')=>fetch(base+path,{method,headers:{origin:'http://localhost',...(token?{authorization:`Bearer ${token}`}:{}) ,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 try{
  const doc=await (await request('/api/documents','POST',upload)).json();
  assert.equal((await request(`/api/documents/${doc.id}/map`,'POST',{fields:[{field:'degree',value:'bachelor',sourceLine:'فارغ‌التحصیل رشتهٔ حقوق'}]},null)).status,401);
  assert.equal((await request(`/api/documents/${doc.id}/map`,'POST',{fields:[{field:'degree',value:'bachelor',sourceLine:'invented line'}]})).status,400);
  const response=await request(`/api/documents/${doc.id}/map`,'POST',{fields:[{field:'gpa',value:{gpa:3.4,scale:4},sourceLine:'معدل کل ۳٫۴ از ۴'}]});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal((await response.json()).gpa.sourceExcerpt,'معدل کل ۳٫۴ از ۴');
  assert.deepEqual(await (await request('/api/profile','GET',null,'bob')).json(),{});
  assert.equal(calls,0);
 }finally{await new Promise(resolve=>server.close(resolve));store.close();rmSync(dir,{recursive:true,force:true});}
});

test('the document UI renders the guided mapping as real, localised controls',()=>{
 const ui=readFileSync(new URL('../src/documents.js',import.meta.url),'utf8');
 assert.match(ui,/export function renderGuidedMapping\(/);
 for(const language of ['en','fa','ps'])assert.match(ui,new RegExp(`\\b${language}:\\{title:'[^']*'`));
 assert.match(ui,/sourceLine:item\.line\.value/);
 assert.match(ui,/pending\.get\(field\)/);
 assert.match(ui,/\/map`,'POST',\{fields\}/);
 assert.doesNotMatch(ui,/api\('\/api\/analyze'/);
});
