// Shared public limits only; no credentials or provider fallback.
export const DEFAULT_META_TIMEOUT_MS=60000;
export const MAX_META_TIMEOUT_MS=120000;
export const MAX_COMPLETION_TOKENS=4000;
export const CLIENT_ANALYSIS_TIMEOUT_MS=MAX_META_TIMEOUT_MS+15000;
export function metaTimeout(value=DEFAULT_META_TIMEOUT_MS){
 const n=typeof value==='string'&&/^[0-9]+$/.test(value)?Number(value):value;
 if(!Number.isSafeInteger(n)||n<1||n>MAX_META_TIMEOUT_MS)throw Error('Invalid Meta timeout');
 return n;
}
const models=new Set(['muse-spark-1.1','muse-spark-1.2','muse-spark-1.3','muse-spark-1.2-contributor','muse-spark-1.3-contributor','muse-wonder-1.0']);
export const safeModel=model=>models.has(model)?model:'other_configured_model';
const phases=new Set(['awaiting_response_headers','response_headers','reading_response_body','validating_response']);
const causes=new Set(['local_deadline','caller_cancelled','provider_http_504']);
const finishes=new Set(['stop','length','tool_calls','content_filter','function_call','unrecognized']);
export const safeFinishReason=value=>value==null?null:finishes.has(value)?value:'unrecognized';
export const safeTokenCount=value=>Number.isSafeInteger(value)&&value>=0&&value<=10000000?value:null;
const codes=new Set(['ENOTFOUND','EAI_AGAIN','ECONNREFUSED','ECONNRESET','ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT','CERT_HAS_EXPIRED','UNABLE_TO_VERIFY_LEAF_SIGNATURE','ERR_TLS_CERT_ALTNAME_INVALID','DEPTH_ZERO_SELF_SIGNED_CERT']);
export function safeTransportCode(error){
 // Never retain errors, messages, stack traces, URLs or arbitrary codes.
 for(let depth=0;error&&depth<4;depth++,error=error.cause)if(codes.has(error.code))return error.code;
 return null;
}
export const safeRequestId=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value)?value:undefined;
export function safeProviderDiagnostics(value){
 if(!value||typeof value!=='object')return undefined;
 const output={};
 if(safeRequestId(value.requestId))output.requestId=value.requestId;
 if(phases.has(value.phase))output.phase=value.phase;
 if(causes.has(value.timeoutCause))output.timeoutCause=value.timeoutCause;
 if(models.has(value.model)||value.model==='other_configured_model')output.model=value.model;
 if(codes.has(value.transportCode))output.transportCode=value.transportCode;
 if(value.finishReason===null||finishes.has(value.finishReason))output.finishReason=value.finishReason;
 if(value.reasoningEffort==='low')output.reasoningEffort='low';
 if(value.responseFormat==='json_schema')output.responseFormat='json_schema';
 if(value.responseSchema==='bursyar_evidence_v1')output.responseSchema='bursyar_evidence_v1';
 for(const key of ['timeoutMs','requestBytes','messagesBytes','messageCount','inputCodeUnits','maxCompletionTokens','headersAfterMs','firstBodyByteAfterMs','responseBytes','promptTokens','completionTokens','totalTokens','reasoningTokens','maxCriteria']){
  const n=value[key];if(n===null)output[key]=null;else if(Number.isSafeInteger(n)&&n>=0&&n<=10000000)output[key]=n;
 }
 return output;
}
