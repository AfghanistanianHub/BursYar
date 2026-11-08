import {inspectImageDimensions} from './image-preflight.js';
import {MAX_TEXT_BYTES} from './document-limits.js';
// Local-only document-to-text extraction. Original PDF/image bytes are NOT sent
// to BursYar's API or an AI provider. Pinned code/models load from this origin.
// Pinned versions: updates require security review and browser regression checks.
const MAX_BINARY_BYTES=5*1024*1024, MAX_PAGES=5;
const fail=code=>{const error=new Error(code);error.code=code;throw error;};
const ocrOptions=Object.freeze({workerPath:'/vendor/ocr-v1/tesseract/worker.min.js',corePath:'/vendor/ocr-v1/core',langPath:'/vendor/ocr-v1/lang',workerBlobURL:false,cacheMethod:'none',gzip:true});
const ocrOutput=Object.freeze({text:true,blocks:false,hocr:false,tsv:false,box:false,unlv:false,osd:false,pdf:false,imageColor:false,imageGrey:false,imageBinary:false,layoutBlocks:false,debug:false});
const isPdf=bytes=>bytes.length>=5&&bytes[0]===37&&bytes[1]===80&&bytes[2]===68&&bytes[3]===70&&bytes[4]===45;
const isPng=b=>b.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n);
const isJpeg=b=>b.length>=4&&b[0]===255&&b[1]===216&&b[b.length-2]===255&&b[b.length-1]===217;
const safeText=text=>{
 if(typeof text!=='string')fail('emptyFile');
 if(text.length>MAX_TEXT_BYTES)fail('extractedTextTooLarge');
 if(!text.trim())fail('emptyFile');
 if(/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffd]/u.test(text))fail('invalidEncoding');
 if(new TextEncoder().encode(text).length>MAX_TEXT_BYTES)fail('extractedTextTooLarge');
 return text;
};
// One shared wall-clock budget covers reads, imports, decoding and OCR. A
// deadline is not a sandbox: production binary uploads remain disabled.
async function release(resource,method){
 let timer;
 try{await Promise.race([Promise.resolve().then(()=>resource?.[method]?.()).catch(()=>{}),new Promise(resolve=>{timer=setTimeout(resolve,1000);})]);}
 finally{clearTimeout(timer);}
}
function extractionDeadline(timeoutMs,signal){
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)fail('extractionUnavailable');
 const expires=Date.now()+timeoutMs;
 return (operation,onLate)=>{
  const remaining=expires-Date.now();
  if(signal?.aborted||remaining<=0)return Promise.reject(Object.assign(new Error('extractionUnavailable'),{code:'extractionUnavailable'}));
  return new Promise((resolve,reject)=>{
   let expired=false;
   const stop=()=>{expired=true;clearTimeout(timer);signal?.removeEventListener('abort',stop);reject(Object.assign(new Error('extractionUnavailable'),{code:'extractionUnavailable'}));};
   const timer=setTimeout(stop,remaining);
   signal?.addEventListener('abort',stop,{once:true});
   Promise.resolve().then(()=>{if(signal?.aborted)fail('extractionUnavailable');return operation();}).then(value=>{
    if(expired){Promise.resolve().then(()=>onLate?.(value)).catch(()=>{});return;}
    clearTimeout(timer);signal?.removeEventListener('abort',stop);resolve(value);
   },error=>{clearTimeout(timer);signal?.removeEventListener('abort',stop);if(!expired)reject(error);});
  });
 };
}
const validDimensions=(width,height)=>Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0&&Math.ceil(width)<=4500&&Math.ceil(height)<=4500&&Math.ceil(width)*Math.ceil(height)<=12000000;
async function createOcrWorker(ocrLoader=()=>import('./ocr-runtime.js'),language='eng',wait){
 if(!['eng','fas','pus'].includes(language))fail('unsupportedOcrLanguage');
 let mod;
 try{mod=await wait(()=>ocrLoader());}catch{fail('extractionUnavailable');}
 const ocrApi=mod.default??mod;
 if(typeof ocrApi.createWorker!=='function')fail('extractionUnavailable');
 try{return await wait(()=>ocrApi.createWorker(language,1,{...ocrOptions}),worker=>release(worker,'terminate'));}catch{fail('extractionUnavailable');}
}
async function recognizeImage(bytes,mime,ocrLoader,language,wait){
 const declared=inspectImageDimensions(bytes,mime);
 if(typeof createImageBitmap!=='function'||typeof Blob==='undefined')fail('extractionUnavailable');
 let image,worker;
 try{
  const blob=new Blob([bytes],{type:mime});
  image=await wait(()=>createImageBitmap(blob),bitmap=>release(bitmap,'close'));
  if(!validDimensions(image.width,image.height)||!((image.width===declared.width&&image.height===declared.height)||(image.width===declared.height&&image.height===declared.width)))fail('imageDimensions');
  worker=await createOcrWorker(ocrLoader,language,wait);
  const result=await wait(()=>worker.recognize(blob,{},{...ocrOutput}));
  return result?.data?.text??'';
 }catch(error){if(typeof error?.code==='string')throw error;fail('extractionUnavailable');}
 finally{await release(image,'close');await release(worker,'terminate');}
}
// Bound text as it arrives from PDF.js, before concatenation/encoding. Streaming
// limits application-side retention; it is not a parser/process memory ceiling.
async function boundedPageText(page,remaining,wait){
 const parts=[];let used=0,reader,separator='';
 const append=items=>{
  if(!Array.isArray(items))fail('invalidPdf');
  for(const item of items){
   const text=item.str;
   if(text===undefined)continue;
   if(typeof text!=='string')fail('invalidPdf');
   // UTF-8 uses at least one byte per UTF-16 code unit. Check length first
   // so an oversized item never causes an equally oversized encoding buffer.
   if(text.length>remaining-used-separator.length)fail('extractedTextTooLarge');
   const size=new TextEncoder().encode(text).length+separator.length;
   if(size>remaining-used)fail('extractedTextTooLarge');
   used+=size;parts.push(separator,text);
   separator=item.hasEOL?'\n':' ';
  }
 };
 try{
  if(typeof page.streamTextContent==='function'){
   reader=page.streamTextContent().getReader();
   for(;;){const chunk=await wait(()=>reader.read());if(chunk.done)break;append(chunk.value.items);}
  }else append((await wait(()=>page.getTextContent())).items);
  return parts.join('').trim();
 }finally{if(reader){await release(reader,'cancel');try{reader.releaseLock();}catch{}}}
}
async function readPdf(bytes,pdfLoader,ocrLoader,language,wait){
 let pdf,worker,task;
 try{
  let lib;try{lib=await wait(()=>pdfLoader());}catch{fail('extractionUnavailable');}
  if(!lib?.getDocument||!lib?.GlobalWorkerOptions)fail('extractionUnavailable');
  task=lib.getDocument({data:bytes.slice(),isEvalSupported:false,enableScripting:false,useSystemFonts:false,stopAtErrors:true,maxImageSize:12000000,canvasMaxAreaInBytes:48000000});
  pdf=await wait(()=>task.promise,latePdf=>release(latePdf,'destroy'));
  if(!Number.isInteger(pdf.numPages)||pdf.numPages<1||pdf.numPages>MAX_PAGES)fail('pdfPageLimit');
  const lines=[];let textBytes=0;
  for(let i=1;i<=pdf.numPages;i++){
   const page=await wait(()=>pdf.getPage(i),latePage=>release(latePage,'cleanup'));
   try{
   let text=await boundedPageText(page,MAX_TEXT_BYTES-textBytes-(lines.length?1:0),wait);
   // Scanned PDFs have no text layer; OCR the page locally.
   if(!text){
    if(typeof document==='undefined')fail('extractionUnavailable');
    const viewport=page.getViewport({scale:1.3});
    if(!validDimensions(viewport.width,viewport.height))fail('imageDimensions');
    const canvas=document.createElement('canvas');
    canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    try{
    const context=canvas.getContext('2d');
    if(!context)fail('extractionUnavailable');
    let renderTask;
    try{renderTask=page.render({canvasContext:context,viewport});await wait(()=>renderTask.promise);}
    catch{await release(renderTask,'cancel');fail('extractionUnavailable');}
    worker??=await createOcrWorker(ocrLoader,language,wait);
    try{text=(await wait(()=>worker.recognize(canvas,{},{...ocrOutput})))?.data?.text??'';}
    catch(error){if(error?.code==='extractedTextTooLarge')throw error;fail('extractionUnavailable');}
    }finally{canvas.width=canvas.height=0;}
   }
   // OCR output can contain padding. Cap raw text before trimming or encoding.
   if(typeof text!=='string')fail('invalidEncoding');
   if(text.length>MAX_TEXT_BYTES)fail('extractedTextTooLarge');
   text=text.trim();
   if(text.length>MAX_TEXT_BYTES-textBytes)fail('extractedTextTooLarge');
   textBytes+=new TextEncoder().encode(text).length+(lines.length?1:0);
   if(textBytes>MAX_TEXT_BYTES)fail('extractedTextTooLarge');
   lines.push(text);
   }finally{await release(page,'cleanup');}
  }
  return safeText(lines.join('\n'));
 }catch(error){if(typeof error?.code==='string')throw error;fail('invalidPdf');}
 finally{await release(worker,'terminate');await release(pdf??task,'destroy');}
}
export async function extractDocumentText(file,{pdfLoader=()=>import('./pdf-runtime.js').then(module=>module.pdfRuntime()),ocrLoader=()=>import('./ocr-runtime.js'),ocrLanguage='eng',timeoutMs=30000,signal}={}){
 if(!['eng','fas','pus'].includes(ocrLanguage))fail('unsupportedOcrLanguage');
 if(!file)fail('missingFile');
 const name=(file.name??'').toLowerCase();
 const kind=name.endsWith('.txt')?'txt':name.endsWith('.pdf')?'pdf':/\.(png|jpe?g)$/.test(name)?'image':null;
 if(!kind||((import.meta.env?.PROD??false)&&kind!=='txt'))fail((import.meta.env?.PROD??false)?'unsupportedFileProduction':'unsupportedFile');
 if(file.size>(kind==='txt'?MAX_TEXT_BYTES:MAX_BINARY_BYTES))fail('fileTooLarge');
 const wait=extractionDeadline(timeoutMs,signal);
 const parse=async()=>{
 const bytes=new Uint8Array(await wait(()=>file.arrayBuffer()));
 if(bytes.length>(kind==='txt'?MAX_TEXT_BYTES:MAX_BINARY_BYTES))fail('fileTooLarge');
 if(kind==='txt'){
  let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('invalidEncoding');}
  return {text:safeText(text),method:'utf8_text'};
 }
 if(kind==='pdf'){
  if(!isPdf(bytes))fail('invalidPdf');
  return {text:await readPdf(bytes,pdfLoader,ocrLoader,ocrLanguage,wait),method:'local_pdf_text_or_ocr'};
 }
 const mime=isPng(bytes)?'image/png':isJpeg(bytes)?'image/jpeg':null;
 if(!mime)fail('invalidImage');
 return {text:safeText(await recognizeImage(bytes,mime,ocrLoader,ocrLanguage,wait)),method:'local_image_ocr'};
 };
 // Browser-wide coordination bounds concurrent binary work across tabs in
 // this origin/storage partition. Node fixture loaders remain independently testable.
 if(kind==='txt'||typeof window==='undefined')return parse();
 const locks=globalThis.navigator?.locks;
 if(typeof locks?.request!=='function')fail('extractionUnavailable');
 return wait(()=>locks.request('bursyar.binary-document',{mode:'exclusive',ifAvailable:true},lock=>{
  if(!lock)fail('extractionBusy');
  return parse();
 }));
}
