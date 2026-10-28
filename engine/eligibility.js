// Pure, offline, deterministic eligibility rules. No I/O or model requests.
// "met" means the supplied fact meets one stated requirement, never issuer verification.
const UNKNOWN = 'unknown';
const statuses = new Set(['met','not_met',UNKNOWN]);
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
function result(id,status,reason,evidence=[]) {
  if (!statuses.has(status)) throw new Error('internal status');
  return {requirementId:id,status,reason,evidence};
}
function validRequirement(r) {
  if (!r || typeof r!=='object' || typeof r.id!=='string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(r.id)) return false;
  return ['minimum_degree','ielts_academic'].includes(r.type);
}
const rank = {secondary:0,bachelor:1,master:2,doctorate:3};
function fact(profile,key) {
  const f=profile?.[key];
  if (!f || typeof f!=='object' || !own(f,'value') || f.value===null || f.value===undefined) return null;
  // Explicitly refuse facts without provenance, including hypothetical data accidentally placed in the real profile.
  if (!['user_declared','document_extracted','issuer_verified'].includes(f.origin)) return null;
  if(f.reviewStatus==='pending'||f.verificationStatus==='rejected'||f.contradicted===true) return null;
  return f;
}
function sourceUrlValid(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}
function boundedScore(v) {
  return typeof v==='number' && Number.isFinite(v) && v>=0 && v<=9 && Number.isInteger(v*2);
}
function evaluateRequirement(requirement,profile) {
  const id=requirement?.id ?? 'invalid';
  if (!validRequirement(requirement) || requirement.ambiguous!==false || typeof requirement.sourceExcerpt!=='string' || !requirement.sourceExcerpt.trim() || typeof requirement.sourceUrl!=='string' || !sourceUrlValid(requirement.sourceUrl))
    return result(id,UNKNOWN,'unreviewed_or_unsupported_requirement');
  if (requirement.type==='minimum_degree') {
    if (!own(rank,requirement.minimum)) return result(id,UNKNOWN,'unsupported_degree');
    const f=fact(profile,'degree');
    if (!f || typeof f.value!=='string' || !own(rank,f.value)) return result(id,UNKNOWN,'missing_or_unsupported_degree');
    return result(id,rank[f.value]>=rank[requirement.minimum]?'met':'not_met','degree_comparison',f.claimIds??[]);
  }
  if (requirement.test!=='IELTS Academic' || !boundedScore(requirement.overallMin) || !boundedScore(requirement.eachBandMin))
    return result(id,UNKNOWN,'unsupported_test_rule');
  const f=fact(profile,'languageTest');
  if (!f) return result(id,UNKNOWN,'missing_language_test');
  const v=f.value;
  if (!v || v.test!=='IELTS Academic' || !boundedScore(v.overall) || !v.bands || typeof v.bands!=='object')
    return result(id,UNKNOWN,'unsupported_or_incomplete_test');
  const names=['listening','reading','writing','speaking'];
  if (!names.every(n=>boundedScore(v.bands[n]))) return result(id,UNKNOWN,'missing_or_invalid_band');
  const pass=v.overall>=requirement.overallMin && names.every(n=>v.bands[n]>=requirement.eachBandMin);
  return result(id,pass?'met':'not_met',pass?'test_thresholds_met':'test_thresholds_not_met',f.claimIds??[]);
}
export function assessRequirement(requirement,profile) {
  const evaluated=evaluateRequirement(requirement,profile);
  return {...evaluated,source:{url:requirement?.sourceUrl??null,excerpt:requirement?.sourceExcerpt??null,provenance:requirement?.provenance??null}};
}
export function assessScholarship(requirements,profile) {
  if (!Array.isArray(requirements) || !profile || typeof profile!=='object') throw new TypeError('Invalid assessment input');
  const results=requirements.map(r=>assessRequirement(r,profile));
  const summary=results.length===0?'unknown':results.some(r=>r.status==='not_met')?'not_met':results.some(r=>r.status==='unknown')?'unknown':'met';
  // Meets enumerated requirements only, not an admission or scholarship award guarantee.
  return {summary,results};
}
export function simulate(requirements,profile,overrides) {
  if (!overrides || typeof overrides!=='object' || Array.isArray(overrides)) throw new TypeError('Invalid overrides');
  const allowed=new Set(['degree','languageTest']);
  if (Object.keys(overrides).some(k=>!allowed.has(k))) throw new Error('Unsupported override');
  const hypothetical=structuredClone(profile);
  for(const [key,value] of Object.entries(overrides)){
    if (value===null || (key==='degree'?typeof value!=='string':typeof value!=='object'||Array.isArray(value))) throw new TypeError('Invalid override value');
    hypothetical[key]={value:structuredClone(value),origin:'user_declared',claimIds:[]};
  }
  return {hypothetical:true,base:assessScholarship(requirements,profile),scenario:assessScholarship(requirements,hypothetical)};
}
