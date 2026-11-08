import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractDocumentText} from '../src/document-extraction.js';
const file=(name,bytes,advertisedSize)=>({name,size:advertisedSize??bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer});
const txt=(name,text)=>file(name,new TextEncoder().encode(text));
const pdf=(text='hello')=>file('transcript.pdf',new TextEncoder().encode('%PDF-'+text));
// Synthetic static 100×100 PNG with valid IHDR/IDAT/IEND and CRCs.
const png=file('scan.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAA/UlEQVR4nO3RMQ0AMAzAsPIn3d5DsBw2gkiZJWV+B/AyJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQmAP4K6zWNUjE4wAAAABJRU5ErkJggg==','base64'));
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
 const pdfLoader=async()=>({
  GlobalWorkerOptions:{},
  getDocument:options=>{
   assert.equal(options.enableScripting,false);
   assert.equal(options.isEvalSupported,false);
   return {promise:Promise.resolve({
    numPages:1,
    getPage:async()=>({getTextContent:async()=>({items:[{str:'Degree: bachelor',hasEOL:true},{str:'GPA: 3.7/4',hasEOL:false}]}),cleanup:()=>{}}),
    destroy:async()=>{destroyed=true}
   })};
  }
 });
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

test('scanned PDF pages use bounded local OCR in the selected language and always release resources',async()=>{
 const priorDocument=globalThis.document;
 let terminated=0,destroyed=0,ocrLanguage=null,ocrInput=null,cleanup=0;
 globalThis.document={createElement:()=>({
  width:0,height:0,
  getContext:()=>({canvasMock:true})
 })};
 const pdfLoader=async()=>({
  GlobalWorkerOptions:{},
  getDocument:()=>({promise:Promise.resolve({
   numPages:2,
   getPage:async index=>({
    getTextContent:async()=>({items:index===1?[{str:'Degree: master'}]:[]}),
    getViewport:()=>({width:500,height:700}),
    render:()=>({promise:Promise.resolve()}),
    cleanup:()=>{cleanup++}
   }),
   destroy:async()=>{destroyed++}
  })})
 });
 const ocrLoader=async()=>({createWorker:async language=>{
  ocrLanguage=language;
  return {recognize:async input=>{ocrInput=input;return {data:{text:'GPA: 4.2/5'}}},terminate:async()=>{terminated++}};
 }});
 try{
  const result=await extractDocumentText(pdf('synthetic'),{pdfLoader,ocrLoader,ocrLanguage:'pus'});
  assert.deepEqual(result,{text:'Degree: master\nGPA: 4.2/5',method:'local_pdf_text_or_ocr'});
  assert.equal(ocrLanguage,'pus');
  assert.ok(ocrInput);
  assert.equal(terminated,1);
  assert.equal(destroyed,1);
  assert.equal(cleanup,2);
 }finally{
  if(priorDocument===undefined)delete globalThis.document;else globalThis.document=priorDocument;
 }
});
test('M20 OCR loader accepts the real tesseract ESM shape (default export)',async()=>{
 // Mission 19 P0: tesseract.esm.min.js exports {default:{createWorker}},
 // not {createWorker}. Mocks assuming the wrong shape masked the failure.
 const realShapeLoader=async()=>({default:{createWorker:async()=>({recognize:async()=>({data:{text:'Degree: bachelor'}}),terminate:async()=>{}})  }});
 const priorBitmap=globalThis.createImageBitmap,priorBlob=globalThis.Blob;
 globalThis.createImageBitmap=async()=>({width:100,height:100,close(){}});
 globalThis.Blob=class Blob{constructor(parts){this.parts=parts;}};
 try{
  assert.deepEqual(await extractDocumentText(png,{ocrLoader:realShapeLoader}),{text:'Degree: bachelor',method:'local_image_ocr'});
  const legacyLoader=async()=>({createWorker:async()=>({recognize:async()=>({data:{text:'GPA: 3.4/4'}}),terminate:async()=>{}})});
  assert.deepEqual(await extractDocumentText(png,{ocrLoader:legacyLoader}),{text:'GPA: 3.4/4',method:'local_image_ocr'});
  await assert.rejects(()=>extractDocumentText(png,{ocrLoader:async()=>({})}),e=>e.code==='extractionUnavailable');
 }finally{
  if(priorBitmap===undefined)delete globalThis.createImageBitmap;else globalThis.createImageBitmap=priorBitmap;
  if(priorBlob===undefined)delete globalThis.Blob;else globalThis.Blob=priorBlob;
 }
});
test('M20 scanned-page render/OCR failures report unavailable, never invalid PDF',async()=>{
 const priorDocument=globalThis.document;
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({})})};
 const failingRender=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({
  numPages:1,
  getPage:async()=>({getViewport:()=>({width:100,height:100}),getTextContent:async()=>({items:[]}),render:()=>({promise:Promise.reject(Error('render crash'))}),cleanup(){}}),
  destroy:async()=>{}
 })})});
 const ocrLoader=async()=>({default:{createWorker:async()=>({recognize:async()=>({data:{text:'x'}}),terminate:async()=>{}})}});
 try{
  await assert.rejects(()=>extractDocumentText(pdf('x'),{pdfLoader:failingRender,ocrLoader}),e=>e.code==='extractionUnavailable');
  const failingOcr=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({
   numPages:1,
   getPage:async()=>({getViewport:()=>({width:100,height:100}),getTextContent:async()=>({items:[]}),render:()=>({promise:Promise.resolve()}),cleanup(){}}),
   destroy:async()=>{}
  })})});
  const badOcr=async()=>({default:{createWorker:async()=>({recognize:async()=>{throw Error('ocr down')},terminate:async()=>{}})}});
  await assert.rejects(()=>extractDocumentText(pdf('x'),{pdfLoader:failingOcr,ocrLoader:badOcr}),e=>e.code==='extractionUnavailable');
 }finally{
  if(priorDocument===undefined)delete globalThis.document;else globalThis.document=priorDocument;
 }
});
test('M20 vendor exceptions with numeric codes map to honest failures, never raw rethrow',async()=>{
 // pdf.js PasswordException carries numeric code=1; rethrowing it raw
 // showed a misleading generic error instead of invalidPdf.
 const passwordLoader=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.reject(Object.assign(Error('No password given'),{code:1,name:'PasswordException'}))})});
 await assert.rejects(()=>extractDocumentText(pdf('x'),{pdfLoader:passwordLoader}),e=>e.code==='invalidPdf');
});
test('unsupported OCR locale and malformed binary fail without loading third-party code',async()=>{
 let imported=0;
 const pdfLoader=async()=>{imported++;throw Error('unexpected network call')};
 const ocrLoader=async()=>{imported++;throw Error('unexpected network call')};
 await assert.rejects(()=>extractDocumentText(pdf(),{pdfLoader,ocrLoader,ocrLanguage:'invalid'}),e=>e.code==='unsupportedOcrLanguage');
 await assert.rejects(()=>extractDocumentText(txt('bad.pdf','not-pdf'),{pdfLoader,ocrLoader}),e=>e.code==='invalidPdf');
 await assert.rejects(()=>extractDocumentText(txt('bad.jpg','not-jpeg'),{pdfLoader,ocrLoader}),e=>e.code==='invalidImage');
 assert.equal(imported,0);
});
test('document extraction loads code only from pinned reviewed origins (Issue #88)',()=>{
 // Change detector: any new or re-pinned third-party code URL requires an
 // explicit security review that updates this allowlist alongside the gate
 // tests. Production never imports these (TXT-only gate); local and CI
 // synthetic runs may, from these exact pinned files only.
 const source=readFileSync(new URL('../src/document-extraction.js',import.meta.url),'utf8');
 const urls=[...new Set([...source.matchAll(/https:\/\/[^\s'")]+/g)].map(m=>m[0]))].sort();
 assert.deepEqual(urls,[]);
});

test('failed PDF loading destroys the loading task',async()=>{
 let destroyed=0;
 const pdfLoader=async()=>({GlobalWorkerOptions:{},getDocument:()=>({
  promise:Promise.reject(Error('malformed PDF')),destroy:async()=>{destroyed++;}
 })});
 await assert.rejects(()=>extractDocumentText(pdf(),{pdfLoader}),e=>e.code==='invalidPdf');
 assert.equal(destroyed,1);
});

test('scanned PDF OCR failure clears canvas memory and cleans the page',async()=>{
 const prior=globalThis.document;
 const canvas={width:0,height:0,getContext:()=>({})};let cleaned=0;
 globalThis.document={createElement:()=>canvas};
 const pdfLoader=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({
  numPages:1,getPage:async()=>({getTextContent:async()=>({items:[]}),getViewport:()=>({width:500,height:700}),render:()=>({promise:Promise.resolve()}),cleanup:()=>{cleaned++;}}),destroy:async()=>{}
 })})});
 try{
  await assert.rejects(()=>extractDocumentText(pdf(),{pdfLoader,ocrLoader:async()=>({createWorker:async()=>({recognize:async()=>{throw Error('OCR failure')},terminate:async()=>{}})})}),e=>e.code==='extractionUnavailable');
  assert.equal(canvas.width,0);assert.equal(canvas.height,0);assert.equal(cleaned,1);
 }finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior;}
});

