import {resolveFamilyScope} from './family.js';
import {evaluateReviewedScholarship} from './deterministic.js';
import {authorizeAnalysisContext} from './provider-policy.js';
import {createSourceFetcher,SourceFailure} from './source-fetch.js';
import {auditScholarshipEvidence} from './source-provenance.js';
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
}
export function createInferenceServer({verify,projectId,quota,infer,origin,maxConcurrent=2,canInfer=()=>true,providers=null,catalog=null,loadFamilyGrant=null,policyContextForRequest=async()=>{throw Error('Provider policy unavailable');},documents=null,sources=createSourceFetcher(),diagnose=record=>console.error(JSON.stringify(record))}){
 if(!verify || !projectId || !quota || (!infer&&!providers) || !origin || !Number.isSafeInteger(maxConcurrent) || maxConcurrent<1)throw Error('Missing gateway configuration');
 let active=0;
 const server=createServer(async(req,res)=>{
  if(req.method==='GET' && req.url==='/health')return send(res,200,{ok:true});
  let route=req.url;
  const family=/^\/api\/family\/([a-zA-Z0-9_-]{1,80})(\/.*)$/.exec(route??'');
  if(family)route='/api'+family[2];
  const localRoute=['/api/evaluate','/api/scholarships','/api/export','/api/erase'].includes(route);
  const sourceRoute=!family&&req.method==='POST'&&['/api/source','/api/source/import'].includes(route);
  const importRoute=route==='/api/source/import';
  const documentRoute=/^\/api\/(?:documents(?:\/[a-f0-9-]{36}(?:\/review)?)?|profile)$/.test(route??'');
  if(!(req.method==='POST'&&req.url==='/api/analyze')&&!documentRoute&&!sourceRoute&&!localRoute&&!family)return send(res,404,{error:'Not found'});
  if(req.headers.origin && req.headers.origin!==origin)return send(res,403,{error:'Origin denied'});
  // No CORS headers; proxy same-origin /api to this service. No cookie authentication.
  if(active>=maxConcurrent)return send(res,429,{error:'Busy; retry later'});
  active++;
  const pending=new AbortController();
  const disconnected=()=>{if(!res.writableEnded)pending.abort();};
  res.once('close',disconnected);
  try {
   let uid;try{uid=await authenticate(req.headers.authorization,verify,projectId);}catch{return send(res,401,{error:'Sign in with an approved account'});}
   let storageOwner=uid;
   if(family){
    // Family routes have no generative endpoint, even for an adult guardian.
    if(!documentRoute&&!localRoute)return send(res,403,{error:'Family request unavailable'});
    try{storageOwner=(await resolveFamilyScope({uid,subjectId:family[1],loadGrant:loadFamilyGrant})).storageOwner;}catch{return send(res,403,{error:'Family request unavailable'});}
    // A majority handoff durably revokes the old guardian-scoped data route.
    if(documents?.isTransferred(storageOwner))return send(res,403,{error:'Family request unavailable'});
   }
   if(localRoute){
    try{
     if(route==='/api/scholarships'&&req.method==='GET')return send(res,200,{scholarships:catalog?.list()??[],externalInference:false});
     if(!documents)return send(res,503,{error:'Local processing unavailable'});
     if(route==='/api/evaluate'&&req.method==='POST'){
      const body=await readInput(req,x=>x);if(!catalog||typeof body?.scholarshipId!=='string')return send(res,422,{error:'Reviewed scholarship unavailable'});
      return send(res,200,evaluateReviewedScholarship(catalog.get(body.scholarshipId),documents.profile(storageOwner)));
     }
     if(route==='/api/export'&&req.method==='GET')return send(res,200,{profile:documents.profile(storageOwner),documents:documents.list(storageOwner).map(d=>documents.get(storageOwner,d.id)),issuerAuthenticated:false});
     if(route==='/api/erase'&&req.method==='DELETE'){
      documents.eraseOwner(storageOwner);return send(res,200,{deleted:true});
     }
     return send(res,405,{error:'Method unavailable'});
    }catch{return send(res,422,{error:'Local processing unavailable'});}
   }
   if(sourceRoute){
    try{const body=await readInput(req,x=>x,importRoute?400*1024:MAX_BODY);const source=importRoute?sources.importSource(body,{uid}):await sources.fetchSource(body?.url,{signal:pending.signal,uid});return send(res,200,source);}
    catch(error){return send(res,error instanceof SourceFailure?(error.code==='busy'?429:422):400,{error:'Source retrieval unavailable',code:error instanceof SourceFailure?error.code:'invalid_request'});}
   }
   if(documentRoute){
    if(!documents)return send(res,503,{error:'Document workflow unavailable'});
    try{
     const id=route.split('/')[3];
     if(req.method==='PUT'&&route==='/api/profile')return send(res,200,documents.updateProfile(storageOwner,await readInput(req,x=>x)));
     if(req.method==='DELETE'&&route==='/api/profile')return send(res,200,documents.deleteProfile(storageOwner));
     if(req.method==='GET'&&route==='/api/documents')return send(res,200,documents.list(storageOwner));
     if(req.method==='GET'&&route==='/api/profile')return send(res,200,documents.profile(storageOwner));
     if(req.method==='POST'&&route==='/api/documents')return send(res,201,documents.upload(storageOwner,await readInput(req,x=>x)));
     if(req.method==='GET'&&id)return send(res,200,documents.get(storageOwner,id));
     if(req.method==='DELETE'&&id)return send(res,200,documents.delete(storageOwner,id));
     if(req.method==='POST'&&id&&route.endsWith('/review'))return send(res,200,documents.review(storageOwner,id,(await readInput(req,x=>x))?.decisions));
     return send(res,405,{error:'Method unavailable'});
    }catch(error){return send(res,error instanceof DocumentError?error.status:[400,413,415].includes(error.status)?error.status:503,{error:'Document request unavailable'});}
   }
   const rawInput=await readInput(req,x=>x);
   let input;try{input=validateEvidenceRequest(rawInput);}catch{return send(res,400,{error:'Invalid analysis request'});}
   let retrieval=null;
   if(rawInput.receipt){if(rawInput.sourceApproved!==true)return send(res,400,{error:'Review source before analysis'});try{retrieval=sources.verify(rawInput.receipt,input.text,input.sourceUrl,uid);}catch{return send(res,400,{error:'Source preview expired or changed; fetch again or use manual text'});}}
   // Policy is evaluated before prompts, quota reservation or any provider call.
   let adapter,context;
   {
    try {context=await policyContextForRequest({uid});}catch {return send(res,403,{error:'Analysis unavailable for this request'});}
    const decision=authorizeAnalysisContext(context);
    if (!decision.allowed || decision.route==='deterministic'||loadFamilyGrant&&context.provider!=='self_hosted')return send(res,403,{error:'Analysis unavailable for this request'});
   }
   adapter=providers?.[context.provider??'meta']??(!providers&&infer?{provider:'meta',model:infer.configuration?.model,available:true,infer,reservationUnits:infer.reservationUnits,quota}:null);
   if(adapter&&adapter.model!==context.model)return send(res,403,{error:'Analysis unavailable for this request'});
   if(!adapter||adapter.available!==true||typeof adapter.infer!=='function')return send(res,503,{error:'Analysis unavailable'});
   if(adapter.provider!==(context.provider??'meta'))return send(res,403,{error:'Analysis unavailable for this request'});
   if(!canInfer(adapter.provider))return send(res,503,{error:'Analysis unavailable'});
   if(res.destroyed)return;
   const messages=evidencePrompt(input);
   // UTF-8 bytes conservatively bound input tokens; fixed maximum output reservation.
   const units=typeof adapter.reservationUnits==='function'?adapter.reservationUnits(messages):metaReservationUnits(adapter.model,messages);
   if(!Number.isSafeInteger(units)||units<1||(context.maxReservationUnits!==undefined&&units>context.maxReservationUnits))return send(res,403,{error:'Analysis unavailable for this request'});
   try{(adapter.quota??quota).reserve(uid,units);}catch(error){return send(res,error instanceof QuotaExceeded?429:503,{error:error instanceof QuotaExceeded?'Quota exhausted':'Quota storage unavailable'});}
   const started=performance.now(),requestId=randomUUID();
   let stage='provider';
   try {
    const raw=await adapter.infer(messages,{signal:pending.signal,requestId});
    stage='evidence';
    const output=normalizeEvidence(raw,input);
    // A source receipt is verified by sources.verify(uid, digest, URL) above.
    // Only a verified server-fetched receipt can attest collection time;
    // it still cannot establish issuer authenticity or institutional policy.
    if (retrieval?.kind==='server_fetched') {
      const collected=typeof retrieval.retrievedAt==='string'?retrieval.retrievedAt.slice(0,10):null;
      const checked=new Date().toISOString().slice(0,10);
      output.sourceAudits=output.criteria.map(criterion=>({
        criterionId:criterion.id,
        ...auditScholarshipEvidence({
          sourceUrl:input.sourceUrl,sourceText:input.text,excerpt:criterion.excerpt,
          expectedDigest:output.sourceDigest,capturedOn:collected,checkedOn:checked,
          contradictions:output.compilation.contradictions.filter(x=>x.requirementIds?.includes(criterion.id))
        })
      }));
    }
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
