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

const stressMode=process.env.OCR_STRESS==='1';
async function runStress(cdp){
 const context=await browser.newContext();
 const page=await context.newPage();
 const requestedCores=new Set();
 let corrupt=false,spawned=0;
 const core='/vendor/ocr-v1/core/tesseract-core-lstm.wasm.js';
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  assert.equal(url.origin,origin,'stress request escaped loopback');
  if(url.pathname.includes('/core/'))requestedCores.add(url.pathname);
  if(corrupt&&url.pathname.endsWith('/eng.traineddata.gz'))return route.fulfill({body:'not-gzip'});
  return route.continue();
 });
 await page.route(origin+'/stress',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>OCR stress fixture</title>'}));
 await page.goto(origin+'/stress');
 const jsHeapLimit=await page.evaluate(()=>performance.memory?.jsHeapSizeLimit);
 assert.ok(jsHeapLimit>0&&jsHeapLimit<=128*1024*1024,'constrained V8 heap was not observed');
 page.on('worker',()=>spawned++);
 const rendererRss=async()=>{
  const value=(await sampleProcessRss(cdp)).renderer;
  assert.ok(Number.isFinite(value)&&value>0,'renderer RSS missing');
  return value;
 };
 const iteration=async index=>{
  corrupt=index%2===1;
  const before=spawned;
  const result=await page.evaluate(async corePath=>{
   const {extractDocumentText}=await import('/src/document-extraction.js');
   const {default:runtime}=await import('/src/ocr-runtime.js');
   const ocrLoader=async()=>({createWorker:(language,oem,options)=>runtime.createWorker(language,oem,{...options,corePath})});
   const canvas=document.createElement('canvas');canvas.width=360;canvas.height=90;
   const context=canvas.getContext('2d');context.fillStyle='white';context.fillRect(0,0,360,90);
   context.fillStyle='black';context.font='bold 38px sans-serif';context.fillText('OCR STRESS',15,57);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve));
   try{return (await extractDocumentText(new File([blob],'stress.png'),{ocrLoader,timeoutMs:4000})).text.trim();}
   catch(error){return error.code;}
  },core);
  assert.equal(result,corrupt?'extractionUnavailable':'OCR STRESS','iteration '+index);
  await expect.poll(()=>page.workers().length,{timeout:3000}).toBe(0);
  assert.ok(spawned>=before+2,'both worker layers must run on iteration '+index);
 };
 try{
  for(let index=0;index<4;index++)await iteration(index);
  const baseline=await rendererRss();
  let peak=baseline,peakAll=await sampleProcessRss(cdp),samples=0,sampling=false,pending=Promise.resolve();
  const sample=async()=>{
   const reading=await sampleProcessRss(cdp);
   assert.ok(reading.renderer>0,'renderer RSS missing during sampling');
   peak=Math.max(peak,reading.renderer);samples++;
   for(const [type,kib] of Object.entries(reading))peakAll[type]=Math.max(peakAll[type]??0,kib);
  };
  let sampleError;
  sampler=setInterval(()=>{
   if(sampling)return;
   sampling=true;pending=sample().catch(error=>{sampleError=error;}).finally(()=>{sampling=false;});
  },100);
  const started=performance.now(),idle=[];
  for(let index=0;index<24;index++){
   await iteration(index);
   // Leave time between attempts to observe settled RSS in the same renderer.
   await new Promise(resolve=>setTimeout(resolve,1250));
   idle.push(await rendererRss());
  }
  clearInterval(sampler);await pending;if(sampleError)throw sampleError;
  const durationMs=Math.round(performance.now()-started);
  const end=await rendererRss();peak=Math.max(peak,end,...idle);
  const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
  const drift=median(idle.slice(-6))-median(idle.slice(0,6));
  assert.ok(durationMs>=30000,'stress duration must cover at least 30 seconds');
  assert.ok(samples>=30,'insufficient RSS samples');
  assert.deepEqual([...requestedCores],[core],'exact non-SIMD core must be used');
  const peakGrowthLimit=192*1024,idleDriftLimit=32*1024;
  console.log('OCR-STRESS '+JSON.stringify({durationMs,iterations:24,failures:12,recoveries:12,jsHeapLimit,baseline,peak,end,peakAll,drift,peakGrowthLimit,idleDriftLimit,samples,spawned,remainingWorkers:page.workers().length}));
  assert.ok(peak-baseline<=peakGrowthLimit,'renderer RSS peak exceeded 192 MiB growth');
  assert.ok(drift<=idleDriftLimit,'median idle renderer RSS grew more than 32 MiB');
 }finally{clearInterval(sampler);await context.close();}
}

try{
 browser=await chromium.launch({headless:true,args:stressMode?['--js-flags=--max-old-space-size=64 --max-semi-space-size=4']:[]});
 const cdp=stressMode||process.env.OCR_MEASURE_RSS==='1'?await browser.newBrowserCDPSession():null;
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
 if(stressMode)await runStress(cdp);
}finally{clearInterval(sampler);await browser?.close();await vite.close();}
