import {decideProviderRoute} from './provider-policy.js';
import {dispatchProviderRequest, ProviderDenied, ProviderUnavailable} from './provider-router.js';
import {createSourceFetcher,SourceFailure} from './source-fetch.js';
import {metaReservationUnits} from './meta-request.js';
import {MAX_META_TIMEOUT_MS,safeProviderDiagnostics} from './provider-config.js';
import {DocumentError} from './documents.js';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {MetaFailure} from './meta.js';
import {authenticate} from './auth.js';
import {QuotaExceeded} from './quota.js';
import {validateEvidenceRequest,normalizeEvidence,evidencePrompt,EvidenceFailure} from './evidence.js';
const MAX_BODY=56*1024;
function send(res,status,body){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body));}
async function readInput(req,validate=validateEvidenceRequest,maxBody=MAX_BODY){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']??''))throw Object.assign(Error(),{status:415});
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>maxBody)throw Object.assign(Error(),{status:413});chunks.push(chunk);}
 try{return validate(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{throw Object.assign(Error(),{status:400});}
}export function createInferenceServer({verify,projectId,quota,infer,origin,maxConcurrent=2,canInfer=()=>true,policyContextForRequest=async()=>{throw Error('Provider policy unavailable');},documents=null,sources=createSourceFetcher(),diagnose=record=>console.error(JSON.stringify(record)),geminiInfer=null,selfHostedInfer=null}) {
 if(!verify || !projectId || !quota || !infer || !origin || !Number.isSafeInteger(maxConcurrent) || maxConcurrent<1)throw Error('Missing gateway configuration');
 let active=0;
 const server=createServer(async(req,res)=>{
  if(req.method==='GET' && req.url==='/health')return send(res,200,{ok:true});
  const sourceRoute=req.method==='POST'&&['/api/source','/api/source/import'].includes(req.url);
  const importRoute=req.url==='/api/source/import';
  const documentRoute=/^\/api\/(?:documents(?:\/[a-f0-9-]{36}(?:\/review)?)?|profile)$/.test(req.url??'');
  if(!(req.method==='POST'&&req.url==='/api/analyze')&&!documentRoute&&!sourceRoute)return send(res,404,{error:'Not found'});
  if(req.headers.origin && req.headers.origin!==origin)return send(res,403,{error:'Origin denied'});
  // No CORS headers; proxy same-origin /api to this service. No cookie authentication.
  if(active>=maxConcurrent)return send(res,429,{error:'Busy; retry later'});
  active++;
  const pending=new AbortController();
  const disconnected=()=>{if(!res.writableEnded)pending.abort();};
  res.once('close',disconnected);
  try {
   let uid;try{uid=await authenticate(req.headers.authorization,verify,projectId);}catch{return send(res,401,{error:'Sign in with an approved account'});}
   if(sourceRoute){
    try{const body=await readInput(req,x=>x,importRoute?400*1024:MAX_BODY);const source=importRoute?sources.importSource(body,{uid}):await sources.fetchSource(body?.url,{signal:pending.signal,uid});return send(res,200,source);}
    catch(error){return send(res,error instanceof SourceFailure?(error.code==='busy'?429:422):400,{error:'Source retrieval unavailable',code:error instanceof SourceFailure?error.code:'invalid_request'});}
   }
   if(documentRoute){
    if(!documents)return send(res,503,{error:'Document workflow unavailable'});
    try{
     const id=req.url.split('/')[3];
     if(req.method==='PUT'&&req.url==='/api/profile')return send(res,200,documents.updateProfile(uid,await readInput(req,x=>x)));
     if(req.method==='DELETE'&&req.url==='/api/profile')return send(res,200,documents.deleteProfile(uid));
     if(req.method==='GET'&&req.url==='/api/documents')return send(res,200,documents.list(uid));
     if(req.method==='GET'&&req.url==='/api/profile')return send(res,200,documents.profile(uid));
     if(req.method==='POST'&&req.url==='/api/documents')return send(res,201,documents.upload(uid,await readInput(req,x=>x)));
     if(req.method==='GET'&&id)return send(res,200,documents.get(uid,id));
     if(req.method==='DELETE'&&id)return send(res,200,documents.delete(uid,id));
     if(req.method==='POST'&&id&&req.url.endsWith('/review'))return send(res,200,documents.review(uid,id,(await readInput(req,x=>x))?.decisions));
     return send(res,405,{error:'Method unavailable'});
    }catch(error){return send(res,error instanceof DocumentError?error.status:[400,413,415].includes(error.status)?error.status:503,{error:'Document request unavailable'});}
   }
   const rawInput=await readInput(req,x=>x);
   let input;try{input=validateEvidenceRequest(rawInput);}catch{return send(res,400,{error:'Invalid analysis request'});}
   let retrieval=null;
   if(rawInput.receipt){if(rawInput.sourceApproved!==true)return send(res,400,{error:'Review source before analysis'});try{retrieval=sources.verify(rawInput.receipt,input.text,input.sourceUrl,uid);}catch{return send(res,400,{error:'Source preview expired or changed; fetch again or use manual text'});}}
   // Policy is evaluated before prompts, quota reservation or any provider call.
   // Centralized dispatch: exactly one adapter runs; denies and unconfigured
   // routes produce zero provider calls and never fall back to another provider.
   // Deterministic matching uses the local offline engine (assessScholarship),
   // not this model endpoint, so it is directed there without quota or inference.
   let route;
   try {
    const context=await policyContextForRequest({uid});
    const dispatched=await dispatchProviderRequest(context, {
     meta: async () => 'meta_selected',
     gemini: geminiInfer ? async () => 'gemini_selected' : null,
     selfHosted: selfHostedInfer ? async () => 'self_hosted_selected' : null,
     deterministic: async () => 'deterministic_selected'
    });
    route=dispatched.route;
   } catch(error) {
    if (error instanceof ProviderUnavailable) return send(res,503,{error:'Analysis unavailable'});
    return send(res,403,{error:'Analysis unavailable for this request'});
   }
   if (route==='deterministic') return send(res,403,{error:'Model analysis unavailable for this request; use local deterministic matching'});
   const activeInfer = route==='gemini_eligible' ? geminiInfer : route==='self_hosted' ? selfHostedInfer : infer;
   if(!activeInfer)return send(res,503,{error:'Analysis unavailable'});
   if(!canInfer())return send(res,503,{error:'Analysis unavailable'});
   if(res.destroyed)return;
   const messages=evidencePrompt(input);
   // UTF-8 bytes conservatively bound input tokens; fixed maximum output reservation.
   const units=typeof activeInfer.reservationUnits==='function'?activeInfer.reservationUnits(messages):metaReservationUnits('muse-spark-1.3',messages);
   try{quota.reserve(uid,units);}catch(error){return send(res,error instanceof QuotaExceeded?429:503,{error:error instanceof QuotaExceeded?'Quota exhausted':'Quota storage unavailable'});}
   const started=performance.now(),requestId=randomUUID();
   let stage='provider';
   try {
    const raw=await activeInfer(messages,{signal:pending.signal,requestId});
    stage='evidence';
    const output=normalizeEvidence(raw,input);
    output.sourceProvenance=retrieval??{kind:'user_pasted_text',sourceUrl:input.sourceUrl,retrievedAt:null,suppliedAt:new Date().toISOString(),digest:output.sourceDigest,trust:'user_supplied_unverified'};
    if(retrieval?.kind==='server_fetched')output.retrieval=retrieval;
    try{diagnose({event:'analysis_validated',requestId,stage:'evidence',elapsedMs:Math.round(performance.now()-started),criteriaCount:output.criteria.length,fundingCount:output.funding.length,requiresHumanReview:true,coverageComplete:false});}catch{/* Logging does not alter validation. */}
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