const pending=()=>new Promise(()=>{});
async function extractionOutcome(operation){
 let timer;
 try{return await Promise.race([operation.then(()=> 'unexpected_success',e=>e.code),new Promise(resolve=>{timer=setTimeout(()=>resolve('unbounded'),250);})]);}
 finally{clearTimeout(timer);}
}
test('local PDF module loading has a bounded deadline',async()=>{
 assert.equal(await extractionOutcome(extractDocumentText(pdf(),{pdfLoader:pending,timeoutMs:10})),'extractionUnavailable');
});
test('a stalled PDF load is destroyed on deadline',async()=>{
 let destroyed=0;
 const pdfLoader=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:pending(),destroy:async()=>{destroyed++;}})});
 assert.equal(await extractionOutcome(extractDocumentText(pdf(),{pdfLoader,timeoutMs:10})),'extractionUnavailable');
 assert.equal(destroyed,1);
});
test('stalled image OCR terminates its worker and closes the bitmap',async()=>{
 const prior=globalThis.createImageBitmap;let closed=0,terminated=0;
 globalThis.createImageBitmap=async()=>({width:100,height:100,close(){closed++;}});
 try{
  const ocrLoader=async()=>({createWorker:async()=>({recognize:pending,terminate:async()=>{terminated++;}})});
  assert.equal(await extractionOutcome(extractDocumentText(png,{ocrLoader,timeoutMs:10})),'extractionUnavailable');
  assert.equal(closed,1);assert.equal(terminated,1);
 }finally{if(prior===undefined)delete globalThis.createImageBitmap;else globalThis.createImageBitmap=prior;}
});
test('OCR worker arriving after deadline is terminated without recognition',async()=>{
 const prior=globalThis.createImageBitmap;let resolveWorker,terminated=0,recognized=0;
 globalThis.createImageBitmap=async()=>({width:100,height:100,close(){}});
 const workerPromise=new Promise(resolve=>{resolveWorker=resolve;});
 try{
  const result=await extractionOutcome(extractDocumentText(png,{ocrLoader:async()=>({createWorker:()=>workerPromise}),timeoutMs:10}));
  resolveWorker({recognize:async()=>{recognized++;return {data:{text:'Degree: master'}};},terminate:async()=>{terminated++;}});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(result,'extractionUnavailable');assert.equal(terminated,1);assert.equal(recognized,0);
 }finally{if(prior===undefined)delete globalThis.createImageBitmap;else globalThis.createImageBitmap=prior;}
});
test('scanned PDFs reject excessively narrow/tall pages before allocating a canvas',async()=>{
 const prior=globalThis.document;let allocated=0;
 globalThis.document={createElement:()=>{allocated++;throw Error('must not allocate');}};
 try{
  const pdfLoader=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({numPages:1,getPage:async()=>({getTextContent:async()=>({items:[]}),getViewport:()=>({width:1,height:100000}),cleanup(){}}),destroy:async()=>{}})})});
  await assert.rejects(()=>extractDocumentText(pdf(),{pdfLoader}),e=>e.code==='imageDimensions');
  assert.equal(allocated,0);
 }finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior;}
});

