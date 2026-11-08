// Real pinned runtime, synthetic pixels, stalled/failed nested assets; no models/inference online.
import {chromium,expect} from '@playwright/test';
import {createServer} from 'vite';
import {prepareLocalOcr} from '../scripts/prepare-local-ocr.mjs';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
prepareLocalOcr();
const vite=await createServer({server:{host:'127.0.0.1',port:0}});await vite.listen();
const origin='http://127.0.0.1:'+vite.httpServer.address().port;
let browser;
let sampler;
async function sampleProcessRss(cdp){
 const {processInfo}=await cdp.send('SystemInfo.getProcessInfo');
 // CDP reports PID-namespace IDs. /proc can expose host IDs, so map
 // only descendants of this test process via NSpid and host PPid.
 const field=(status,key)=>new RegExp('^'+key+':\\s+(.+)$','m').exec(status)?.[1];
 const self=await readFile('/proc/self/status','utf8');
 const ownHostPid=Number(field(self,'Pid'));
 const table=new Map();
 await Promise.all((await readdir('/proc')).filter(name=>/^\d+$/.test(name)).map(async name=>{
  try{
   const status=await readFile('/proc/'+name+'/status','utf8');
   const namespace=field(status,'NSpid')?.trim().split(/\s+/);
   table.set(Number(name),{parent:Number(field(status,'PPid')),id:Number(namespace?.at(-1)??name),kib:parseInt(field(status,'VmRSS')??'',10)});
  }catch(error){if(!['ENOENT','ESRCH','EACCES','EPERM'].includes(error.code))throw error;}
 }));
 const children=new Map();
 for(const row of table.values()){
  let parent=row.parent;
  while(parent&&parent!==ownHostPid)parent=table.get(parent)?.parent;
  if(parent===ownHostPid&&Number.isFinite(row.kib))children.set(row.id,row.kib);
 }
 const rows=processInfo.map(({id,type})=>children.has(id)?{type,kib:children.get(id)}:null);
 assert.ok(rows.some(row=>row?.type==='browser'),'Chromium browser PID not visible in /proc');
 const totals={};
 for(const row of rows.filter(Boolean))totals[row.type]=(totals[row.type]??0)+row.kib;
 return totals;
}

try{
 browser=await chromium.launch({headless:true});
 const cdp=process.env.OCR_MEASURE_RSS==='1'?await browser.newBrowserCDPSession():null;
 for(const mode of ['stalled-model','missing-model','corrupt-model','missing-wasm','concurrent','cancelled-model']){
  const context=await browser.newContext();const outside=[];let modelSeen;const modelRequested=new Promise(resolve=>{modelSeen=resolve;});
  await context.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin){outside.push(r.request().url());return r.abort();}return r.continue();});
  // Delay past the extraction deadline, then release to let teardown finish.
  if(mode==='stalled-model'||mode==='concurrent'||mode==='cancelled-model')await context.route('**/lang/eng.traineddata.gz',async r=>{modelSeen();await new Promise(resolve=>setTimeout(resolve,1600));try{await r.continue();}catch{}});
  if(mode==='missing-model')await context.route('**/lang/eng.traineddata.gz',r=>r.fulfill({status:404,body:'missing'}));
  if(mode==='corrupt-model')await context.route('**/lang/eng.traineddata.gz',r=>r.fulfill({body:'not-gzip'}));
  if(mode==='missing-wasm')await context.route('**/core/**',r=>r.fulfill({status:404,body:'missing'}));
  const page=await context.newPage();await page.route(origin+'/fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>synthetic OCR lifecycle</title>'}));
  await page.goto(origin+'/fixture');
  const baseline=cdp?await sampleProcessRss(cdp):null;
  const peak={...baseline};let sampled=0,pending=Promise.resolve(),sampleError;
  if(cdp)sampler=setInterval(()=>{
   pending=pending.then(async()=>{
    const reading=await sampleProcessRss(cdp);sampled++;
    for(const [type,kib] of Object.entries(reading))peak[type]=Math.max(peak[type]??0,kib);
   }).catch(error=>{sampleError=error;});
  },100);
  const spawned=[];page.on('worker',w=>spawned.push(w));
  const outcomeTask=page.evaluate(async(mode)=>{
   const {extractDocumentText}=await import('/src/document-extraction.js');
   const c=document.createElement('canvas');c.width=100;c.height=40;c.getContext('2d').fillText('TEST',5,20);
   const blob=await new Promise(r=>c.toBlob(r));
   const controller=new AbortController();globalThis.syntheticExtractionController=controller;
   const extract=async()=>{try{await extractDocumentText(new File([blob],'synthetic.png'),{timeoutMs:mode==='cancelled-model'?10000:1000,signal:controller.signal});return 'unexpected_success';}catch(e){return e.code;}};
   return mode==='concurrent'?Promise.all([extract(),extract()]):extract();
  },mode);
  if(mode==='cancelled-model'){await modelRequested;await page.evaluate(()=>globalThis.syntheticExtractionController.abort());}
  const outcome=await outcomeTask;
  if(mode==='concurrent')assert.deepEqual([...outcome].sort(),['extractionBusy','extractionUnavailable'].sort());else assert.equal(outcome,'extractionUnavailable');
  // A successful cleanup must close the runtime host AND any native OCR child.
  await expect.poll(()=>page.workers().length,{timeout:2000}).toBe(0);
  assert.equal(page.workers().length,0,`${mode}: workers still alive (${page.workers().map(w=>w.url()).join(',')})`);
  assert.ok(spawned.length>0,'must exercise real workers');
  if(mode==='concurrent')assert.equal(spawned.filter(w=>w.url().includes('ocr-host.worker')).length,1,'only one OCR host may exist');assert.deepEqual(outside,[]);
  if(mode==='corrupt-model'){
   for(let retry=0;retry<2;retry++){
    const result=await page.evaluate(async()=>{
     const {extractDocumentText}=await import('/src/document-extraction.js');
     const canvas=document.createElement('canvas');canvas.width=100;canvas.height=40;
     const blob=await new Promise(resolve=>canvas.toBlob(resolve));
     try{await extractDocumentText(new File([blob],'retry.png'),{timeoutMs:1000});}
     catch(error){return error.code;}
    });
    assert.equal(result,'extractionUnavailable');
    await expect.poll(()=>page.workers().length,{timeout:2000}).toBe(0);
   }
   assert.ok(spawned.length>=3,'all three retries must exercise a worker');
  }
  clearInterval(sampler);await pending;if(sampleError)throw sampleError;
  if(cdp)console.log('RSS '+JSON.stringify({mode,baseline,peak,end:await sampleProcessRss(cdp),sampled,workerTargets:spawned.length}));
  console.log('PASS '+mode+'; '+spawned.length+' worker(s) observed, 0 remain');await context.close();
 }
}finally{clearInterval(sampler);await browser?.close();await vite.close();}
