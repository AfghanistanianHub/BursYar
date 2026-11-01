const MAX_BODY=65536;
const denied=()=>new Error('Unauthorized');
// Called only AFTER the Admin SDK has cryptographically verified the ID token.
// Read the caller's own account through Firebase's documented public REST API;
// no service-account key or administrative account-list access is required.
export function createFirebaseAccountCheck({projectId,webApiKey,fetchImpl=fetch,timeoutMs=5000}) {
 if(typeof projectId!=='string'||!/^[a-z][a-z0-9-]{4,62}$/.test(projectId)||typeof webApiKey!=='string'||!/^[A-Za-z0-9_-]{10,200}$/.test(webApiKey)||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>10000)throw Error('Invalid Firebase account-check configuration');
 const endpoint='https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+encodeURIComponent(webApiKey);
 return async(token,claims)=>{
  if(typeof token!=='string'||!token||token.length>8192||!claims||claims.aud!==projectId||claims.iss!==`https://securetoken.google.com/${projectId}`||typeof claims.uid!=='string'||!claims.uid||claims.uid.length>128||claims.sub!==claims.uid||!Number.isSafeInteger(claims.auth_time)||claims.auth_time<0||claims.firebase?.tenant)throw denied();
  const controller=new AbortController();let reader,timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(denied());},timeoutMs);});
  const lookup=async()=>{
   const response=await fetchImpl(endpoint,{method:'POST',redirect:'error',cache:'no-store',credentials:'omit',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token}),signal:controller.signal});
   if(!response.ok||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??'')||!response.body)throw denied();
   reader=response.body.getReader();const chunks=[];let size=0;
   try{
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY)throw denied();chunks.push(value);}
   }finally{reader.releaseLock();reader=null;}
   const result=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(!Array.isArray(result?.users)||result.users.length!==1)throw denied();
   const account=result.users[0];
   if(!account||account.localId!==claims.uid||(account.disabled!==undefined&&account.disabled!==false)||account.tenantId||typeof account.validSince!=='string'||!/^\d+$/.test(account.validSince))throw denied();
   const validSince=Number(account.validSince);
   if(!Number.isSafeInteger(validSince)||validSince<0||claims.auth_time<validSince)throw denied();
  };
  try{await Promise.race([lookup(),deadline]);}catch{throw denied();}
  finally{clearTimeout(timer);controller.abort();if(reader){reader.cancel().catch(()=>{});}}
 };
}