test('successful PDF stages share one cumulative extraction budget',async()=>{
 let destroyed=0;
 const pdfLoader=async()=>{
  await new Promise(resolve=>setTimeout(resolve,60));
  return {GlobalWorkerOptions:{},getDocument:()=>({promise:new Promise(resolve=>setTimeout(()=>resolve({numPages:1,getPage:async()=>({getTextContent:async()=>({items:[{str:'Degree: master'}]}),cleanup(){}}),destroy:async()=>{destroyed++;}}),60)),destroy:async()=>{destroyed++;}})};
 };
 assert.equal(await extractionOutcome(extractDocumentText(pdf(),{pdfLoader,timeoutMs:100})),'extractionUnavailable');
 assert.equal(destroyed,1);
});
test('bitmap arriving after deadline is closed and never passed to OCR',async(t)=>{
 // Freeze only Date during microtask setup; the real deadline timer still fires.
 // CPU preemption while other test files compile WASM must not skip decoding.
 const started=Date.now();t.mock.method(Date,'now',()=>started);
 const prior=globalThis.createImageBitmap;let resolveBitmap,closed=0,ocrCalls=0;
 globalThis.createImageBitmap=()=>new Promise(resolve=>{resolveBitmap=resolve;});
 try{
  const result=await extractionOutcome(extractDocumentText(png,{ocrLoader:async()=>{ocrCalls++;},timeoutMs:10}));
  resolveBitmap({width:100,height:100,close(){closed++;}});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(result,'extractionUnavailable');assert.equal(closed,1);assert.equal(ocrCalls,0);
 }finally{if(prior===undefined)delete globalThis.createImageBitmap;else globalThis.createImageBitmap=prior;}
});

