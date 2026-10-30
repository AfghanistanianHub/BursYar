import {createHash} from 'node:crypto';
// Meta selects and interprets evidence; this compiler independently accepts only
// a small, explicit grammar. It never treats a matching quote as source authenticity.
const digest=text=>createHash('sha256').update(text).digest('hex');
const score=s=>Number(s);
function parse(excerpt){
 let m=/^Applicants must hold (?:a|an) (bachelor|master|doctorate)(?:'s)? degree\.$/i.exec(excerpt);
 if(m)return {type:'minimum_degree',minimum:m[1].toLowerCase()};
 m=/^Applicants must have IELTS Academic (\d(?:\.\d)?) overall, with no band below (\d(?:\.\d)?)\.$/i.exec(excerpt);
 if(m && m.slice(1).every(v=>score(v)<=9 && Number.isInteger(score(v)*2)))return {type:'ielts_academic',test:'IELTS Academic',overallMin:score(m[1]),eachBandMin:score(m[2])};
 m=/^Applicants must hold a minimum GPA of (\d(?:\.\d{1,2})?) on a (4\.0|5\.0) scale\.$/i.exec(excerpt);
 if(m){const gpaMin=score(m[1]),scale=score(m[2]);if(gpaMin>0&&gpaMin<=scale)return {type:'minimum_gpa',gpaMin,scale};}
 m=/^Applicants must have TOEFL iBT (\d{1,3}) overall, with no section below (\d{1,2})\.$/i.exec(excerpt);
 if(m){const overall=score(m[1]),section=score(m[2]);if(Number.isInteger(overall)&&overall<=120&&Number.isInteger(section)&&section<=30)return {type:'toefl_ibt',test:'TOEFL iBT',overallMin:overall,eachSectionMin:section};}
 return null;
}
export function compileRequirements(evidence,input){
 if(!evidence || !Array.isArray(evidence.criteria) || evidence.sourceDigest!==digest(input.text))throw Error('Source digest mismatch');
 const url=new URL(input.sourceUrl);
 if(url.protocol!=='https:'||url.username||url.password||evidence.sourceUrl!==url.href)throw Error('Invalid source');
 const seen=new Set();
 const rules=evidence.criteria.map(c=>{
  if(typeof c.id!=='string'||seen.has(c.id)||typeof c.excerpt!=='string'||!input.text.includes(c.excerpt))throw Error('Invalid compiler evidence');
  seen.add(c.id);
  const typed=c.required===true?parse(c.excerpt):null;
  // Require a complete source line as well as the exact quote. This blocks a
  // model slicing the positive half out of a conditional/negated sentence.
  const complete=input.text.split(/\n+/).some(line=>line.trim()===c.excerpt);
  return {...(typed??{type:'unsupported'}),id:c.id,ambiguous:!typed||!complete,sourceUrl:url.href,sourceExcerpt:c.excerpt,
   provenance:{sourceDigest:evidence.sourceDigest,criterionId:c.id,sourceStatus:'user_supplied_unverified',interpretationStatus:'unreviewed'},
   compilerStatus:typed&&complete?'supported':'requires_review'};
 });
 // Different policies for the same dimension are not silently merged or resolved
 // by choosing the stricter one: course, year and exceptions may differ.
 const contradictions=[];
 for(let i=0;i<rules.length;i++)for(let j=i+1;j<rules.length;j++){
  const a=rules[i],b=rules[j];
  if(a.type!=='unsupported'&&a.type===b.type&&JSON.stringify(parse(a.sourceExcerpt))!==JSON.stringify(parse(b.sourceExcerpt))){
   a.ambiguous=b.ambiguous=true;a.compilerStatus=b.compilerStatus='conflicting';
   contradictions.push({requirementIds:[a.id,b.id],reason:'different_rules_for_same_dimension'});
  }
 }
 return {version:1,rules,contradictions,coverage:'selected_requirements_only',sourceStatus:'user_supplied_unverified',requiresHumanReview:true};
}
