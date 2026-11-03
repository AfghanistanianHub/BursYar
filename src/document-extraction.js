// Local-only document-to-text extraction. Original PDF/image bytes are NOT sent
// to BursYar's API or an AI provider. Code/model assets may be fetched on demand.
// Pinned versions: updates require security review and browser regression checks.
const MAX_TEXT_BYTES=12000, MAX_BINARY_BYTES=5*1024*1024, MAX_PAGES=5;
const fail=code=>{const error=new Error(code);error.code=code;throw error;};
const pdfModuleUrl='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/build/pdf.min.mjs';
const pdfWorkerUrl='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/build/pdf.worker.min.mjs';
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
async function createOcrWorker(ocrLoader=()=>importPinned(ocrModuleUrl),language='eng'){
 if(!['eng','fas','pus'].includes(language))fail('unsupportedOcrLanguage');
 let mod;
 try{mod=await ocrLoader();}catch{fail('extractionUnavailable');}
 if(typeof mod.createWorker!=='function')fail('extractionUnavailable');
 try{return await mod.createWorker(language);}catch{fail('extractionUnavailable');}
}
async function recognizeImage(bytes,mime,ocrLoader,language){
 if(typeof createImageBitmap!=='function'||typeof Blob==='undefined')fail('extractionUnavailable');
 let image,worker;
 try{
  image=await createImageBitmap(new Blob([bytes],{type:mime}));
  if(image.width<1||image.height<1||image.width>4500||image.height>4500||image.width*image.height>12000000)fail('imageDimensions');
  worker=await createOcrWorker(ocrLoader,language);
  const result=await worker.recognize(image);
  return result?.data?.text??'';
 }catch(error){if(error.code)throw error;fail('extractionUnavailable');}
 finally{image?.close?.();await worker?.terminate?.().catch(()=>{});}
}
async function readPdf(bytes,pdfLoader,ocrLoader,language){
 let pdf,worker;
 try{
  let lib;try{lib=await pdfLoader();}catch{fail('extractionUnavailable');}
  if(!lib?.getDocument||!lib?.GlobalWorkerOptions)fail('extractionUnavailable');
  lib.GlobalWorkerOptions.workerSrc=pdfWorkerUrl;
  const task=lib.getDocument({data:bytes.slice(),isEvalSupported:false,useSystemFonts:false,stopAtErrors:true});
  pdf=await task.promise;
  if(pdf.numPages<1||pdf.numPages>MAX_PAGES)fail('pdfPageLimit');
  const lines=[];
  for(let i=1;i<=pdf.numPages;i++){
   const page=await pdf.getPage(i);
   const content=await page.getTextContent();
   let text=content.items.map(x=>(x.str??'')+(x.hasEOL?'\n':' ')).join('').trim();
   // Scanned PDFs have no text layer; OCR the page locally.
   if(!text){
    if(typeof document==='undefined')fail('extractionUnavailable');
    const viewport=page.getViewport({scale:1.3});
    if(viewport.width*viewport.height>12000000)fail('imageDimensions');
    const canvas=document.createElement('canvas');
    canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    const context=canvas.getContext('2d');
    if(!context)fail('extractionUnavailable');
    await page.render({canvasContext:context,viewport}).promise;
    worker??=await createOcrWorker(ocrLoader,language);
    text=(await worker.recognize(canvas))?.data?.text??'';
    canvas.width=canvas.height=0;
   }
   lines.push(text.trim());
   // Prevent quadratic memory growth when a PDF contains huge text.
   if(new TextEncoder().encode(lines.join('\n')).length>MAX_TEXT_BYTES)fail('extractedTextTooLarge');
   page.cleanup?.();
  }
  return safeText(lines.join('\n'));
 }catch(error){if(error.code)throw error;fail('invalidPdf');}
 finally{await worker?.terminate?.().catch(()=>{});await pdf?.destroy?.().catch(()=>{});}
}
export async function extractDocumentText(file,{pdfLoader=()=>importPinned(pdfModuleUrl),ocrLoader=()=>importPinned(ocrModuleUrl),ocrLanguage='eng'}={}){
 if(!['eng','fas','pus'].includes(ocrLanguage))fail('unsupportedOcrLanguage');
 if(!file)fail('missingFile');
 const name=(file.name??'').toLowerCase();
 const kind=name.endsWith('.txt')?'txt':name.endsWith('.pdf')?'pdf':/\.(png|jpe?g)$/.test(name)?'image':null;
 if(!kind)fail('unsupportedFile');
 if(file.size>(kind==='txt'?MAX_TEXT_BYTES:MAX_BINARY_BYTES))fail('fileTooLarge');
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes.length>(kind==='txt'?MAX_TEXT_BYTES:MAX_BINARY_BYTES))fail('fileTooLarge');
 if(kind==='txt'){
  let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('invalidEncoding');}
  return {text:safeText(text),method:'utf8_text'};
 }
 if(kind==='pdf'){
  if(!isPdf(bytes))fail('invalidPdf');
  return {text:await readPdf(bytes,pdfLoader,ocrLoader,ocrLanguage),method:'local_pdf_text_or_ocr'};
 }
 const mime=isPng(bytes)?'image/png':isJpeg(bytes)?'image/jpeg':null;
 if(!mime)fail('invalidImage');
 return {text:safeText(await recognizeImage(bytes,mime,ocrLoader,ocrLanguage)),method:'local_image_ocr'};
}
