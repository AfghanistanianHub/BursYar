import {verifiedAcademicPolicy} from '../data/verified-academic-policy.js';
import {createHash} from 'node:crypto';
import {OXFORD_CLARENDON} from './source-inventory.js';
// Limited official-source excerpts rechecked 2026-10-29. This is not a full
// scholarship specification: missing course deadlines/selection rules force an
// unknown overall result even when both enumerated exclusions are satisfied.
const deferred='Applicants who hold a deferred graduate offer are not eligible to be considered for this scholarship.';
const continuing='Current students who will continue to study for the same degree at Oxford in the next year are not eligible for this scholarship.';
const sourceText=deferred+'\n'+continuing;
export const defaultCatalog=[{id:'oxford-clarendon-exclusions',sourceUrl:OXFORD_CLARENDON,sourceText,sourceDigest:createHash('sha256').update(sourceText).digest('hex'),coverageComplete:false,review:{status:'approved',sourceVerification:'official_source_reviewed',reviewer:'engineering_source_check_not_admissions',reviewedAt:'2026-10-29',expiresAt:'2026-11-29T00:00:00Z'},rules:[
 {id:'deferred',type:'boolean_exclusion',field:'deferredOffer',excludedValue:true,sourceExcerpt:deferred},
 {id:'continuing',type:'boolean_exclusion',field:'continuingSameDegree',excludedValue:true,sourceExcerpt:continuing}
]}];

// Scoped partial comparator: selecting this ID refers only to the named health
// programmes. No overall eligibility/availability inference follows a pass.
const checked=verifiedAcademicPolicy;
defaultCatalog.push({id:checked.id,title:checked.title,sourceUrl:checked.sourceUrl,sourceText:checked.excerpt,sourceDigest:createHash('sha256').update(checked.excerpt).digest('hex'),coverageComplete:false,review:{status:'approved',sourceVerification:'official_source_reviewed',reviewer:'engineering_official_source_check_not_admissions',reviewedAt:checked.checkedAt,expiresAt:new Date(Date.parse(checked.checkedAt)+7*86400000).toISOString().replace('.000Z','Z')},rules:[{id:'health-academic-minimum',type:'academic_minimum',minimum:checked.minimum,scale:checked.scale,sourceExcerpt:checked.excerpt}]});

// Official-source review 2026-11-06: selected explicit exclusions only. A
// nationality declaration alone cannot establish current/former citizenship.
const exclusionExcerpts=[
 'Turkish citizens and individuals who have lost Turkish citizenship',
 'currently enrolled in programs in Turkish universities at the level of education will apply.'
];
const exclusionText=exclusionExcerpts.join('\n');
defaultCatalog.push({id:'turkiye-general-exclusions',title:'Türkiye Scholarships — citizenship and same-level enrolment exclusions',sourceUrl:checked.sourceUrl,sourceText:exclusionText,sourceDigest:createHash('sha256').update(exclusionText).digest('hex'),coverageComplete:false,review:{status:'approved',sourceVerification:'official_source_reviewed',reviewer:'engineering_official_source_check_not_admissions',reviewedAt:'2026-11-06T16:16:41Z',expiresAt:'2026-11-13T16:16:41Z'},rules:[
 {id:'citizenship-exclusion',type:'boolean_exclusion',field:'turkishCitizenshipHistory',excludedValue:true,sourceExcerpt:exclusionExcerpts[0]},
 {id:'same-level-enrolment-exclusion',type:'boolean_exclusion',field:'enrolledInTurkiyeAtTargetLevel',excludedValue:true,sourceExcerpt:exclusionExcerpts[1]}
]});
