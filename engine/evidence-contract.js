// Versioned, compact response contract. Shape constraints never prove source truth.
export const EVIDENCE_LIMITS=Object.freeze({criteria:4,funding:2,excerpt:600,explanation:120});
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const sentence={type:'string',minLength:10,maxLength:EVIDENCE_LIMITS.excerpt};
const explanation={type:'string',minLength:1,maxLength:EVIDENCE_LIMITS.explanation};
function freeze(value){if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;}
export const EVIDENCE_RESPONSE_FORMAT=freeze({type:'json_schema',json_schema:{name:'bursyar_evidence_v1',strict:true,schema:object({
 criteria:{type:'array',maxItems:EVIDENCE_LIMITS.criteria,items:object({kind:{type:'string',enum:['education','transcripts','language_test','travel_document','other']},required:{type:['boolean','null']},excerpt:sentence,en:explanation,fa:explanation,ps:explanation})},
 deadline:{type:['string','null'],minLength:10,maxLength:EVIDENCE_LIMITS.excerpt},
 funding:{type:'array',maxItems:EVIDENCE_LIMITS.funding,items:sentence}
})}});
export function exactKeys(value,keys){return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.prototype.hasOwnProperty.call(value,key));}
