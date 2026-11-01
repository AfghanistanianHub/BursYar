import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {QuotaStore,QuotaExceeded} from './quota.js';
import {createPrivateSupabaseRpc} from './private-supabase-rpc.js';
const unavailable=()=>Error('Quota storage unavailable');
const providers=new Set(['meta','gemini','self_hosted']);
export class RemoteQuotaStore {
 constructor({provider,limits,...config}){
  if(!providers.has(provider)||!limits||['userMinute','userDay','globalDay','lifetimeUnits'].some(k=>!Number.isSafeInteger(limits[k])||limits[k]<1))throw Error('Invalid quota configuration');
  this.provider=provider;this.limits=Object.freeze(Object.fromEntries(['userMinute','userDay','globalDay','lifetimeUnits'].map(k=>[k,limits[k]])));
  Object.defineProperty(this,'rpc',{value:createPrivateSupabaseRpc(config,unavailable)});
 }
 async initialize(){if(await this.rpc('bursyar_quota_initialize',{p_provider:this.provider,p_limits:this.limits})!==true)throw unavailable();}
 async reserve(uid,units){
  if(typeof uid!=='string'||!uid||uid.length>128||!Number.isSafeInteger(units)||units<1)throw Error('Invalid reservation');
  const result=await this.rpc('bursyar_quota_reserve',{p_provider:this.provider,p_subject:createHash('sha256').update(uid).digest('hex'),p_units:units});
  if(result===false)throw new QuotaExceeded('Quota exhausted');
  if(result!==true)throw unavailable();
 }
 close(){}
}
export async function createQuotaStorage(env,{provider,limits,fetchImpl=fetch}){
 if(!providers.has(provider))throw Error('Invalid quota provider');
 if(env.BURSYAR_QUOTA_STORAGE==='supabase'){
  if(env.BURSYAR_QUOTA_DB)throw Error('Conflicting quota storage configuration');
  const store=new RemoteQuotaStore({url:env.BURSYAR_DOCUMENT_SUPABASE_URL,key:env.BURSYAR_DOCUMENT_SUPABASE_KEY,provider,limits,fetchImpl});
  await store.initialize();return store;
 }
 if(env.BURSYAR_QUOTA_STORAGE&&env.BURSYAR_QUOTA_STORAGE!=='sqlite')throw Error('Invalid quota storage configuration');
 const path=provider==='meta'?env.BURSYAR_QUOTA_DB:env.BURSYAR_QUOTA_DB?`${env.BURSYAR_QUOTA_DB}.${provider}`:null;
 if(!path||env.BURSYAR_DOCUMENT_DB&&resolve(path)===resolve(env.BURSYAR_DOCUMENT_DB))throw Error('Dedicated quota database required');
 return new QuotaStore(path,limits);
}
