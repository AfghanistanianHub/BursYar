import {createHash} from 'node:crypto';

// This factory must be initialized exclusively from an operator-controlled,
// separately authenticated, non-user-writable reviewed catalog. Calling the
// factory with caller-provided entries is NOT authorization.
const digest=s=>createHash('sha256').update(s).digest('hex');
const id=/^[A-Za-z0-9_-]{1,80}$/;
const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const officialUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&u.hostname.includes('.')&&!u.hostname.endsWith('.example')&&!u.hostname.endsWith('.test')&&!u.hostname.endsWith('.localhost')&&u.port==='';}catch{return false;}};
function check(entry,requirement,now){
 if(!entry||entry.revoked!==false||entry.reviewStatus!=='human_approved'||entry.sourceStatus!=='official_verified'||entry.acceptanceDecision!=='explicitly_accepted')return false;
 if(!id.test(entry.scholarshipId??'')||!id.test(entry.requirementId??'')||entry.requirementId!==requirement.requirementId||entry.scholarshipId!==requirement.scholarshipId)return false;
 if(!officialUrl(entry.sourceUrl)||entry.sourceUrl!==requirement.source?.url)return false;
 if(typeof entry.sourceText!=='string'||typeof entry.alternativeExcerpt!=='string'||!entry.sourceText.split(/\r?\n/).some(l=>l.trim()===entry.alternativeExcerpt))return false;
 if(!/^[a-f0-9]{64}$/.test(entry.sourceDigest??'')||entry.sourceDigest!==digest(entry.sourceText)||entry.sourceDigest!==requirement.source?.provenance?.sourceDigest)return false;
 if(typeof entry.reviewerId!=='string'||!id.test(entry.reviewerId)||!day(entry.reviewedOn)||!day(entry.expiresOn)||!day(now)||entry.reviewedOn>now||entry.expiresOn<now||entry.expiresOn<entry.reviewedOn)return false;
 if(typeof entry.policyScope!=='string'||entry.policyScope!==requirement.policyScope||!entry.policyScope.trim())return false;
 if(typeof entry.alternativeId!=='string'||!id.test(entry.alternativeId))return false;
 return true;
}
export function createReviewedAlternativeResolver({entries=[],today=()=>new Date().toISOString().slice(0,10)}={}){
 if(!Array.isArray(entries)||entries.length>1000)throw new TypeError('Invalid trusted catalog');
 // Freeze independent snapshot so later mutation cannot change approval.
 const snapshot=structuredClone(entries);
 // A record missing required explicit revocation status is not approved.
 return requirement=>{
  const candidates=snapshot.filter(entry=>entry?.scholarshipId===requirement?.scholarshipId&&entry?.requirementId===requirement?.requirementId&&entry?.policyScope===requirement?.policyScope);
  // Any stale, revoked or contradictory record for the same policy key blocks endorsement.
  if(candidates.length!==1)return null;
  const valid=candidates.filter(entry=>check(entry,requirement,today()));
  if(valid.length!==1)return null;
  const e=valid[0];
  return Object.freeze({alternativeId:e.alternativeId,excerpt:e.alternativeExcerpt,sourceUrl:e.sourceUrl,sourceDigest:e.sourceDigest,reviewedOn:e.reviewedOn,expiresOn:e.expiresOn,reviewStatus:'human_approved'});
 };
}
