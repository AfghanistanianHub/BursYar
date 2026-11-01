import {createHash} from 'node:crypto';
import {DocumentStore,DocumentError} from './documents.js';
import {createPrivateSupabaseRpc} from './private-supabase-rpc.js';
const MAX_STATE=1024*1024;
const unavailable=()=>new DocumentError(503);
// Per-owner in-memory working copy backed by durable revision CAS. No cache/disk fallback.
export class RemoteDocumentStore {
 constructor(config){Object.defineProperty(this,'rpc',{value:createPrivateSupabaseRpc(config,unavailable)});}
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
