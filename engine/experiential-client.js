// Explicit Experiential Chat Completions client. No implicit provider fallback.
export const EXPERIENTIAL_BASE_URL='https://api.experientiallabs.ai/v1';
export const EXPERIENTIAL_MODEL='claude-opus-5.5';
export function createExperientialClient({apiKey=process.env.EXPLABS_API_KEY,fetchImpl=fetch,timeoutMs=60000}={}){
 if(typeof apiKey!=='string'||!apiKey.trim())throw Error('EXPLABS_API_KEY is required');
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>120000)throw Error('Invalid gateway timeout');
 return Object.freeze({
  async createChatCompletion(request,{signal}={}){
   if(!request||typeof request!=='object'||Array.isArray(request))throw Error('Chat completion request required');
   if(request.model!==undefined&&request.model!==EXPERIENTIAL_MODEL)throw Error('Model mismatch');
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),timeoutMs);
   const combined=signal?AbortSignal.any([signal,controller.signal]):controller.signal;
   try {
   const response=await fetchImpl(EXPERIENTIAL_BASE_URL+'/chat/completions',{
    method:'POST',redirect:'error',signal:combined,
    headers:{'content-type':'application/json',authorization:`Bearer ${apiKey}`},
    body:JSON.stringify({...request,model:EXPERIENTIAL_MODEL})
   });
   if(!response.ok)throw Error(`Experiential gateway HTTP ${response.status}`);
   if(request.stream===true)return response; // Preserve SSE response and streaming tool deltas.
   if(!/application\/json/i.test(response.headers.get('content-type')??''))throw Error('Unexpected gateway response type');
   const body=await response.text();
   if(body.length>131072)throw Error('Gateway response too large');
   return JSON.parse(body); // Preserve OpenAI tool_calls and usage unmodified.
   } finally {clearTimeout(timeout); }
  }
 });
}
