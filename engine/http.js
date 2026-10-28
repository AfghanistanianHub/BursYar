import {MAX_META_TIMEOUT_MS,MAX_COMPLETION_TOKENS,safeProviderDiagnostics} from './provider-config.js';
import {DocumentError} from './documents.js';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {MetaFailure} from './meta.js';
import {authenticate} from './auth.js';
import {QuotaExceeded} from './quota.js';
import {validateEvidenceRequest,normalizeEvidence,evidencePrompt,EvidenceFailure} from './evidence.js';
const MAX_BODY=56*1024;
function send(res,status,body){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body));}
async function readInput(req,validate=validateEvidenceRequest){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']??''))throw Object.assign(Error(),{status:415});
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw Object.assign(Error(),{status:413});chunks.push(chunk);}
 try{return validate(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{throw Object.assign(Error(),{status:400});}
}
export function createInferenceServer({verify,projectId,quota,infer,origin,maxConcurrent=2,canInfer=()=>true,documents=null,diagnose=record=>console.error(JSON.stringify(record))}){
 if(!verify || !projectId || !quota || !infer || !origin || !Number.isSafeInteger(maxConcurrent) || maxConcurrent<1)throw Error('Missing gateway configuration');
 let active=0;
 const server=createServer(async(req,res)=>{
  if(req.method==='GET' && req.url==='/health')return send(res,200,{ok:true});
  const documentRoute=/^\/api\/(?:documents(?:\/[a-f0-9-]{36}(?:\/review)?)?|profile)$/.test(req.url??'');
  if(!(req.method==='POST'&&req.url==='/api/analyze')&&!documentRoute)return send(res,404,{error:'Not found'});
  if(req.headers.origin && req.headers.origin!==origin)return send(res,403,{error:'Origin denied'});
  // No CORS headers; proxy same-origin /api to this service. No cookie authentication.
  if(active>=maxConcurrent)return send(res,429,{error:'Busy; retry later'});
  active++;
  const pending=new AbortController();
  const disconnected=()=>{if(!res.writableEnded)pending.abort();};
  res.once('close',disconnected);
  try {
   let uid;try{uid=await authenticate(req.headers.authorization,verify,projectId);}catch{return send(res,401,{error:'Sign in with an approved account'});}
   if(documentRoute){
    if(!documents)return send(res,503,{error:'Document workflow unavailable'});
    try{
     const id=req.url.split('/')[3];
     if(req.method==='GET'&&req.url==='/api/profile')return send(res,200,documents.profile(uid));
     if(req.method==='POST'&&req.url==='/api/documents')return send(res,201,documents.upload(uid,await readInput(req,x=>x)));
     if(req.method==='GET'&&id)return send(res,200,documents.get(uid,id));
     if(req.method==='DELETE'&&id)return send(res,200,documents.delete(uid,id));
     if(req.method==='POST'&&id&&req.url.endsWith('/review'))return send(res,200,documents.review(uid,id,(await readInput(req,x=>x))?.decisions));
     return send(res,405,{error:'Method unavailable'});
    }catch(error){return send(res,error instanceof DocumentError?error.status:[400,413,415].includes(error.status)?error.status:503,{error:'Document request unavailable'});}
   }
   const input=await readInput(req);
   if(!canInfer())return send(res,503,{error:'Analysis unavailable'});
   if(res.destroyed)return;
   const messages=evidencePrompt(input);
   // UTF-8 bytes conservatively bound input tokens; fixed maximum output reservation.
   const units=Buffer.byteLength(JSON.stringify(messages),'utf8')+MAX_COMPLETION_TOKENS;
   try{quota.reserve(uid,units);}catch(error){return send(res,error instanceof QuotaExceeded?429:503,{error:error instanceof QuotaExceeded?'Quota exhausted':'Quota storage unavailable'});}
   const started=performance.now(),requestId=randomUUID();
   let stage='provider';
   try {
    const raw=await infer(messages,{signal:pending.signal});
    stage='evidence';
    const output=normalizeEvidence(raw,input);
    return send(res,200,output);
   }catch(error){
    const known=error instanceof MetaFailure;
    // Never spread an error or log messages, headers, source, UID or model output.
    const record={event:'analysis_failed',requestId,stage,code:known?error.code:error instanceof EvidenceFailure?error.code:stage==='evidence'?'evidence_invalid':'provider_unknown',providerStatus:known?error.providerStatus:null,elapsedMs:Math.round(performance.now()-started),...(known&&error.diagnostics?{provider:safeProviderDiagnostics(error.diagnostics)}:{})};
    try{diagnose(record);}catch{/* Logging failure must not change the safe response. */}
    return send(res,known?error.status:502,{error:'Analysis unavailable'});
   }
  }catch(error){return send(res,[400,413,415].includes(error.status)?error.status:500,{error:'Invalid analysis request'});}
  finally{active--;res.off('close',disconnected);}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;server.timeout=MAX_META_TIMEOUT_MS+10000;
 return server;
}
