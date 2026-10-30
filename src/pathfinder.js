// No answers are sent to the API or persisted. Availability never proves eligibility.
export function findBarriers(criteria, answers = {}) {
  return criteria.map(c=>{
    const missing = c.required === true && ['transcripts','language_test','travel_document'].includes(c.kind) && answers[c.kind] === 'unavailable';
    return {criterionId:c.id,status:missing?'potential mismatch':'cannot determine',action:missing?'Ask the institution whether this requirement applies and which alternatives it explicitly accepts.':'Verify the exact requirement with the institution. Availability alone does not establish eligibility.'};
  });
}
const labels={
 en:{mismatch:'Potential mismatch',unknown:'Cannot determine',ask:'Ask the institution whether this requirement applies and which alternatives it explicitly accepts.',verify:'Verify the exact requirement with the institution. Availability alone does not establish eligibility.'},
 fa:{mismatch:'ناسازگاری احتمالی',unknown:'قابل تعیین نیست',ask:'از مؤسسه بپرسید آیا این شرط شامل شما می‌شود و کدام اسناد جایگزین را صریحاً می‌پذیرد.',verify:'شرط دقیق را از مؤسسه تأیید کنید. موجود بودن سند به‌تنهایی واجد شرایط بودن را ثابت نمی‌کند.'},
 ps:{mismatch:'احتمالي نه سمون',unknown:'نه شي ټاکل کېدای',ask:'له ادارې وپوښتئ چې دا شرط پر تاسو پلي کېږي او کوم بدیل اسناد په څرګند ډول مني.',verify:'دقیق شرط له ادارې تایید کړئ. یوازې د سند شتون د شرایطو پوره کول نه ثابتوي.'}
};
export function barrierText(result,language='en'){const t=labels[language]||labels.en;const mismatch=result.status==='potential mismatch';return {status:mismatch?t.mismatch:t.unknown,action:mismatch?t.ask:t.verify};}

// Assess deterministic engine results without trusting caller-supplied alternatives.
// A URL+text pair is not provenance. Until a server-verified, curated alternative
// registry exists, never label a suggested alternative as officially documented.
export function assessBarriers(results,{alternatives={}}={}) {
 if(!Array.isArray(results))throw new TypeError('Invalid assessment results');
 // Deliberately do not read alternatives: untrusted suggestions must not be
 // upgraded into endorsements even if their sourceUrl uses an official domain.
 void alternatives;
 return results.map(r=>{
  const id=typeof r?.requirementId==='string'?r.requirementId:'invalid';
  const status=r?.status==='met'?'appears to meet':r?.status==='not_met'?'potential mismatch':'cannot determine';
  const actionCode=r?.status==='met'?'keep_evidence':r?.status==='not_met'?'ask_alternative':'verify_requirement';
  return {requirementId:id,status,actionCode,evidence:{excerpt:r?.source?.excerpt??null,url:r?.source?.url??null},documentedAlternative:null};
 });
}
