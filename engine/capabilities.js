// Truthful runtime capability reporting. No secrets, keys, tokens, digests of
// private data, or cost estimates. A healthy HTTP server or a listed model is
// never described as successful inference; inferenceVerified is always false
// at startup. Per-request policy authorization is still required when Meta is
// configured.
const META_ACTIONS={
 provider_config_missing:'Provision an owner-only provider config file and set BURSYAR_PROVIDER_CONFIG. Deterministic features remain available.',
 provider_disabled:'Meta provider is not enabled in provider config (enabled!==true). Deterministic features remain available.',
 family_deployment_disables_meta:'Family-grants deployments disable Meta and Gemini. Use the deterministic path or a separately reviewed self-hosted deployment.',
 meta_credentials_missing:'Meta API key not configured for the enabled provider. Deterministic features remain available.',
 spending_not_confirmed:'Confirm the account spending limit after verifying the external cap (start-bursyar.command --confirm-spending-usd 5).',
 spending_not_approved:'Provider config requires spendingApproved:true with reviewed worstCaseUsdPerUnit and spendLimitUSD.',
 policy_records_unavailable:'Provision owner-only policy records and set BURSYAR_POLICY_RECORDS. Each request still requires a valid trusted record.',
 policy_authorization_required_per_request:'Meta inference is configured. Each /api/analyze request still requires a valid trusted policy record; catalog listing and server health never imply successful inference.'
};
export function describeMeta({providerConfigPresent=false,providerEnabled=false,familyGrantsPresent=false,metaAvailable=false,spendingConfirmed=false,spendingApproved=false,policyRecordsConfigured=false}={}){
 let state,reason;
 if(familyGrantsPresent&&providerEnabled){state='blocked';reason='family_deployment_disables_meta';}
 else if(!providerConfigPresent){state='disabled';reason='provider_config_missing';}
 else if(!providerEnabled){state='disabled';reason='provider_disabled';}
 else if(!metaAvailable){state='disabled';reason='meta_credentials_missing';}
 else if(!spendingConfirmed){state='disabled';reason='spending_not_confirmed';}
 else if(!spendingApproved){state='disabled';reason='spending_not_approved';}
 else if(!policyRecordsConfigured){state='blocked';reason='policy_records_unavailable';}
 else{state='configured';reason='policy_authorization_required_per_request';}
 return Object.freeze({state,reason,actionable:META_ACTIONS[reason],inferenceVerified:false});
}
export function describeCapabilities(input={}){
 const meta=describeMeta(input);
 const documentsAvailable=input.documentsAvailable===true;
 const catalogAvailable=input.catalogAvailable!==false;
 return Object.freeze({
  localAssessment:catalogAvailable
   ?Object.freeze({available:true,externalInference:false})
   :Object.freeze({available:false,reason:'catalog_unavailable',actionable:'Reviewed catalog failed to load; restart with a valid BURSYAR_REVIEWED_CATALOG or the built-in default.'}),
  sourceRetrieval:Object.freeze({available:true,trust:'public_web_unverified'}),
  documentStorage:documentsAvailable
   ?Object.freeze({available:true})
   :Object.freeze({available:false,reason:'document_database_not_configured',actionable:'Configure a durable private document store (SQLite path or server-only Supabase adapter) and restart.'}),
  meta,
  deterministicOnly:meta.state!=='configured',
  inferenceVerified:false
 });
}
// Single-line human summary for launcher logs. Never claims inference success.
export function formatCapabilities(capabilities){
 if(!capabilities||typeof capabilities!=='object')return 'Capabilities unknown: backend did not report status; inference not verified.';
 const local=capabilities.localAssessment?.available===true?'available':'unavailable';
 const docs=capabilities.documentStorage?.available===true?'available':'unavailable';
 const sources=capabilities.sourceRetrieval?.available===true?'available':'unavailable';
 const meta=capabilities.meta;
 const metaText=meta&&typeof meta.state==='string'
  ?`Meta ${meta.state} (${meta.reason??'unknown_reason'})`
  :'Meta status unknown';
 return `Local assessment ${local}; source retrieval ${sources}; document storage ${docs}; ${metaText}. Inference verified: false.`;
}
