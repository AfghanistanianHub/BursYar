import test from 'node:test';
import assert from 'node:assert/strict';
import {extractDocumentText} from '../src/document-extraction.js';
const file=(name,bytes,advertisedSize)=>({name,size:advertisedSize??bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer});
const txt=(name,text)=>file(name,new TextEncoder().encode(text));
const pdf=(text='hello')=>file('transcript.pdf',new TextEncoder().encode('%PDF-'+text));
const png=file('scan.png',[137,80,78,71,13,10,26,10,0,0]);
test('TXT extraction preserves multilingual input and rejects forged file signatures',async()=>{
 assert.deepEqual(await extractDocumentText(txt('TRANSCRIPT.TXT','Degree: bachelor\nفارسی')),{text:'Degree: bachelor\nفارسی',method:'utf8_text'});
 await assert.rejects(()=>extractDocumentText(txt('wrong.pdf','not a PDF')),e=>e.code==='invalidPdf');
 await assert.rejects(()=>extractDocumentText(txt('wrong.png','not an image')),e=>e.code==='invalidImage');
 await assert.rejects(()=>extractDocumentText(txt('malware.svg','<svg/>')),e=>e.code==='unsupportedFile');
 await assert.rejects(()=>extractDocumentText(txt('empty.txt',' ')),e=>e.code==='emptyFile');
 await assert.rejects(()=>extractDocumentText(txt('large.txt','A'.repeat(12001))),e=>e.code==='fileTooLarge');
 const falseSize=txt('oversize.txt','x'.repeat(12001));falseSize.size=1;
 await assert.rejects(()=>extractDocumentText(falseSize),e=>e.code==='fileTooLarge');
});
test('PDF readable text remains bounded and does not require OCR or contact inference',async()=>{
 let destroyed=false,ocrCalls=0;
 const pdfLoader=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({
  numPages:1,
  getPage:async()=>({getTextContent:async()=>({items:[{str:'Degree: bachelor',hasEOL:true},{str:'GPA: 3.7/4',hasEOL:false}]}),cleanup:()=>{}}),
  destroy:async()=>{destroyed=true}
 })})});
 const result=await extractDocumentText(pdf('fake fixture'),{pdfLoader,ocrLoader:async()=>{ocrCalls++;throw Error('OCR must not run')}});
 assert.equal(result.text,'Degree: bachelor\nGPA: 3.7/4');
 assert.equal(result.method,'local_pdf_text_or_ocr');
 assert.equal(ocrCalls,0);assert.equal(destroyed,true);
});
test('PDF page limits and malformed PDF fail before saving',async()=>{
 await assert.rejects(()=>extractDocumentText(pdf(),{pdfLoader:async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({numPages:6,destroy:async()=>{}})})})}),e=>e.code==='pdfPageLimit');
 await assert.rejects(()=>extractDocumentText(pdf(),{pdfLoader:async()=>{throw Error('offline')}}),e=>e.code==='extractionUnavailable');
});
test('OCR is local-only, bounded, worker is terminated on success and failure',async()=>{
 const old=globalThis.createImageBitmap;let terminated=0;
 globalThis.createImageBitmap=async()=>({width:100,height:100,close:()=>{}});
 try{
  const ocrLoader=async()=>({createWorker:async()=>({recognize:async()=>({data:{text:'Degree: master'}}),terminate:async()=>{terminated++}})});
  assert.deepEqual(await extractDocumentText(png,{ocrLoader}),{text:'Degree: master',method:'local_image_ocr'});
  assert.equal(terminated,1);
  await assert.rejects(()=>extractDocumentText(png,{ocrLoader:async()=>({createWorker:async()=>({recognize:async()=>({data:{text:' '.repeat(10)}}),terminate:async()=>{terminated++}})})}),e=>e.code==='emptyFile');
  assert.equal(terminated,2);
  globalThis.createImageBitmap=async()=>({width:7000,height:5000,close:()=>{}});
  await assert.rejects(()=>extractDocumentText(png,{ocrLoader}),e=>e.code==='imageDimensions');
 }finally{if(old===undefined)delete globalThis.createImageBitmap;else globalThis.createImageBitmap=old;}
});