// One bounded request, never a retry. A lost write response is not a failed write.
const failure=code=>Object.assign(new Error('Document request unavailable'),{code});
// The free-tier backend can take the better part of a minute to boot after it
// idles out (BY-05). The client budget must exceed that boot, and a timeout is
// reported as "starting", never as a broken account.
export const FIRST_REQUEST_TIMEOUT_MS=60000;
export async function documentRequest(path,{token,method='GET',body,fetchImpl=fetch,timeoutMs=FIRST_REQUEST_TIMEOUT_MS}={}){
 if(!['GET','HEAD','POST','PUT','PATCH','DELETE'].includes(method))throw failure('error');
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>120000)throw failure('error');
 const write=!['GET','HEAD'].includes(method);
 if(typeof token!=='string'||!token.trim())throw failure('signInRequired');
 if(typeof path!=='string'||!/^\/api\/(?:[a-z0-9/_-]+)$/.test(path))throw failure('error');
 try{
  const response=await fetchImpl(path,{method,credentials:'omit',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(timeoutMs)});
  if(!response.ok){
   let code=({401:'signInRequired',403:'signInRequired',409:'conflictError',429:'limitError',503:'unavailableError'})[response.status]??'error';
   // A signed-in identity the closed pilot has not enrolled is not a sign-in
   // failure: the panel must offer a request path instead of another sign-in.
   if(response.status===403&&typeof response.json==='function'){
    const payload=await response.json().catch(()=>null);
    if(payload?.code==='account_not_enrolled')code='accountNotEnrolled';
   }
   throw failure(code);
  }
  return await response.json();
 }catch(error){
  if(error.code&&['signInRequired','accountNotEnrolled','conflictError','limitError','unavailableError','error'].includes(error.code))throw error;
  throw failure(write?'mutationUncertain':['TimeoutError','AbortError'].includes(error.name)?'requestTimedOut':'requestNetworkError');
 }
}
