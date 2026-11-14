import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {preview} from 'vite';
import {chromium} from '@playwright/test';
import {createInferenceServer} from '../engine/http.js';
import {DocumentStore} from '../engine/documents.js';
import {createScholarshipCatalog} from '../engine/deterministic.js';
import {localProgram} from './fixtures/local-program.mjs';
const dir=mkdtempSync(join(tmpdir(),'bursyar-preview-'));
const documents=new DocumentStore(join(dir,'test.db'));
const proxy={target:'http://127.0.0.1',configure(server){
 const forward=server.web.bind(server);
 server.web=(request,response,options)=>forward(request,response,{
  ...options,target:'http://127.0.0.1:'+api.address().port
 });
}};
const site=await preview({configFile:false,preview:{host:'127.0.0.1',port:0,proxy:{'/api':proxy,'/health':proxy}}});
const origin='http://127.0.0.1:'+site.httpServer.address().port;
const api=createInferenceServer({
 projectId:'demo-bursyar',origin,documents,catalog:createScholarshipCatalog([localProgram]),
 verify:async token=>({uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true}),
 quota:{reserve(){throw Error('Inference disabled');}},infer:async()=>{throw Error('Inference disabled');}
});
let browser;
try{
 await new Promise((resolve,reject)=>api.once('error',reject).listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch();
 const page=await browser.newPage();
 const unexpected=[];
 await page.route('**/*',route=>{
  if(new URL(route.request().url()).origin===origin)return route.continue();
  unexpected.push(route.request().url());return route.abort();
 });
 const start=await page.goto(origin);
 assert.equal(start.status(),200);
 const result=await page.evaluate(async ()=>{
  const send=async(path,method='GET',body,token='student-a')=>{
   const headers=token?{authorization:'Bearer '+token}:{};
   if(body)headers['content-type']='application/json';
   const response=await fetch(path,{method,headers,body:body&&JSON.stringify(body)});
   return {status:response.status,data:await response.json()};
  };
  const health=await send('/health');
  const anonymous=await send('/api/profile','GET',undefined,'');
  const saved=await send('/api/profile','PUT',{consent:true,values:{degree:'bachelor'}});
  const upload=await send('/api/documents','POST',{consent:true,mime:'text/plain',text:'SYNTHETIC PREVIEW TEST\nDegree: bachelor'});
  const other=await send('/api/documents/'+upload.data.id,'GET',undefined,'student-b');
  const evaluation=await send('/api/evaluate','POST',{scholarshipId:'synthetic-local-test'});
  const exported=await send('/api/export');
  const erased=await send('/api/erase','DELETE');
  const after=await send('/api/export');
  return {health,anonymous,saved,upload,other,evaluation,exported,erased,after};
 });
 assert.equal(result.health.status,200);
 assert.equal(result.anonymous.status,401);
 assert.equal(result.saved.data.degree.value,'bachelor');
 assert.equal(result.upload.status,201);
 assert.equal(result.other.status,404);
 assert.equal(result.evaluation.data.summary,'met');
 assert.equal(result.exported.data.documents.length,1);
 assert.equal(result.erased.data.deleted,true);
 assert.deepEqual(result.after.data.profile,{});
 assert.deepEqual(result.after.data.documents,[]);
 assert.deepEqual(unexpected,[]);
 console.log('PASS built frontend and same-origin proxy: health, auth gate, profile, upload, isolation, assessment, export, erase');
}finally{
 await browser?.close();
 if(api.listening)await new Promise(resolve=>api.close(resolve));
 await new Promise(resolve=>site.httpServer.close(resolve));
 documents.close();
 rmSync(dir,{recursive:true,force:true});
}
