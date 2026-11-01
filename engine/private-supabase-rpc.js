const MAX_RESPONSE=1024*1024+65536;
function serverKey(key){
 if(typeof key!=='string'||key.length>8192||/\s/.test(key))return false;
 if(/^sb_secret_[A-Za-z0-9_-]{20,}$/.test(key))return true;
 try{return key.split('.').length===3&&JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role==='service_role';}catch{return false;}
}
export function createPrivateSupabaseRpc({url,key,fetchImpl=fetch,timeoutMs=4000},failure=()=>Error('Private storage unavailable')){
 if(typeof url!=='string'||!/^https:\/\/[a-z]{20}\.supabase\.co$/.test(url)||!serverKey(key)||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>10000)throw Error('Invalid private storage configuration');
 return async(name,body)=>{
  if(!/^bursyar_[a-z_]{1,60}$/.test(name))throw failure();
  const controller=new AbortController();let timer,reader;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(failure());},timeoutMs);});
  const operation=async()=>{
   const response=await fetchImpl(url+'/rest/v1/rpc/'+name,{method:'POST',redirect:'error',cache:'no-store',credentials:'omit',headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{authorization:'Bearer '+key}),'content-type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
   if(!response.ok||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??'')||!response.body)throw failure();
   reader=response.body.getReader();let size=0;const chunks=[];
   try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_RESPONSE)throw failure();chunks.push(value);}}finally{reader.releaseLock();reader=null;}
   return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  };
  try{return await Promise.race([operation(),deadline]);}catch{throw failure();}
  finally{clearTimeout(timer);controller.abort();if(reader)reader.cancel().catch(()=>{});}
 };
}
