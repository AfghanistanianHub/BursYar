// Real pinned runtime, synthetic pixels, stalled/failed nested assets; no models/inference online.
import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {prepareLocalOcr} from '../scripts/prepare-local-ocr.mjs';
import assert from 'node:assert/strict';
prepareLocalOcr();
const vite=await createServer({server:{host:'127.0.0.1',port:0}});await vite.listen();
const origin='http://127.0.0.1:'+vite.httpServer.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const mode of ['stalled-model','missing-model','corrupt-model','missing-wasm','concurrent']){
  const context=await browser.newContext();const outside=[];
  await context.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin){outside.push(r.request().url());return r.abort();}return r.continue();});
  // Delay past the extraction deadline, then release to let teardown finish.
  if(mode==='stalled-model'||mode==='concurrent')await context.route('**/lang/eng.traineddata.gz',async r=>{await new Promise(resolve=>setTimeout(resolve,1600));try{await r.continue();}catch{}});
  if(mode==='missing-model')await context.route('**/lang/eng.traineddata.gz',r=>r.fulfill({status:404,body:'missing'}));
  if(mode==='corrupt-model')await context.route('**/lang/eng.traineddata.gz',r=>r.fulfill({body:'not-gzip'}));
  if(mode==='missing-wasm')await context.route('**/core/**',r=>r.fulfill({status:404,body:'missing'}));
  const page=await context.newPage();await page.route(origin+'/fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>synthetic OCR lifecycle</title>'}));
  await page.goto(origin+'/fixture');
  const spawned=[];page.on('worker',w=>spawned.push(w));
  const outcome=await page.evaluate(async(mode)=>{
   const {extractDocumentText}=await import('/src/document-extraction.js');
   const c=document.createElement('canvas');c.width=100;c.height=40;c.getContext('2d').fillText('TEST',5,20);
   const blob=await new Promise(r=>c.toBlob(r));
   const extract=async()=>{try{await extractDocumentText(new File([blob],'synthetic.png'),{timeoutMs:1000});return 'unexpected_success';}catch(e){return e.code;}};
   return mode==='concurrent'?Promise.all([extract(),extract()]):extract();
  },mode);
  if(mode==='concurrent')assert.deepEqual(outcome,['extractionUnavailable','extractionUnavailable']);else assert.equal(outcome,'extractionUnavailable');
  // A successful cleanup must close the runtime host AND any native OCR child.
  await page.waitForTimeout(150);
  assert.equal(page.workers().length,0,`${mode}: workers still alive (${page.workers().map(w=>w.url()).join(',')})`);
  assert.ok(spawned.length>0,'must exercise real workers');
  if(mode==='concurrent')assert.equal(spawned.filter(w=>w.url().includes('ocr-host.worker')).length,1,'only one OCR host may exist');assert.deepEqual(outside,[]);
  console.log('PASS '+mode+'; '+spawned.length+' worker(s) observed, 0 remain');await context.close();
 }
}finally{await browser?.close();await vite.close();}
