// Private realm for one OCR session. Import the exact dist artifact checked by
// prepare-local-ocr, rather than a different package source entry point.
import Tesseract from 'tesseract.js/dist/tesseract.esm.min.js';
import {MAX_TEXT_BYTES} from './document-limits.js';
const NativeWorker=globalThis.Worker,children=new Set();
// Upstream does not expose its Worker before initialization. Track it only in
// this dedicated realm so stalled model/core initialization remains cancellable.
globalThis.Worker=class extends NativeWorker{
 constructor(...args){super(...args);children.add(this);}
 terminate(){children.delete(this);super.terminate();}
};
const cleanup=()=>{for(const worker of [...children])worker.terminate();};
const fatal=()=>{cleanup();postMessage({fatal:true});close();};
let api;
onmessage=async({data})=>{
 const {id,action}=data;
 if(action==='dispose'){cleanup();postMessage({id,value:true});close();return;}
 try{
  if(action==='initialize'){
   api=await Tesseract.createWorker(data.language,data.oem,{...data.options,errorHandler:fatal});
   postMessage({id,value:true});
  }else if(action==='recognize'&&api){
   // No document strings/URLs: the parent transfers only bounded local bytes.
   const result=await api.recognize(new Uint8Array(data.bytes),{},data.output);
   const text=result?.data?.text??'';
   if(typeof text!=='string'){postMessage({id,error:true});return;}
   // Check length before encoding so a hostile result cannot allocate a large
   // UTF-8 buffer or cross into the page as a structured clone.
   if(text.length>MAX_TEXT_BYTES||new TextEncoder().encode(text).length>MAX_TEXT_BYTES){
    postMessage({id,error:'extractedTextTooLarge'});
    return;
   }
   postMessage({id,value:{data:{text}}});
  }else throw Error('invalid OCR operation');
 }catch{cleanup();postMessage({id,error:true});}
};
