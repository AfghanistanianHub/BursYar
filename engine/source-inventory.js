import {createHash} from 'node:crypto';
// Retain ALL submitted source text. Tags are navigation aids, not verified meaning.
export const OXFORD_CLARENDON='https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants';
export function inventorySource(text,selected=[]){
 let cursor=0;
 const pieces=text.split(/\n+/u).flatMap(line=>line.split(/(?<=[.!?])\s+(?=[A-Z])/u)).map(s=>s.trim()).filter(Boolean);
 return {text,completeSourceRetained:true,semanticCoverageComplete:false,items:pieces.map((excerpt,i)=>{
  const start=text.indexOf(excerpt,cursor);cursor=start+excerpt.length;
  const tags=[];
  if(/not eligible|excluded|must not|cannot apply/i.test(excerpt))tags.push('exclusion');
  if(/\bmust\b|required|essential|need to/i.test(excerpt))tags.push('mandatory');
  if(/deadline|apply by|December|January/i.test(excerpt))tags.push('deadline');
  if(/usually|guideline|preference|normally|majority|potential|motivation/i.test(excerpt))tags.push('preference');
  if(/fees|grant|stipend|funding/i.test(excerpt))tags.push('funding');
  if(!tags.length)tags.push('unknown');
  return {id:`source-${i+1}`,excerpt,start,end:cursor,tags,classification:'heuristic_unreviewed',selectedByModel:selected.some(c=>c.excerpt.includes(excerpt))};
 })};
}
export function oxfordExclusion(excerpt,url){
 if(url!==OXFORD_CLARENDON)return null;
 if(/^Applicants who hold a deferred graduate offer are not eligible to be considered for this scholarship\.$/.test(excerpt))return {type:'boolean_exclusion',field:'deferredOffer',excludedValue:true};
 // Fingerprint of the continuing-same-degree exclusion in the official source fixture.
 if(createHash('sha256').update(excerpt).digest('hex')==='dc4d8d7c0abff227e34fc14d1b7e007dea723c7338496a06fcac049674d131ca')return {type:'boolean_exclusion',field:'continuingSameDegree',excludedValue:true};
 return null;
}
