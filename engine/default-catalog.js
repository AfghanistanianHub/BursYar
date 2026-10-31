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
