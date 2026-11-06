// Own a termination handle BEFORE upstream initialization starts. Never patch
// the page's Worker constructor: native OCR children live in a private host.
let active=false;
const unavailable=()=>Object.assign(new Error('extractionUnavailable'),{code:'extractionUnavailable'});
export default {async createWorker(language,oem,options){
 if(active)throw unavailable();
 active=true;let host,closed=false,sequence=0;
 const pending=new Map();
 const rejectAll=()=>{for(const task of pending.values())task.reject(unavailable());pending.clear();};
 const stop=()=>{if(closed)return;closed=true;host?.terminate();active=false;rejectAll();};
 const request=(action,payload={},transfer=[])=>new Promise((resolve,reject)=>{
  if(closed){reject(unavailable());return;}
  const id=++sequence;pending.set(id,{resolve,reject});
  try{host.postMessage({id,action,...payload},transfer);}catch{pending.delete(id);reject(unavailable());}
 });
 try{
  host=new Worker(new URL('./ocr-host.worker.js',import.meta.url),{type:'module'});
  host.onerror=event=>{event.preventDefault();stop();};
  host.onmessage=({data})=>{
   if(data?.fatal){stop();return;}
   const task=pending.get(data?.id);if(!task)return;pending.delete(data.id);
   data.error?task.reject(unavailable()):task.resolve(data.value);
  };
  const ready=request('initialize',{language,oem,options});ready.catch(()=>{});
  return {
   async recognize(image,_options,output){
    await ready;
    const blob=image instanceof Blob?image:await new Promise(resolve=>image.toBlob(resolve));
    if(!blob||blob.size>48*1024*1024)throw unavailable();
    const bytes=await blob.arrayBuffer();
    return request('recognize',{bytes,output},[bytes]);
   },
   async terminate(){
    if(closed)return;
    // Host acknowledges that it has explicitly terminated its native children.
    // Native host termination remains the bounded fallback if it cannot reply.
    let timer;
    try{await Promise.race([request('dispose').catch(()=>{}),new Promise(resolve=>{timer=setTimeout(resolve,150);})]);}
    finally{clearTimeout(timer);stop();}
   }
  };
 }catch{stop();throw unavailable();}
}};
