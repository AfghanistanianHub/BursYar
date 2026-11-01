import {createHash} from 'node:crypto';
import {assessRequirement} from './eligibility.js';
const date=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s.replace('Z','.000Z');
// Only trusted server configuration can create a reviewed catalog. Browser
// criteria and model interpretations are never accepted by this interface.
export function createScholarshipCatalog(programs,{now=Date.now}={}){
 if(!Array.isArray(programs)||programs.length>1000)throw Error('Invalid catalog');
 const entries=new Map();
 for(const entry of programs){
  const p=structuredClone(entry);const url=new URL(p.sourceUrl);
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(p.id)||entries.has(p.id)||url.protocol!=='https:'||url.username||url.password||
   p.review?.status!=='approved'||p.review.sourceVerification!=='official_source_reviewed'||
   !Number.isFinite(Date.parse(p.review.reviewedAt))||!date(p.review.expiresAt)||
   typeof p.sourceText!=='string'||p.sourceText.length>100000||p.sourceDigest!==createHash('sha256').update(p.sourceText).digest('hex')||
   !Array.isArray(p.rules)||!p.rules.length||p.rules.length>100)throw Error('Unreviewed catalog');
  const ids=new Set();
  for(const r of p.rules){if(!/^[a-zA-Z0-9_-]{1,80}$/.test(r.id)||ids.has(r.id)||typeof r.sourceExcerpt!=='string'||!r.sourceExcerpt.trim()||!p.sourceText.includes(r.sourceExcerpt))throw Error('Invalid reviewed rule');ids.add(r.id);}
  entries.set(p.id,p);
 }
 return Object.freeze({list:()=>[...entries.values()].filter(p=>Date.parse(p.review.expiresAt)>now()).map(p=>({id:p.id,sourceUrl:p.sourceUrl,review:structuredClone(p.review)})),get:id=>{
  const p=entries.get(id);if(!p||Date.parse(p.review.expiresAt)<=now()||Date.parse(p.review.reviewedAt)>now())throw Error('Scholarship unavailable');return structuredClone(p);
 }});
}
function fact(profile,key){const f=profile?.[key];return f&&['user_declared','document_extracted','issuer_verified'].includes(f.origin)&&f.reviewStatus!=='pending'&&f.verificationStatus!=='rejected'&&f.contradicted!==true?f:null;}
const bool=(v,pass)=>typeof v==='boolean'?(v===pass?'met':'not_met'):'unknown';
function evaluate(r,profile,depth=0){
 if(r.ambiguous===true||r.conflicting===true||depth>2)return 'unknown';
 if(['minimum_degree','ielts_academic','boolean_exclusion','minimum_gpa','toefl_ibt'].includes(r.type))return assessRequirement({...r,ambiguous:false},profile).status;
 if(r.type==='any_of'){
  if(!Array.isArray(r.alternatives)||!r.alternatives.length||r.alternatives.length>10)return 'unknown';
  const statuses=r.alternatives.map(a=>evaluate({...a,id:r.id,sourceUrl:r.sourceUrl,sourceExcerpt:r.sourceExcerpt},profile,depth+1));
  return statuses.includes('met')?'met':statuses.every(s=>s==='not_met')?'not_met':'unknown';
 }
 if(r.type==='academic_minimum'){
  const v=fact(profile,'academicScore')?.value;
  if(!v||!Number.isFinite(v.score)||!Number.isFinite(v.scale)||!Number.isFinite(r.minimum)||!Number.isFinite(r.scale)||r.scale<=0||r.minimum<0||r.minimum>r.scale||v.scale!==r.scale||v.score<0||v.score>v.scale)return 'unknown';
  return v.score>=r.minimum?'met':'not_met';
 }
 if(r.type==='document_available'){
  const v=fact(profile,'documents')?.value;
  if(!['transcripts','language_certificate','passport','recommendation'].includes(r.document)||!Array.isArray(v)||v.some(x=>typeof x!=='string'))return 'unknown';
  // Absence from an incomplete inventory is missing evidence, not proof of absence.
  return v.includes(r.document)?'met':'unknown';
 }
 if(r.type==='deadline'){
  const v=fact(profile,'applicationSubmitted')?.value;
  return date(v)&&date(r.deadline)?Date.parse(v)<=Date.parse(r.deadline)?'met':'not_met':'unknown';
 }
 if(r.type==='funding_condition'&&r.field==='fullTimeEnrollment'&&typeof r.expected==='boolean')return bool(fact(profile,r.field)?.value,r.expected);
 if(r.type==='documented_exemption'&&r.field==='languageExemption'&&r.expected===true)return bool(fact(profile,r.field)?.value,true);
 return 'unknown';
}
export function evaluateReviewedScholarship(program,profile){
 const results=program.rules.map(r=>{const rule={...r,sourceUrl:program.sourceUrl};return {requirementId:r.id,status:evaluate(rule,profile),source:{url:program.sourceUrl,excerpt:r.sourceExcerpt,digest:program.sourceDigest},reason:r.ambiguous||r.conflicting?'conflicting_or_ambiguous':'reviewed_rule_comparison',issuerAuthenticated:false};});
 const summary=results.some(r=>r.status==='not_met')?'not_met':results.length&&results.every(r=>r.status==='met')?'met':'unknown';
 return {summary:summary==='met'&&program.coverageComplete!==true?'unknown':summary,enumeratedSummary:summary,results,externalInference:false,awardGuaranteed:false,coverage:'reviewed_enumerated_requirements_only',requiresHumanReview:true,sourceReview:program.review};
}
