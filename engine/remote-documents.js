import {createHash} from 'node:crypto';
import {DocumentStore,DocumentError} from './documents.js';
const MAX_STATE=1024*1024,MAX_RESPONSE=MAX_STATE+65536;
const unavailable=()=>new DocumentError(503);
function serverKey(key){
 if(typeof key!=='string'||key.length>8192||/\s/.test(key))return false;
 if(/^sb_secret_[A-Za-z0-9_-]{20,}$/.test(key))return true;
 try{return key.split('.').length===3&&JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role==='service_role';}catch{return false;}
}
// No browser Supabase session or Firebase ID token is sent to this service.
// Each operation loads only its verified owner's state, applies existing rules
// in memory, then atomically commits by revision. No disk/cache fallback.
export class RemoteDocumentStore {
 constructor({url,key,fetchImpl=fetch,timeoutMs=4000}){
  if(typeof url!=='string'||!/^https:\/\/[a-z]{20}\.supabase\.co$/.test(url)||!serverKey(key)||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>10000)throw Error('Invalid private document storage configuration');
  // Keep credentials out of enumerable diagnostics/JSON representations.
  Object.defineProperties(this,{rpc:{value:async(name,body)=>{
   const controller=new AbortController();let timer,reader;
   const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(unavailable());},timeoutMs);});
   const operation=async()=>{
    const response=await fetchImpl(url+'/rest/v1/rpc/'+name,{method:'POST',redirect:'error',cache:'no-store',credentials:'omit',headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{authorization:'Bearer '+key}),'content-type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
    if(!response.ok||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??'')||!response.body)throw unavailable();
    reader=response.body.getReader();let size=0;const chunks=[];
    try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_RESPONSE)throw unavailable();chunks.push(value);}}finally{reader.releaseLock();reader=null;}
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
   };
   try{return await Promise.race([operation(),deadline]);}catch{throw unavailable();}
   finally{clearTimeout(timer);controller.abort();if(reader)reader.cancel().catch(()=>{});}
  }}});
 }
 owner(uid){if(typeof uid!=='string'||!uid||uid.length>128)throw new DocumentError(400);if(uid.startsWith('family:'))throw new DocumentError(403);return createHash('sha256').update(uid).digest('hex');}
 async run(uid,method,args,write=false){
  const owner=this.owner(uid);
  for(let attempt=0;attempt<(write?3:1);attempt++){
   const row=await this.rpc('bursyar_document_read',{p_owner:owner});
   if(!row||!Number.isSafeInteger(row.revision)||row.revision<0||row.revision>=Number.MAX_SAFE_INTEGER||!Object.hasOwn(row,'state')||(row.revision===0)!==(row.state===null)||Buffer.byteLength(JSON.stringify(row.state))>MAX_STATE)throw unavailable();
   const working=DocumentStore.memory();let result,state;
   try{
    try{working.restore(uid,row.state);}catch{throw unavailable();}
    result=working[method](uid,...args);if(write)state=working.snapshot(uid);
   }finally{working.close();}
   if(!write)return result;
   if(Buffer.byteLength(JSON.stringify(state))>MAX_STATE)throw new DocumentError(413);
   const committed=await this.rpc('bursyar_document_compare',{p_owner:owner,p_revision:row.revision,p_state:state});
   if(committed===true)return result;
   if(committed!==false)throw unavailable();
  }
  throw new DocumentError(409);
 }
 profile(uid){return this.run(uid,'profile',[]);}
 list(uid){return this.run(uid,'list',[]);}
 get(uid,id){return this.run(uid,'get',[id]);}
 export(uid){return this.run(uid,'export',[]);}
 upload(uid,input){return this.run(uid,'upload',[input],true);}
 review(uid,id,decisions){return this.run(uid,'review',[id,decisions],true);}
 updateProfile(uid,input){return this.run(uid,'updateProfile',[input],true);}
 deleteProfile(uid){return this.run(uid,'deleteProfile',[],true);}
 delete(uid,id){return this.run(uid,'delete',[id],true);}
 eraseOwner(uid){return this.run(uid,'eraseOwner',[],true);}
 isTransferred(){throw new DocumentError(403);}
 close(){}
}
