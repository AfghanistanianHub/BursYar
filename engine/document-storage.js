import {DocumentStore} from './documents.js';
import {RemoteDocumentStore} from './remote-documents.js';
export async function createDocumentStorage(env,{fetchImpl=fetch}={}){
 const url=env.BURSYAR_DOCUMENT_SUPABASE_URL,key=env.BURSYAR_DOCUMENT_SUPABASE_KEY;
 if(url||key){
  if(!url||!key||env.BURSYAR_DOCUMENT_DB||env.BURSYAR_FAMILY_GRANTS)throw Error('Conflicting or incomplete private document storage configuration');
  const store=new RemoteDocumentStore({url,key,fetchImpl});
  // A read-only probe must succeed before capabilities can report availability.
  await store.profile('__bursyar_storage_readiness_v1__');
  return store;
 }
 return env.BURSYAR_DOCUMENT_DB?new DocumentStore(env.BURSYAR_DOCUMENT_DB):null;
}
