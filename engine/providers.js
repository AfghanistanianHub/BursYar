import {createMetaInference,MetaFailure} from './meta.js';
import {metaTimeout} from './provider-config.js';
// No fallback, retries, or credential discovery. Configuration is server-owned.
export function createProvider({provider,enabled=false,key,model,endpoint,timeoutMs=60000,fetchImpl=fetch}) {
 if(!['meta','gemini','self_hosted'].includes(provider))throw Error('Unsupported provider');
 const unavailable=Object.freeze({provider,model:model??null,available:false});
 if(enabled!==true||!model||provider!=='self_hosted'&&!key)return unavailable;
 if(provider==='meta'){
  const infer=createMetaInference({key,model,timeoutMs,fetchImpl});
  return Object.freeze({provider,model,available:true,infer,reservationUnits:infer.reservationUnits});
 }
 timeoutMs=metaTimeout(timeoutMs);
 if(provider==='gemini'&&!/^gemini-[a-z0-9.-]+$/.test(model))throw Error('Invalid Gemini model');
 if(provider==='self_hosted'){
  const url=new URL(endpoint);
  // Local reviewed deployment only. No arbitrary remote endpoint / redirects.
  if(model!=='qwen3-local'||url.protocol!=='http:'||!['127.0.0.1','[::1]'].includes(url.hostname)||url.username||url.password||url.search||url.hash||url.pathname!=='/v1/chat/completions')throw Error('Local Qwen endpoint required');
 }
 const build=messages=>provider==='gemini'?{systemInstruction:{parts:messages.filter(m=>m.role!=='user').map(m=>({text:m.content}))},contents:messages.filter(m=>m.role==='user').map(m=>({role:'user',parts:[{text:m.content}]})),generationConfig:{responseMimeType:'application/json',maxOutputTokens:4000}}:{model,messages,max_tokens:4000,stream:false,response_format:{type:'json_object'}};
 const reservationUnits=messages=>Buffer.byteLength(JSON.stringify(build(messages)))+4000;
 const infer=async(messages,{signal:callerSignal}={})=>{
  if(!Array.isArray(messages)||!messages.length||messages.some(m=>!['developer','system','user'].includes(m?.role)||typeof m.content!=='string'))throw new MetaFailure('provider_input',400);
  const controller=new AbortController();const signal=callerSignal?AbortSignal.any([controller.signal,callerSignal]):controller.signal;
  let timer,reader;
  const aborted=new Promise((_,reject)=>{const abort=()=>reject(new MetaFailure(controller.signal.aborted?'provider_timeout':'provider_cancelled',controller.signal.aborted?504:499));signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();});
  timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   if(signal.aborted)await aborted;
   const response=await Promise.race([fetchImpl(provider==='gemini'?`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`:endpoint,{method:'POST',redirect:'error',headers:{'content-type':'application/json',...(provider==='gemini'?{'x-goog-api-key':key}:key?{authorization:`Bearer ${key}`}:{})},body:JSON.stringify(build(messages)),signal}),aborted]);
   if(!response.ok||!/application\/json/i.test(response.headers.get('content-type')??'')||!response.body)throw new MetaFailure('provider_service',response.status===429?503:502);
   reader=response.body.getReader();let size=0;const chunks=[];
   while(true){const {done,value}=await Promise.race([reader.read(),aborted]);if(done)break;size+=value.length;if(size>128*1024)throw new MetaFailure('provider_response_size');chunks.push(value);}
   const json=JSON.parse(Buffer.concat(chunks).toString('utf8'));let raw;
   if(provider==='gemini'){
    const candidate=json.candidates?.[0];if(json.promptFeedback?.blockReason||json.candidates?.length!==1||candidate.finishReason!=='STOP'||candidate.content?.parts?.length!==1||candidate.content.parts[0].thought===true)throw new MetaFailure('provider_schema');raw=candidate.content.parts[0].text;
   }else{const choice=json.choices?.[0];if(json.choices?.length!==1||choice.finish_reason!=='stop'||choice.message?.refusal)throw new MetaFailure('provider_schema');raw=choice.message?.content;}
   if(typeof raw!=='string'||!raw.trim()||raw.length>48000)throw new MetaFailure('provider_schema');JSON.parse(raw);return raw;
  }catch(e){if(e instanceof MetaFailure)throw e;throw new MetaFailure('provider_invalid');}
  finally{clearTimeout(timer);if(reader){reader.cancel().catch(()=>{});reader.releaseLock();}}
 };
 return Object.freeze({provider,model,available:true,infer,reservationUnits});
}