test('oversized PNG and JPEG declarations never reach native decoding or OCR',async()=>{
 const prior=globalThis.createImageBitmap;let decoded=0,ocr=0;
 globalThis.createImageBitmap=async()=>{decoded++;return {width:5000,height:1,close(){}};};
 const pngBytes=[137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,19,136,0,0,0,1,8,6,0,0,0,0,0,0,0];
 const jpegBytes=[255,216,255,192,0,11,8,0,1,19,136,1,1,17,0,255,218,0,8,1,1,0,0,63,0,0,255,217];
 try{
  for(const [name,bytes] of [['huge.png',pngBytes],['huge.jpg',jpegBytes]])await assert.rejects(()=>extractDocumentText(file(name,bytes),{ocrLoader:async()=>{ocr++;throw Error('must not load')}}),e=>e.code==='imageDimensions');
  assert.equal(decoded,0);assert.equal(ocr,0);
 }finally{if(prior===undefined)delete globalThis.createImageBitmap;else globalThis.createImageBitmap=prior;}
});


test('OCR worker receives only explicit local asset paths and no persistent cache',async()=>{
 const native=globalThis.createImageBitmap;
 globalThis.createImageBitmap=async()=>({width:100,height:100,close(){}});
 let received;
 try{
  await extractDocumentText(png,{ocrLanguage:'fas',ocrLoader:async()=>({createWorker:async(...args)=>{
   received=args;return {recognize:async()=>({data:{text:'مدرک تحصیلی'}}),terminate:async()=>{}};
  }})});
  assert.equal(received[0],'fas');
  assert.equal(received[1],1);
  assert.deepEqual(received[2],{workerPath:'/vendor/ocr-v1/tesseract/worker.min.js',corePath:'/vendor/ocr-v1/core',langPath:'/vendor/ocr-v1/lang',workerBlobURL:false,cacheMethod:'none',gzip:true});
 }finally{globalThis.createImageBitmap=native;}
});

test('OCR requests only text output instead of duplicate layout exports',async()=>{
 const native=globalThis.createImageBitmap;globalThis.createImageBitmap=async()=>({width:100,height:100,close(){}});
 let output;
 try{
  await extractDocumentText(png,{ocrLoader:async()=>({createWorker:async()=>({recognize:async(_image,_options,formats)=>{output=formats;return {data:{text:'SYNTHETIC'}};},terminate(){}})})});
  assert.deepEqual(output,{text:true,blocks:false,hocr:false,tsv:false,box:false,unlv:false,osd:false,pdf:false,imageColor:false,imageGrey:false,imageBinary:false,layoutBlocks:false,debug:false});
 }finally{globalThis.createImageBitmap=native;}
});
test('a stalled scanned-page render is cancelled before canvas cleanup',async()=>{
 const prior=globalThis.document;const canvas={width:0,height:0,getContext:()=>({})};let cancelled=0,options;
 globalThis.document={createElement:()=>canvas};
 try{
  const pdfLoader=async()=>({GlobalWorkerOptions:{},getDocument:opts=>{options=opts;return {promise:Promise.resolve({numPages:1,getPage:async()=>({getTextContent:async()=>({items:[]}),getViewport:()=>({width:200,height:200}),render:()=>({promise:pending(),cancel(){cancelled++;}}),cleanup(){}}),destroy(){}})};}});
  assert.equal(await extractionOutcome(extractDocumentText(pdf(),{pdfLoader,timeoutMs:15})),'extractionUnavailable');
  assert.equal(cancelled,1);assert.equal(canvas.width,0);assert.equal(canvas.height,0);
  assert.equal(options.maxImageSize,12000000);assert.equal(options.canvasMaxAreaInBytes,48000000);
 }finally{globalThis.document=prior;}
});

