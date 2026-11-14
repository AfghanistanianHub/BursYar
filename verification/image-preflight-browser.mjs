// Actual browser decoding, synthetic pixels, mocked OCR, zero network/model calls.
import {chromium} from '@playwright/test';
import {deflateSync,crc32} from 'node:zlib';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
const progressive='/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wgARCAAIABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/aAAwDAQACEAMQAAABng0//8QAFBABAAAAAAAAAAAAAAAAAAAAEP/aAAgBAQABBQI//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAEP/aAAgBAQAGPwI//8QAFBABAAAAAAAAAAAAAAAAAAAAEP/aAAgBAQABPyE//9oADAMBAAIAAwAAABD/AP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Qf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Qf//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QP//Z';
const data=Buffer.concat([Buffer.from('SYNTHETIC\0\0'),deflateSync(Buffer.alloc(16*1024*1024,65))]);const length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);const typed=Buffer.concat([Buffer.from('iCCP'),data]);crc.writeUInt32BE(crc32(typed));const metadata=[...Buffer.concat([length,typed,crc])];
const vite=await createServer({server:{host:'127.0.0.1',port:0}});await vite.listen();
const origin='http://127.0.0.1:'+vite.httpServer.address().port;let browser;const external=[];
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage();
 await page.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin){external.push(r.request().url());return r.abort();}return r.continue();});
 await page.route(origin+'/image-fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic image preflight</title>'}));
 await page.goto(origin+'/image-fixture');
 for(const kind of ['png','jpeg','progressive','huge-png','huge-jpeg','compressed-metadata']){
  const result=await page.evaluate(async({kind,progressive,metadata})=>{
   const {extractDocumentText}=await import('/src/document-extraction.js');
   const native=window.createImageBitmap;let decoded=0,ocr=0;
   window.createImageBitmap=(...args)=>{decoded++;return native(...args);};
   try{
    const c=document.createElement('canvas');c.width=16;c.height=8;c.getContext('2d').fillRect(0,0,16,8);
    const jpeg=kind.includes('jpeg')||kind==='progressive';
    const blob=await new Promise(resolve=>c.toBlob(resolve,jpeg?'image/jpeg':'image/png'));
    let bytes=kind==='progressive'?Uint8Array.from(atob(progressive),x=>x.charCodeAt(0)):new Uint8Array(await blob.arrayBuffer());
    if(kind==='compressed-metadata')bytes=Uint8Array.from([...bytes.slice(0,33),...metadata,...bytes.slice(33)]);
    if(kind==='huge-png'){bytes[16]=0;bytes[17]=0;bytes[18]=19;bytes[19]=136;}
    if(kind==='huge-jpeg'){
     let p=2;
     while(p<bytes.length){if(bytes[p]!==255)throw Error('fixture marker');const marker=bytes[p+1];if(marker===192||marker===194){bytes[p+7]=19;bytes[p+8]=136;break;}p+=2+bytes[p+2]*256+bytes[p+3];}
    }
    let outcome;
    try{outcome=await extractDocumentText(new File([bytes],jpeg?'fixture.jpg':'fixture.png'),{ocrLoader:async()=>({createWorker:async()=>({recognize:async()=>{ocr++;return {data:{text:'Degree: master'}};},terminate:async()=>{}})})});}
    catch(error){outcome={error:error.code};}
    return {outcome,decoded,ocr};
   }finally{window.createImageBitmap=native;}
  },{kind,progressive,metadata});
  if(kind==='compressed-metadata'){assert.equal(result.outcome.error,'invalidImage');assert.equal(result.decoded,0);assert.equal(result.ocr,0);}
  else if(kind.startsWith('huge-')){assert.equal(result.outcome.error,'imageDimensions');assert.equal(result.decoded,0);assert.equal(result.ocr,0);}
  else{assert.equal(result.outcome.text,'Degree: master');assert.equal(result.decoded,1);assert.equal(result.ocr,1);}
  console.log('PASS image preflight '+kind);
 }
 assert.deepEqual(external,[]);console.log('PASS zero external requests; OCR mocked, not validated');
}finally{await browser?.close();await vite.close();}
