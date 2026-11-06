// Same-origin real Web Locks; held reads/mock PDF parser isolate coordination,
// not recognition quality. No identity, document persistence or off-origin I/O.
import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
const server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;let browser;
try{
 browser=await chromium.launch({headless:true});const context=await browser.newContext();const external=[];
 await context.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin){external.push(r.request().url());return r.abort();}return r.continue();});
 await context.route(origin+'/fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic coordination</title>'}));
 const first=await context.newPage(),second=await context.newPage();await first.goto(origin+'/fixture');await second.goto(origin+'/fixture');
 await first.evaluate(async()=>{const {extractDocumentText}=await import('/src/document-extraction.js');globalThis.held=extractDocumentText({name:'held.pdf',size:10,arrayBuffer:()=>new Promise(()=>{})},{timeoutMs:5000}).catch(e=>e.code);});
 await second.waitForFunction(async()=>(await navigator.locks.query()).held.some(l=>l.name==='bursyar.binary-document'),null,{timeout:1500});
 const held=await second.evaluate(async()=>{const state=await navigator.locks.query();return state.held.some(l=>l.name==='bursyar.binary-document');});
 assert.equal(held,true,'binary lease must be visible across tabs');
 const blocked=await second.evaluate(async()=>{
  const {extractDocumentText}=await import('/src/document-extraction.js');let reads=0;
  try{await extractDocumentText({name:'blocked.pdf',size:10,arrayBuffer:async()=>{reads++;return new TextEncoder().encode('%PDF-').buffer;}});return {result:'unexpected_success',reads};}catch(e){return {result:e.code,reads};}
 });assert.deepEqual(blocked,{result:'extractionBusy',reads:0});console.log('PASS cross-tab contention refuses before reading binary bytes');
 const txt=await second.evaluate(async()=>{const {extractDocumentText}=await import('/src/document-extraction.js');return (await extractDocumentText(new File(['SYNTHETIC TXT'],'text.txt'))).text;});assert.equal(txt,'SYNTHETIC TXT');console.log('PASS TXT remains available during binary contention');
 await first.close();await second.waitForFunction(async()=>!(await navigator.locks.query()).held.some(l=>l.name==='bursyar.binary-document'),null,{timeout:1500});
 const recovered=await second.evaluate(async()=>{
  const {extractDocumentText}=await import('/src/document-extraction.js');
  const pdfLoader=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({numPages:1,getPage:async()=>({getTextContent:async()=>({items:[{str:'RECOVERED'}]}),cleanup(){}}),destroy(){}})})});
  return (await extractDocumentText(new File(['%PDF-synthetic'],'synthetic.pdf'),{pdfLoader})).text;
 });assert.equal(recovered,'RECOVERED');console.log('PASS closing owner tab releases the lease for recovery');
 const timed=await second.evaluate(async()=>{const {extractDocumentText}=await import('/src/document-extraction.js');try{await extractDocumentText({name:'wait.pdf',size:10,arrayBuffer:()=>new Promise(()=>{})},{timeoutMs:20});}catch(e){return e.code;}});assert.equal(timed,'extractionUnavailable');
 await second.waitForFunction(async()=>!(await navigator.locks.query()).held.some(l=>l.name==='bursyar.binary-document'),null,{timeout:1500});
 assert.equal(await second.evaluate(async()=>!(await navigator.locks.query()).held.some(l=>l.name==='bursyar.binary-document')),true);console.log('PASS timeout releases binary lease');
 await second.evaluate(()=>Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}));
 const unsupported=await second.evaluate(async()=>{const {extractDocumentText}=await import('/src/document-extraction.js');let reads=0;try{await extractDocumentText({name:'unsupported.pdf',size:10,arrayBuffer:()=>{reads++;}});}catch(e){return {result:e.code,reads};}});
 assert.deepEqual(unsupported,{result:'extractionUnavailable',reads:0});assert.deepEqual(external,[]);console.log('PASS unsupported coordination fails closed; zero external requests');
}finally{await browser?.close();await server.close();}
