// No answers are sent to the API or persisted. Availability never proves eligibility.
import {glossary} from './glossary.js';
export function findBarriers(criteria, answers = {}) {
  return criteria.map(c=>{
    const missing = c.required === true && ['transcripts','language_test','travel_document'].includes(c.kind) && answers[c.kind] === 'unavailable';
    return {criterionId:c.id,status:missing?'potential mismatch':'cannot determine',action:missing?'Ask the institution whether this requirement applies and which alternatives it explicitly accepts.':'Verify the exact requirement with the institution. Availability alone does not establish eligibility.'};
  });
}
const labels={
 en:{mismatch:glossary.potentialMismatch.en,unknown:glossary.cannotDetermine.en,ask:'Ask the institution whether this requirement applies and which alternatives it explicitly accepts.',verify:'Verify the exact requirement with the institution. Availability alone does not establish eligibility.'},
 fa:{mismatch:glossary.potentialMismatch.fa,unknown:glossary.cannotDetermine.fa,ask:'از مؤسسه بپرسید آیا این شرط شامل شما می‌شود و کدام اسناد جایگزین را صریحاً می‌پذیرد.',verify:'شرط دقیق را از مؤسسه تأیید کنید. موجود بودن سند به‌تنهایی واجد شرایط بودن را ثابت نمی‌کند.'},
 ps:{mismatch:glossary.potentialMismatch.ps,unknown:glossary.cannotDetermine.ps,ask:'له ادارې وپوښتئ چې دا شرط پر تاسو پلي کېږي او کوم بدیل اسناد په څرګند ډول مني.',verify:'دقیق شرط له ادارې تایید کړئ. یوازې د سند شتون د شرایطو پوره کول نه ثابتوي.'}
};
export const assessmentActionText={
 en:{keep_evidence:'Keep the documented evidence; the institution still makes the admission decision.',ask_alternative:'Ask the institution whether an explicitly documented alternative applies to this requirement.',use_documented_alternative:'Use only the documented alternative cited with this requirement.',verify_requirement:'Verify the exact requirement with the institution. Availability alone does not establish eligibility.'},
 fa:{keep_evidence:'مدرک مستند را نگه دارید؛ تصمیم نهایی با مؤسسه است.',ask_alternative:'از مؤسسه بپرسید آیا جایگزین صریحاً مستند برای این شرط وجود دارد.',use_documented_alternative:'فقط از جایگزین مستند ذکرشده برای این شرط استفاده کنید.',verify_requirement:'شرط دقیق را از مؤسسه تأیید کنید. موجود بودن سند به‌تنهایی واجد شرایط بودن را ثابت نمی‌کند.'},
 ps:{keep_evidence:'مستند ثبوت وساتئ؛ وروستۍ پرېکړه د ادارې ده.',ask_alternative:'له ادارې وپوښتئ چې ایا د دې شرط لپاره په څرګند ډول مستند بدیل شته.',use_documented_alternative:'یوازې له هغه مستند بدیل څخه کار واخلئ چې له دې شرط سره یاد شوی.',verify_requirement:'دقیق شرط له ادارې تایید کړئ. یوازې د سند شتون د شرایطو پوره کول نه ثابتوي.'}
};
// Maps deterministic assessment results to barrier guidance. Statuses never
// promise admission; alternatives are cited only when explicitly curated.
export function assessBarriers(results,{alternatives={}}={}){
 if(!Array.isArray(results))throw new TypeError('Invalid assessment results');
 return results.map(r=>{
  const id=r?.requirementId??'invalid';
  const excerpt=r?.source?.excerpt??null,url=r?.source?.url??null;
  if(r?.status==='met')return {requirementId:id,status:'appears to meet',actionCode:'keep_evidence',detail:null,evidence:{excerpt,url},documentedAlternative:null};
  if(r?.status==='not_met'){
   // Caller-supplied alternatives are untrusted. Text + URL are not proof
   // that an official institution accepts an alternative. Until a separate,
   // server-owned curator/official-source verification pipeline supplies an
   // authenticated provenance decision, fail closed rather than recommend it.
   // Deliberately ignore alternatives[id], including forged verification flags.
   return {requirementId:id,status:'potential mismatch',actionCode:'ask_alternative',detail:excerpt,evidence:{excerpt,url},documentedAlternative:null};
  }
  return {requirementId:id,status:'cannot determine',actionCode:'verify_requirement',detail:excerpt,evidence:{excerpt,url},documentedAlternative:null};
 });
}
// Trusted alternatives must be resolved by a server-owned policy catalog.
// Do not accept a caller-supplied resolver, URL, or approval bit in /api inputs.
// The existing assessBarriers API deliberately remains fail-closed.
export function assessWithReviewedCatalog(results,{scholarshipId,policyScope,resolveReviewedAlternative}={}){
 if(typeof resolveReviewedAlternative!=='function'||typeof scholarshipId!=='string'||typeof policyScope!=='string')
  return assessBarriers(results);
 const safe=assessBarriers(results);
 return safe.map((result,index)=>{
  if(result.actionCode!=='ask_alternative')return result;
  const source=results[index]?.source;
  const reviewed=resolveReviewedAlternative({scholarshipId,policyScope,requirementId:result.requirementId,source});
  if(!reviewed)return result;
  return {...result,actionCode:'use_documented_alternative',documentedAlternative:reviewed};
 });
}
export function barrierText(result,language='en'){
 const t=labels[language]||labels.en,a=assessmentActionText[language]||assessmentActionText.en;
 if(result?.actionCode&&a[result.actionCode]){
  const status=result.status==='appears to meet'?(glossary.appearsToMeet[language]||glossary.appearsToMeet.en):result.status==='potential mismatch'?t.mismatch:t.unknown;
  return {status,action:a[result.actionCode]};
 }
 const mismatch=result.status==='potential mismatch';return {status:mismatch?t.mismatch:t.unknown,action:mismatch?t.ask:t.verify};
}
