const ENDPOINT='https://api.meta.ai/v1/chat/completions';
export function createMetaInference({key,model,fetchImpl=fetch,timeoutMs=20000}){
 if(typeof key!=='string' || !key || typeof model!=='string' || !model.trim())throw Error('Meta key and model required');
 return async messages=>{
  const response=await fetchImpl(ENDPOINT,{method:'POST',redirect:'error',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify({model,messages,max_completion_tokens:4000,temperature:0.1,stream:false}),signal:AbortSignal.timeout(timeoutMs)});
  if(!response.ok) {await response.body?.cancel();throw Error('Meta unavailable');}
  if(!/application\/json/i.test(response.headers.get('content-type')??'')){await response.body?.cancel();throw Error('Invalid Meta response');}
  const reader=response.body.getReader();const chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>128*1024)throw Error('Meta response too large');chunks.push(value);}}
  catch(e){await reader.cancel();throw e;}finally{reader.releaseLock();}
  const result=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const choice=result?.choices?.[0];
  if(choice?.finish_reason!=='stop' || typeof choice?.message?.content!=='string')throw Error('Incomplete Meta result');
  return choice.message.content;
 };
}
