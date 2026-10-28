import {buildMetaRequest,metaReservationUnits} from './meta-request.js';
import {EVIDENCE_LIMITS} from './evidence-contract.js';
import {DEFAULT_META_TIMEOUT_MS,MAX_COMPLETION_TOKENS,metaTimeout,safeModel,safeTransportCode,safeProviderDiagnostics,safeFinishReason,safeTokenCount,safeRequestId} from './provider-config.js';
const ENDPOINT='https://api.meta.ai/v1/chat/completions';
export class MetaFailure extends Error {
 constructor(code,status=502,providerStatus=null,diagnostics){
  super('Meta inference failed');this.code=code;this.status=status;this.providerStatus=providerStatus;
  if(diagnostics)this.diagnostics=Object.freeze(safeProviderDiagnostics(diagnostics));
 }
}
// Enforce cancellation even for a stalled body reader. The real fetch also
// receives the signal so cancellation tears down its own request/response.
function abortable(operation,signal){
 if(signal.aborted){Promise.resolve(operation).catch(()=>{});return Promise.reject(signal.reason);}
 return new Promise((resolve,reject)=>{
  const abort=()=>reject(signal.reason);signal.addEventListener('abort',abort,{once:true});
  Promise.resolve(operation).then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));
 });
}
export function createMetaInference({key,model,fetchImpl=fetch,timeoutMs=DEFAULT_META_TIMEOUT_MS,onMetrics=()=>{}}){
 if(typeof key!=='string'||!key.trim()||typeof model!=='string'||!model.trim())throw Error('Meta key and model required');
 timeoutMs=metaTimeout(timeoutMs);
 const configuration=Object.freeze({event:'meta_configuration',model:safeModel(model),timeoutMs,maxCompletionTokens:MAX_COMPLETION_TOKENS,stream:false,reasoningEffort:'low',responseFormat:'json_schema',responseSchema:'bursyar_evidence_v1',maxCriteria:EVIDENCE_LIMITS.criteria});
 const infer=async(messages,{signal:callerSignal,requestId}={})=>{
  if(!Array.isArray(messages)||messages.some(m=>!m||typeof m.content!=='string'))throw new MetaFailure('provider_input',400);
  const body=JSON.stringify(buildMetaRequest(model,messages));
  const started=performance.now(),deadline=new AbortController(),timeoutReason=new Error('Local provider deadline');
  const signal=callerSignal?AbortSignal.any([deadline.signal,callerSignal]):deadline.signal;
  const timer=setTimeout(()=>deadline.abort(timeoutReason),timeoutMs);
  const diagnostics={requestId:safeRequestId(requestId),phase:'awaiting_response_headers',model:safeModel(model),timeoutMs,requestBytes:Buffer.byteLength(body,'utf8'),messagesBytes:Buffer.byteLength(JSON.stringify(messages),'utf8'),messageCount:messages.length,inputCodeUnits:messages.reduce((n,m)=>n+(typeof m?.content==='string'?m.content.length:0),0),maxCompletionTokens:MAX_COMPLETION_TOKENS,headersAfterMs:null,firstBodyByteAfterMs:null,responseBytes:0,reasoningEffort:'low',responseFormat:'json_schema',responseSchema:'bursyar_evidence_v1',maxCriteria:EVIDENCE_LIMITS.criteria,finishReason:null,promptTokens:null,completionTokens:null,totalTokens:null,reasoningTokens:null};
  let response,reader;
  try{
   if(signal.aborted)throw signal.reason;
   response=await abortable(fetchImpl(ENDPOINT,{method:'POST',redirect:'error',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body,signal}),signal);
   diagnostics.phase='response_headers';diagnostics.headersAfterMs=Math.round(performance.now()-started);
   if(!response.ok){
    await abortable(response.body?.cancel(),signal);
    const s=response.status;
    const code=s===401?'provider_auth':s===402?'provider_billing':s===403?'provider_access':s===404?'provider_model_or_endpoint':s===429?'provider_rate_limit':s===504?'provider_timeout':s>=500?'provider_service':'provider_request';
    if(s===504)diagnostics.timeoutCause='provider_http_504';
    throw new MetaFailure(code,s===504?504:[402,429,503].includes(s)?503:502,s);
   }
   if(!/application\/json/i.test(response.headers.get('content-type')??'')){await abortable(response.body?.cancel(),signal);throw new MetaFailure('provider_content_type');}
   if(!response.body)throw new MetaFailure('provider_empty_body');
   diagnostics.phase='reading_response_body';reader=response.body.getReader();const chunks=[];
   while(true){
    const {done,value}=await abortable(reader.read(),signal);if(done)break;
    if(value.length&&diagnostics.firstBodyByteAfterMs===null)diagnostics.firstBodyByteAfterMs=Math.round(performance.now()-started);
    diagnostics.responseBytes+=value.length;
    if(diagnostics.responseBytes>128*1024)throw new MetaFailure('provider_response_size');
    chunks.push(value);
   }
   diagnostics.phase='validating_response';
   let result;try{result=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new MetaFailure('provider_json');}
   const choice=result?.choices?.[0];
   // Capture allowlisted metadata BEFORE rejecting a truncated or invalid choice.
   diagnostics.finishReason=safeFinishReason(choice?.finish_reason);
   diagnostics.promptTokens=safeTokenCount(result?.usage?.prompt_tokens);
   diagnostics.completionTokens=safeTokenCount(result?.usage?.completion_tokens);
   diagnostics.totalTokens=safeTokenCount(result?.usage?.total_tokens);
   diagnostics.reasoningTokens=safeTokenCount(result?.usage?.completion_tokens_details?.reasoning_tokens);
   if(choice?.finish_reason==='length')throw new MetaFailure('provider_truncated');
   if(!Array.isArray(result?.choices)||result.choices.length!==1||choice?.finish_reason!=='stop'||typeof choice?.message?.content!=='string'||!choice.message.content.trim())throw new MetaFailure('provider_schema');
   if(choice.message.refusal)throw new MetaFailure('provider_refusal');
   try{onMetrics({event:'meta_response',...safeProviderDiagnostics(diagnostics),elapsedMs:Math.round(performance.now()-started),costUSD:null});}catch{/* Logging cannot alter inference. */}
   return choice.message.content;
  }catch(error){
   if(signal.aborted){
    diagnostics.timeoutCause=signal.reason===timeoutReason?'local_deadline':'caller_cancelled';
    throw new MetaFailure(diagnostics.timeoutCause==='local_deadline'?'provider_timeout':'provider_cancelled',diagnostics.timeoutCause==='local_deadline'?504:499,response?.status??null,diagnostics);
   }
   diagnostics.transportCode=safeTransportCode(error);
   if(error instanceof MetaFailure)throw new MetaFailure(error.code,error.status,error.providerStatus??response?.status??null,diagnostics);
   throw new MetaFailure('provider_transport',502,response?.status??null,diagnostics);
  }finally{
   clearTimeout(timer);
   // Do not wait indefinitely for a misbehaving stream's cancellation hook.
   if(reader){reader.cancel().catch(()=>{});reader.releaseLock();}
  }
 };
 infer.configuration=configuration;infer.reservationUnits=messages=>metaReservationUnits(model,messages);return infer;
}
