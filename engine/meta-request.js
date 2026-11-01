import {MAX_COMPLETION_TOKENS} from './provider-config.js';
import {EVIDENCE_RESPONSE_FORMAT} from './evidence-contract.js';
export function buildMetaRequest(model,messages){
 return {model,messages,max_completion_tokens:MAX_COMPLETION_TOKENS,reasoning_effort:'low',response_format:EVIDENCE_RESPONSE_FORMAT,stream:false};
}
export function metaReservationUnits(model,messages){
 // Schema, prompt and serialized request overhead all contribute to the bound.
 // Limits/records are unchanged; charge conservatively for the actual request.
 return Buffer.byteLength(JSON.stringify(buildMetaRequest(model,messages)),'utf8')+MAX_COMPLETION_TOKENS;
}