test('PDF text budget stops before traversing later malicious items',async()=>{
 let readLater=false,destroyed=false;
 const items=[{str:'x'.repeat(12001)},{get str(){readLater=true;throw Error('must not read beyond budget');}}];
 const pdfLoader=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({numPages:1,getPage:async()=>({getTextContent:async()=>({items}),cleanup(){}}),destroy(){destroyed=true;}})})});
 await assert.rejects(()=>extractDocumentText(pdf(),{pdfLoader}),e=>e.code==='extractedTextTooLarge');
 assert.equal(readLater,false);assert.equal(destroyed,true);
});
test('PDF text budget counts UTF-8 bytes before joining and includes earlier pages',async()=>{
 let calls=0;
 const pdfLoader=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({numPages:2,getPage:async()=>({getTextContent:async()=>({items:[{str:'ش'.repeat(3100)}]}),cleanup(){calls++;}}),destroy(){}})})});
 await assert.rejects(()=>extractDocumentText(pdf(),{pdfLoader}),e=>e.code==='extractedTextTooLarge');
 assert.equal(calls,2);
});

test('PDF streaming cancels its reader at the budget without requesting later chunks',async()=>{
 let reads=0,cancelled=0,released=0;
 const pdfLoader=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({numPages:1,getPage:async()=>({streamTextContent:()=>({getReader:()=>({read:async()=>{reads++;return {done:false,value:{items:[{str:'x'.repeat(12001)}]}};},cancel(){cancelled++;},releaseLock(){released++;}})}),cleanup(){}}),destroy(){}})})});
 await assert.rejects(()=>extractDocumentText(pdf(),{pdfLoader}),e=>e.code==='extractedTextTooLarge');
 assert.equal(reads,1);assert.equal(cancelled,1);assert.equal(released,1);
});
test('PDF streaming accepts real multilingual chunks without getTextContent buffering',async()=>{
 let i=0,cancelled=0;
 const chunks=[{done:false,value:{items:[{str:'فارسی',hasEOL:true}]}},{done:false,value:{items:[{str:'پښتو'}]}},{done:true}];
 const pdfLoader=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({numPages:1,getPage:async()=>({streamTextContent:()=>({getReader:()=>({read:async()=>chunks[i++],cancel(){cancelled++;},releaseLock(){}})}),getTextContent(){throw Error('unbounded path');},cleanup(){}}),destroy(){}})})});
 assert.equal((await extractDocumentText(pdf(),{pdfLoader})).text,'فارسی\nپښتو');assert.equal(cancelled,1);
});

test('aborted document extraction never reads bytes or initializes a parser',async()=>{
 const controller=new AbortController();controller.abort();let reads=0;
 await assert.rejects(()=>extractDocumentText({name:'test.txt',size:1,arrayBuffer:async()=>{reads++;return new Uint8Array([65]).buffer;}},{signal:controller.signal}),e=>e.code==='extractionUnavailable');
 assert.equal(reads,0);
});
test('cancelling stalled PDF streaming releases reader and parser without waiting for deadline',async()=>{
 const controller=new AbortController();let ready,cancelled=0,destroyed=0;
 const reading=new Promise(resolve=>{ready=resolve;});
 const pdfLoader=async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({numPages:1,getPage:async()=>({streamTextContent:()=>({getReader:()=>({read:()=>{ready();return new Promise(()=>{});},cancel(){cancelled++;},releaseLock(){}})}),cleanup(){}}),destroy(){destroyed++;}})})});
 const extraction=extractDocumentText(pdf(),{pdfLoader,signal:controller.signal,timeoutMs:2000});
 await reading;const cancelledAt=Date.now();controller.abort();
 await assert.rejects(()=>extraction,e=>e.code==='extractionUnavailable');
 assert.equal(cancelled,1);assert.equal(destroyed,1);assert.ok(Date.now()-cancelledAt<1000);
});

test('PDF text accepts the exact UTF-8 limit across chunks without counting structural markers', async () => {
  const first = 'ش'.repeat(3000);
  const second = 'x'.repeat(5999);
  const chunks = [
    [{str: first, hasEOL: true}],
    [{type: 'endMarkedContent'}, {str: second}],
    [{type: 'endMarkedContent'}],
  ];
  const pdfLoader = async () => ({
    GlobalWorkerOptions: {},
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          streamTextContent: () => new ReadableStream({
            start(controller) {
              for (const items of chunks) controller.enqueue({items});
              controller.close();
            },
          }),
        }),
      }),
    }),
  });
  const result = await extractDocumentText(pdf(), {pdfLoader});
  assert.equal(result.text, first + '\n' + second);
});
