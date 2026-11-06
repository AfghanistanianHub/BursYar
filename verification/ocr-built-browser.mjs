// Test built worker packaging directly with synthetic text, independently of
// the production UI/extractor gate, which must continue refusing all binaries.
import {chromium} from '@playwright/test';
import {preview} from 'vite';
import {readdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const runtime=readdirSync(new URL('../dist/assets/',import.meta.url)).find(p=>/^ocr-runtime-.*\.js$/.test(p));
assert.ok(runtime,'run npm run build first');
const server=await preview({preview:{host:'127.0.0.1',port:0}}),origin='http://127.0.0.1:'+server.httpServer.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});const context=await browser.newContext();const outside=[];
 await context.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin){outside.push(r.request().url());return r.abort();}return r.continue();});
 const page=await context.newPage();await page.route(origin+'/fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic built OCR</title>'}));await page.goto(origin+'/fixture');
 const text=await page.evaluate(async runtime=>{
  const {default:api}=await import('/assets/'+runtime);
  const worker=await api.createWorker('eng',1,{workerPath:'/vendor/ocr-v1/tesseract/worker.min.js',corePath:'/vendor/ocr-v1/core',langPath:'/vendor/ocr-v1/lang',workerBlobURL:false,cacheMethod:'none',gzip:true});
  try{
   const c=document.createElement('canvas');c.width=600;c.height=100;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,600,100);g.fillStyle='#000';g.font='40px sans-serif';g.fillText('SYNTHETIC BUILD TEST',20,65);
   return (await worker.recognize(c,{}, {text:true,blocks:false,hocr:false,tsv:false})).data.text;
  }finally{await worker.terminate();}
 },runtime);
 assert.match(text,/SYNTHETIC BUILD TEST/);await page.waitForTimeout(100);assert.equal(page.workers().length,0);assert.deepEqual(outside,[]);
 console.log('PASS built local OCR; synthetic English recognized; 0 workers remain; 0 external requests');
}finally{await browser?.close();await new Promise(resolve=>server.httpServer.close(resolve));}
