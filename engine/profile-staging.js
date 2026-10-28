// Pure local staging of *already extracted* document claims.
// No uploads, network, OCR, storage or official verification in this module.
const allowedFields=new Set(['degree','languageTest']);
const allowedOrigins=new Set(['document_extracted','user_declared']);
const has=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
export function prepareClaims(documentId,claims){
 if(typeof documentId!=='string'|| !/^[a-zA-Z0-9_-]{1,80}$/.test(documentId))throw new TypeError('Invalid document identifier');
 if(!Array.isArray(claims)||claims.length>24)throw new TypeError('Invalid claim list');
 const seen=new Set();
 return claims.map((claim,index)=>{
  if(!claim||typeof claim!=='object'||!allowedFields.has(claim.field)||!has(claim,'value')||claim.value===null||typeof claim.sourceExcerpt!=='string'||!claim.sourceExcerpt.trim()||claim.sourceExcerpt.length>500)throw new TypeError('Invalid extracted claim');
  if(seen.has(claim.field))throw new Error('Duplicate claim requires review');
  seen.add(claim.field);
  return Object.freeze({id:`${documentId}-${index}`,documentId,field:claim.field,value:structuredClone(claim.value),sourceExcerpt:claim.sourceExcerpt,reviewStatus:'pending',verificationStatus:'not_verified'});
 });
}
export function reviewClaims(pending,decisions){
 if(!Array.isArray(pending)||!decisions||typeof decisions!=='object'||Array.isArray(decisions))throw new TypeError('Invalid review');
 const accepted={};
 for(const claim of pending){
  if(!claim || claim.reviewStatus!=='pending')throw new TypeError('Invalid pending claim');
  const choice=decisions[claim.id];
  if(!choice||typeof choice!=='object'|| !['accept','reject','correct'].includes(choice.action))throw new Error('Review decision required');
  if(choice.action==='reject')continue;
  if(choice.action==='correct'&&(!has(choice,'value')||choice.value===null))throw new Error('Correction value required');
  if(accepted[claim.field])throw new Error('Duplicate profile field');
  const corrected=choice.action==='correct';
  accepted[claim.field]={
   value:structuredClone(corrected?choice.value:claim.value),
   origin:corrected?'user_declared':'document_extracted',
   claimIds:corrected?[]:[claim.id],
   verificationStatus:'not_verified',
   sourceDocumentId:claim.documentId,
   reviewStatus:corrected?'corrected_by_user':'accepted_by_user'
  };
 }
 return accepted;
}
export function mergeProfile(existing,updates){
 if(!existing||typeof existing!=='object'||Array.isArray(existing)||!updates||typeof updates!=='object'||Array.isArray(updates))throw new TypeError('Invalid profile');
 const next=structuredClone(existing);
 for(const [key,fact] of Object.entries(updates)){
  if(!allowedFields.has(key)||!fact||!allowedOrigins.has(fact.origin)||fact.verificationStatus!=='not_verified')throw new Error('Invalid fact');
  if(next[key]?.origin==='issuer_verified')throw new Error('Cannot overwrite issuer-verified fact');
  next[key]=structuredClone(fact);
 }
 return next;
}
