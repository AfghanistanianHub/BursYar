const ENDPOINT='https://api.meta.ai/v1/chat/completions';
// Only locally constructed, finite diagnostic fields may cross the logging boundary.
export class MetaFailure extends Error {
 constructor(code,status=502,providerStatus=null){super('Meta inference failed');this.code=code;this.status=status;this.providerStatus=providerStatus;}
}
export function createMetaInference({key,model,fetchImpl=fetch,timeoutMs=20000}){
 if(typeof key!=='string' || !key.trim() || typeof model!=='string' || !model.trim())throw Error('Meta key and model required');
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000)throw Error('Invalid Meta timeout');
 return async messages=>{
  const signal=AbortSignal.timeout(timeoutMs);
  let response;
  try{
   response=await fetchImpl(ENDPOINT,{method:'POST',redirect:'error',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify({model,messages,max_completion_tokens:4000,temperature:0.1,stream:false}),signal});
   if(!response.ok) {
    await response.body?.cancel();
    const s=response.status;
    const code=s===401?'provider_auth':s===402?'provider_billing':s===403?'provider_access':s===404?'provider_model_or_endpoint':s===429?'provider_rate_limit':s===504?'provider_timeout':s>=500?'provider_service':'provider_request';
    throw new MetaFailure(code,s===504?504:[402,429,503].includes(s)?503:502,s);
   }
   if(!/application\/json/i.test(response.headers.get('content-type')??'')){await response.body?.cancel();throw new MetaFailure('provider_content_type');}
   if(!response.body)throw new MetaFailure('provider_empty_body');
   const reader=response.body.getReader();const chunks=[];let size=0;
   try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>128*1024)throw new MetaFailure('provider_response_size');chunks.push(value);}}
   catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}
   let result;try{result=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new MetaFailure('provider_json');}
   const choice=result?.choices?.[0];
   if(choice?.finish_reason==='length')throw new MetaFailure('provider_truncated');
   if(choice?.finish_reason!=='stop' || typeof choice?.message?.content!=='string')throw new MetaFailure('provider_schema');
   return choice.message.content;
  }catch(error){
   if(signal.aborted || error?.name==='TimeoutError')throw new MetaFailure('provider_timeout',504);
   if(error instanceof MetaFailure)throw error;
   throw new MetaFailure('provider_transport');
  }
 };
}
