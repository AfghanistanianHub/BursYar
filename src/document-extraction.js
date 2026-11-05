// Local-only document-to-text extraction. Original PDF/image bytes are NOT sent
// to BursYar's API or an AI provider. Code/model assets may be fetched on demand.
// Pinned versions: updates require security review and browser regression checks.
const MAX_TEXT_BYTES=12000, MAX_BINARY_BYTES=5*1024*1024, MAX_PAGES=5;
const fail=code=>{const error=new Error(code);error.code=code;throw error;};
const pdfModuleUrl='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
const pdfWorkerUrl='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
const ocrModuleUrl='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.esm.min.js';
const isPdf=bytes=>bytes.length>=5&&bytes[0]===37&&bytes[1]===80&&bytes[2]===68&&bytes[3]===70&&bytes[4]===45;
const isPng=b=>b.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n);
const isJpeg=b=>b.length>=4&&b[0]===255&&b[1]===216&&b[b.length-2]===255&&b[b.length-1]===217;
const safeText=text=>{
 if(typeof text!=='string'||!text.trim())fail('emptyFile');
 if(/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffd]/u.test(text))fail('invalidEncoding');
 if(new TextEncoder().encode(text).length>MAX_TEXT_BYTES)fail('extractedTextTooLarge');
 return text;
};
const importPinned=url=>import(/* @vite-ignore */ url);
// One shared wall-clock budget covers reads, imports, decoding and OCR. A
// deadline is not a sandbox: production binary uploads remain disabled.
async function release(resource,method){
 let timer;
 try{await Promise.race([Promise.resolve().then(()=>resource?.[method]?.()).catch(()=>{}),new Promise(resolve=>{timer=setTimeout(resolve,1000);})]);}
 finally{clearTimeout(timer);}
}
function extractionDeadline(timeoutMs){
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)fail('extractionUnavailable');
 const expires=Date.now()+timeoutMs;
 return (operation,onLate)=>{
  const remaining=expires-Date.now();
  if(remaining<=0)return Promise.reject(Object.assign(new Error('extractionUnavailable'),{code:'extractionUnavailable'}));
  return new Promise((resolve,reject)=>{
   let expired=false;
   const timer=setTimeout(()=>{expired=true;reject(Object.assign(new Error('extractionUnavailable'),{code:'extractionUnavailable'}));},remaining);
   Promise.resolve().then(operation).then(value=>{
    if(expired){Promise.resolve().then(()=>onLate?.(value)).catch(()=>{});return;}
    clearTimeout(timer);resolve(value);
   },error=>{clearTimeout(timer);if(!expired)reject(error);});
  });
 };
}
const validDimensions=(width,height)=>Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0&&Math.ceil(width)<=4500&&Math.ceil(height)<=4500&&Math.ceil(width)*Math.ceil(height)<=12000000;
async function createOcrWorker(ocrLoader=()=>importPinned(ocrModuleUrl),language='eng',wait){
 if(!['eng','fas','pus'].includes(language))fail('unsupportedOcrLanguage');
 let mod;
 try{mod=await wait(()=>ocrLoader());}catch{fail('extractionUnavailable');}
 const ocrApi=mod.default??mod;
 if(typeof ocrApi.createWorker!=='function')fail('extractionUnavailable');
 try{return await wait(()=>ocrApi.createWorker(language),worker=>release(worker,'terminate'));}catch{fail('extractionUnavailable');}
}
async function recognizeImage(bytes,mime,ocrLoader,language,wait){
 if(typeof createImageBitmap!=='function'||typeof Blob==='undefined')fail('extractionUnavailable');
 let image,worker;
 try{
  const blob=new Blob([bytes],{type:mime});
  image=await wait(()=>createImageBitmap(blob),bitmap=>release(bitmap,'close'));
  if(!validDimensions(image.width,image.height))fail('imageDimensions');
  worker=await createOcrWorker(ocrLoader,language,wait);
  const result=await wait(()=>worker.recognize(blob));
  return result?.data?.text??'';
 }catch(error){if(typeof error?.code==='string')throw error;fail('extractionUnavailable');}
 finally{await release(image,'close');await release(worker,'terminate');}
}
async function readPdf(bytes,pdfLoader,ocrLoader,language,wait){
 let pdf,worker,task;
 try{
  let lib;try{lib=await wait(()=>pdfLoader());}catch{fail('extractionUnavailable');}
  if(!lib?.getDocument||!lib?.GlobalWorkerOptions)fail('extractionUnavailable');
  lib.GlobalWorkerOptions.workerSrc=pdfWorkerUrl;
  task=lib.getDocument({data:bytes.slice(),isEvalSupported:false,enableScripting:false,useSystemFonts:false,stopAtErrors:true});
  pdf=await wait(()=>task.promise,latePdf=>release(latePdf,'destroy'));
  if(!Number.isInteger(pdf.numPages)||pdf.numPages<1||pdf.numPages>MAX_PAGES)fail('pdfPageLimit');
  const lines=[];
  for(let i=1;i<=pdf.numPages;i++){
   const page=await wait(()=>pdf.getPage(i),latePage=>release(latePage,'cleanup'));
   try{
   const content=await wait(()=>page.getTextContent());
   let text=content.items.map(x=>(x.str??'')+(x.hasEOL?'\n':' ')).join('').trim();
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
    try{await wait(()=>page.render({canvasContext:context,viewport}).promise);}
    catch{fail('extractionUnavailable');}
    worker??=await createOcrWorker(ocrLoader,language,wait);
    try{text=(await wait(()=>worker.recognize(canvas)))?.data?.text??'';}
    catch{fail('extractionUnavailable');}
    }finally{canvas.width=canvas.height=0;}
   }
   lines.push(text.trim());
   // Prevent quadratic memory growth when a PDF contains huge text.
   if(new TextEncoder().encode(lines.join('\n')).length>MAX_TEXT_BYTES)fail('extractedTextTooLarge');
   }finally{await release(page,'cleanup');}
  }
  return safeText(lines.join('\n'));
 }catch(error){if(typeof error?.code==='string')throw error;fail('invalidPdf');}
 finally{await release(worker,'terminate');await release(pdf??task,'destroy');}
}
export async function extractDocumentText(file,{pdfLoader=()=>importPinned(pdfModuleUrl),ocrLoader=()=>importPinned(ocrModuleUrl),ocrLanguage='eng',timeoutMs=30000}={}){
 if(!['eng','fas','pus'].includes(ocrLanguage))fail('unsupportedOcrLanguage');
 if(!file)fail('missingFile');
 const name=(file.name??'').toLowerCase();
 const kind=name.endsWith('.txt')?'txt':name.endsWith('.pdf')?'pdf':/\.(png|jpe?g)$/.test(name)?'image':null;
 if(!kind||((import.meta.env?.PROD??false)&&kind!=='txt'))fail((import.meta.env?.PROD??false)?'unsupportedFileProduction':'unsupportedFile');
 if(file.size>(kind==='txt'?MAX_TEXT_BYTES:MAX_BINARY_BYTES))fail('fileTooLarge');
 const wait=extractionDeadline(timeoutMs);
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
}
