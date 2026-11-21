// One bounded request, never a retry. A lost write response is not a failed write.
const failure=code=>Object.assign(new Error('Document request unavailable'),{code});
export async function documentRequest(path,{token,method='GET',body,fetchImpl=fetch,timeoutMs=45000}={}){
 if(!['GET','HEAD','POST','PATCH','DELETE'].includes(method))throw failure('error');
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>120000)throw failure('error');
 const write=!['GET','HEAD'].includes(method);
 if(typeof token!=='string'||!token.trim())throw failure('signInRequired');
 if(typeof path!=='string'||!/^\/api\/(?:[a-z0-9/_-]+)$/.test(path))throw failure('error');
 try{
  const response=await fetchImpl(path,{method,credentials:'omit',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(timeoutMs)});
  if(!response.ok)throw failure(({401:'signInRequired',403:'signInRequired',409:'conflictError',429:'limitError',503:'unavailableError'})[response.status]??'error');
  return await response.json();
 }catch(error){
  if(error.code&&['signInRequired','conflictError','limitError','unavailableError','error'].includes(error.code))throw error;
  throw failure(write?'mutationUncertain':['TimeoutError','AbortError'].includes(error.name)?'requestTimedOut':'requestNetworkError');
 }
}
