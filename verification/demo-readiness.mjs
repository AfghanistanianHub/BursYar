// Pure, testable readiness helpers for verification/start-demo.mjs. No network,
// no secrets, no filesystem access. A healthy server or listed model is never
// described as successful inference.
export function classifyCatalogAttempt({hasKey=false,hasModel=false}={}){
 if(!hasKey||!hasModel)return {event:'meta_model_access_skipped',reason:'meta_key_or_model_not_configured',inferenceVerified:false,deterministicOnly:true};
 return null;
}
export function catalogUnavailableEvent(reason){
 return {event:'meta_model_access_unavailable',reason, inferenceVerified:false,deterministicOnly:true};
}
export function catalogVerifiedEvent(){
 return {event:'meta_model_access_verified',inferenceVerified:false};
}
// Build the exact console lines start-demo prints after the backend is up.
// capabilities is the parsed /health body (or null when the backend predates it).
export function buildReadinessLines({spendingConfirmed=false,spendLimitUSD=0,capabilities=null,catalog=null}={}){
 const lines=[];
 lines.push(spendingConfirmed
  ?`Spending confirmation loaded: USD ${Number(spendLimitUSD)} account cap; manual inference only.`
  :'Live inference DISABLED: account spending limit is not confirmed.');
 if(capabilities&&typeof capabilities==='object'&&capabilities.meta){
  const meta=capabilities.meta;
  const docs=capabilities.documentStorage?.available===true?'available':'unavailable';
  const local=capabilities.localAssessment?.available===true?'available':'unavailable';
  const sources=capabilities.sourceRetrieval?.available===true?'available':'unavailable';
  lines.push(`Capabilities: local assessment ${local}; source retrieval ${sources}; document storage ${docs}; Meta ${meta.state} (${meta.reason}).`);
  if(meta.actionable)lines.push(`Meta detail: ${meta.actionable}`);
  lines.push('Inference verified: false. Server health and model catalog listing never imply successful inference.');
  return {lines,deterministicOnly:capabilities.deterministicOnly!==false&&meta.state!=='configured'};
 }
 // Fallback for a backend without capability reporting: never imply inference.
 lines.push('Capabilities: backend status unavailable; deterministic features only. Inference verified: false.');
 return {lines,deterministicOnly:true};
}
export function readyLine({origin,deterministicOnly=false}){
 const mode=deterministicOnly?'ready (deterministic-only)':'ready';
 return `BursYar ${mode} at ${origin}. Use the existing Google demo sign-in; submit Oxford only after spending confirmation. Ctrl+C stops both services.`;
}
