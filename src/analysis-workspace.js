// Interactive scholarship-analysis workspace: one connected vertical slice,
// source → requirement → document evidence → eligibility reasoning →
// PathFinder. All content is synthetic fixtures; verdicts and next steps are
// computed live by the real deterministic engines (engine/eligibility.js,
// pathfinder.js, gap-actions.js). No inference, no network, no persistence.
// fa/ps strings are UNREVIEWED pending fluent human review (see docs/TRANSLATION-REVIEW.json).
import {assessScholarship} from '../engine/eligibility.js';
import {assessBarriers,barrierText} from './pathfinder.js';
import {planGaps,actionText} from './gap-actions.js';

const SOURCE_URL='https://example.org/synthetic-meridian-scholarship';
const SOURCE_SENTENCES=[
 'SYNTHETIC DEMONSTRATION SOURCE — NOT A REAL SCHOLARSHIP.',
 'Meridian Future Scholars is a fictional program used only to demonstrate BursYar.',
 'Applicants must hold a bachelor degree or higher.',
 'IELTS Academic overall 6.5 with no band below 6.0.',
 'A minimum GPA of 3.5 on a 4.0 scale is required.',
 'Applicants already enrolled in a Meridian-funded degree may not apply while continuing that degree.'
];
const SOURCE_TEXT=SOURCE_SENTENCES.join(' ');
const RULES=[
 {id:'degree',type:'minimum_degree',minimum:'bachelor',ambiguous:false,sourceUrl:SOURCE_URL,sourceExcerpt:'Applicants must hold a bachelor degree or higher.',sentence:2},
 {id:'english',type:'ielts_academic',test:'IELTS Academic',overallMin:6.5,eachBandMin:6,ambiguous:false,sourceUrl:SOURCE_URL,sourceExcerpt:'IELTS Academic overall 6.5 with no band below 6.0.',sentence:3},
 {id:'gpa',type:'minimum_gpa',gpaMin:3.5,scale:4,ambiguous:false,sourceUrl:SOURCE_URL,sourceExcerpt:'A minimum GPA of 3.5 on a 4.0 scale is required.',sentence:4},
 {id:'continuity',type:'boolean_exclusion',field:'continuingSameDegree',excludedValue:true,ambiguous:false,sourceUrl:SOURCE_URL,sourceExcerpt:'Applicants already enrolled in a Meridian-funded degree may not apply while continuing that degree.',sentence:5}
];
const DOCS=[
 {id:'synthetic-transcript',claims:[
  {id:'docA-claim1',field:'degree',text:'Degree awarded: Bachelor of Science (synthetic record)'},
  {id:'docA-claim2',field:'gpa',text:'Cumulative GPA: 3.2 on a 4.0 scale (synthetic record)'}
 ]},
 {id:'synthetic-ielts',claims:[
  {id:'docB-claim1',field:'languageTest',text:'IELTS Academic overall 7.0 — bands L7.0 R6.5 W7.0 S6.5 (synthetic record)'}
 ]}
];
const FIELD_CLAIMS={degree:['docA-claim1'],gpa:['docA-claim2'],languageTest:['docB-claim1']};
const baseProfile=()=>({
 degree:{value:'bachelor',origin:'document_extracted',claimIds:['docA-claim1'],verificationStatus:'not_verified',sourceDocumentId:'synthetic-transcript'},
 languageTest:{value:{test:'IELTS Academic',overall:7,bands:{listening:7,reading:6.5,writing:7,speaking:6.5}},origin:'document_extracted',claimIds:['docB-claim1'],verificationStatus:'not_verified',sourceDocumentId:'synthetic-ielts'},
 gpa:{value:{gpa:3.2,scale:4},origin:'document_extracted',claimIds:['docA-claim2'],verificationStatus:'not_verified',sourceDocumentId:'synthetic-transcript'}
});
const state={selected:'degree',reviews:{},digest:null};
if(typeof document!=='undefined')document.addEventListener('bursyar:identity',()=>{state.selected='degree';state.reviews={};});
// Pure demo contract: fixture rules assessed against the synthetic profile
// with the given claim ids flagged (excluded) by the reviewer. Exported for
// unit tests; the mounted UI calls it on every render.
export function demoAssessment(flaggedClaimIds=[]){
 const profile=baseProfile();
 for(const [field,claims] of Object.entries(FIELD_CLAIMS)){
  if(claims.some(id=>flaggedClaimIds.includes(id)))profile[field].reviewStatus='pending';
 }
 return assessScholarship(RULES,profile);
}

export const analysisWorkspaceCopy={
 en:{title:'Analysis workspace',intro:'Follow one scholarship from its official source to your next step. Select any requirement to trace its evidence.',synthetic:'SYNTHETIC DEMONSTRATION — fictional source, documents, and profile. No real data.',
  stages:['Source','Requirements','Evidence','Reasoning','Next steps'],
  sourceTitle:'Official source',retrieved:'Retrieved for review',digest:'Source digest (SHA-256)',openSource:'Open source',
  reqTitle:'Requirements',reqHint:'Select a requirement to trace it across the workspace.',
  evTitle:'Your evidence',docTranscript:'Transcript excerpt',docIelts:'IELTS result',confirm:'Confirm',flag:'Flag',flagged:'Flagged — excluded from reasoning',confirmedNote:'Reviewed — counts toward reasoning',
  reasonTitle:'Eligibility reasoning',decided:'requirements decided',summary:{met:'Listed requirements met (not verified)',not_met:'One requirement is not met',unknown:'Cannot determine yet'},
  words:{met:'Met',not_met:'Not met',unknown:'Unknown'},
  reasons:{degree_comparison:'Bachelor degree meets the stated minimum.',test_thresholds_met:'Overall 7.0 with every band at 6.5+ meets 6.5 / 6.0.',gpa_comparison:'GPA 3.2 is below the stated 3.5 minimum.',missing_exclusion_evidence:'No reviewed statement about continuing enrolment — unknown, not eligible.',exclusion_not_reported:'No continuing enrolment reported.',fallback:'Compared the stated rule against reviewed profile facts.'},
  factOrigin:{document_extracted:'document evidence',user_declared:'your declaration'},
  nextTitle:'PathFinder — next steps',reset:'Reset demo',quotedIn:'Quoted in source'},
 fa:{title:'فضای کاری تحلیل',intro:'یک بورسیه را از منبع رسمی تا گام بعدی دنبال کنید. هر شرط را انتخاب کنید تا شواهد آن مشخص شود.',synthetic:'نمایش فرضی — منبع، اسناد و پروفایل کاملاً ساختگی‌اند. دادهٔ واقعی نیست.',
  stages:['منبع','شرایط','شواهد','استدلال','گام‌های بعدی'],
  sourceTitle:'منبع رسمی',retrieved:'بازیابی‌شده برای بررسی',digest:'اثر منبع (SHA-256)',openSource:'باز کردن منبع',
  reqTitle:'شرایط',reqHint:'یک شرط را انتخاب کنید تا مسیر آن در فضای کاری مشخص شود.',
  evTitle:'شواهد شما',docTranscript:'گزیدهٔ کارنامه',docIelts:'نتیجهٔ آیلتس',confirm:'تأیید',flag:'علامت‌گذاری',flagged:'علامت‌گذاری شد — از استدلال حذف شد',confirmedNote:'بررسی شد — در استدلال لحاظ می‌شود',
  reasonTitle:'استدلال واجد شرایط بودن',decided:'شرایط تعیین‌تکلیف‌شده',summary:{met:'شروط نمونه برآورده شده‌اند (تأیید نشده)',not_met:'یک شرط برآورده نشده است',unknown:'هنوز مشخص نیست'},
  words:{met:'برآورده شد',not_met:'برآورده نشد',unknown:'نامشخص'},
  reasons:{degree_comparison:'مدرک لیسانس، حداقل اعلام‌شده را برآورده می‌کند.',test_thresholds_met:'نمرهٔ ۷ با همهٔ مهارت‌ها بالای ۶٫۵، حد ۶٫۵ / ۶ را برآورده می‌کند.',gpa_comparison:'معدل ۳٫۲ از حداقل ۳٫۵ کمتر است.',missing_exclusion_evidence:'اظهار بررسی‌شده‌ای دربارهٔ ادامهٔ تحصیل نیست — نامشخص است، نه واجد شرایط.',exclusion_not_reported:'ادامهٔ تحصیلی گزارش نشده است.',fallback:'شرط اعلام‌شده با حقایق بررسی‌شدهٔ پروفایل مقایسه شد.'},
  factOrigin:{document_extracted:'سند',user_declared:'اظهار شما'},
  nextTitle:'راه‌یاب — گام‌های بعدی',reset:'شروع مجدد نمایش',quotedIn:'نقل‌شده در منبع'},
 ps:{title:'د تحلیل کاري ځای',intro:'یو بورس له رسمي سرچینې تر بل ګام پورې تعقیب کړئ. هر شرط وټاکئ چې شواهد یې روښانه شي.',synthetic:'فرضي ننداره — سرچینه، اسناد او پروفایل ټول جوړ شوي دي. رښتیني معلومات نه دي.',
  stages:['سرچینه','شرایط','شواهد','استدلال','بل ګامونه'],
  sourceTitle:'رسمي سرچینه',retrieved:'د کتنې لپاره راوړل شوې',digest:'د سرچینې نښه (SHA-256)',openSource:'سرچینه پرانیزئ',
  reqTitle:'شرایط',reqHint:'یو شرط وټاکئ چې په کاري ځای کې یې لاره روښانه شي.',
  evTitle:'ستاسې شواهد',docTranscript:'د نمرو لنډیز',docIelts:'د IELTS پایله',confirm:'تایید',flag:'په نښه کول',flagged:'په نښه شو — له استدلال وویستل شو',confirmedNote:'وکتل شو — په استدلال کې شمېرل کېږي',
  reasonTitle:'د وړتوب استدلال',decided:'ټاکل شوي شرایط',summary:{met:'د بېلګې شرطونه پوره دي (نه دي تایید شوي)',not_met:'یو شرط نه دی پوره شوی',unknown:'لا نه دي څرګند'},
  words:{met:'پوره شو',not_met:'پوره نه شو',unknown:'نامعلوم'},
  reasons:{degree_comparison:'د لېسانس سند ټاکلی حد پوره کوي.',test_thresholds_met:'۷ نمره او ټول مهارتونه تر ۶٫۵ لوړ، د ۶٫۵ / ۶ حد پوره کوي.',gpa_comparison:'۳٫۲ معدل د ۳٫۵ تر حد ټیټ دی.',missing_exclusion_evidence:'د زده کړو د دوام په اړه هېڅ کتل شوی بیان نشته — نامعلوم، نه وړ.',exclusion_not_reported:'د زده کړو دوام نه دی راپور شوی.',fallback:'ټاکلی شرط له کتل شویو حقایقو سره پرتله شو.'},
  factOrigin:{document_extracted:'سند',user_declared:'ستاسې وینا'},
  nextTitle:'لارموند — بل ګامونه',reset:'ننداره له سره پیل کړئ',quotedIn:'په سرچینه کې نقل شوی'}
};
const REQ_NAMES={en:{degree:'Degree',english:'English test',gpa:'GPA',continuity:'Enrolment status'},fa:{degree:'مدرک',english:'آزمون زبان',gpa:'معدل',continuity:'وضعیت ثبت‌نام'},ps:{degree:'سند',english:'د ژبې ازموینه',gpa:'معدل',continuity:'د نوملیکنې حالت'}};

function workingAssessment(){
 return demoAssessment(Object.keys(state.reviews).filter(id=>state.reviews[id]==='flagged'));
}
function el(tag,text,cls,parent){
 const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;if(parent)parent.append(e);return e;
}
export function mountAnalysisWorkspace(root,language='en'){
 if(!root)return;
 const t=analysisWorkspaceCopy[language]??analysisWorkspaceCopy.en;
 const names=REQ_NAMES[language]??REQ_NAMES.en;
 const assessment=workingAssessment();
 const barriers=assessBarriers(assessment.results);
 const gaps=new Map(planGaps(assessment).map(g=>[g.requirementId,g]));
 const gapText=actionText[language]??actionText.en;
 const decided=assessment.results.filter(r=>r.status!=='unknown').length;
 root.replaceChildren();
 const shell=el('div',null,'aw-shell',root);
 const head=el('header',null,'aw-head',shell);
 el('p',t.synthetic,'aw-synthetic',head);
 el('h2',t.title,null,head);
 el('p',t.intro,'aw-intro',head);
 // Stage spine with progress.
 const spine=el('ol',null,'aw-spine',shell);
 t.stages.forEach((label,i)=>{
  const li=el('li',null,'aw-node',spine);
  li.dataset.done=String(i===0||i<decided+1&&i>0?true:i===0);
  el('span',String(i+1),'aw-node-num',li).setAttribute('aria-hidden','true');
  el('span',label,'aw-node-label',li);
 });
 const flow=el('div',null,'aw-flow',shell);
 flow.dataset.selected=state.selected;
 const rerender=()=>mountAnalysisWorkspace(root,language);
 // Stage 1: source.
 const s1=el('article',null,'aw-stage',flow);s1.dataset.stage='source';
 el('h3',t.sourceTitle,'aw-stage-title',s1);
 const srcMeta=el('div',null,'aw-source-meta',s1);
 el('span','Meridian Future Scholars','aw-issuer',srcMeta).dir='auto';
 const link=el('a',t.openSource,'aw-source-link',srcMeta);
 link.href=SOURCE_URL;link.target='_blank';link.rel='noopener noreferrer';
 const prov=el('p',null,'aw-provenance',s1);
 prov.innerHTML='';
 el('span',`${t.retrieved} · `,null,prov);
 el('code',state.digest?state.digest.slice(0,12)+'…':'…','aw-digest',prov);
 el('span',` · ${t.digest}`,null,prov);
 const excerpt=el('div',null,'aw-excerpt',s1);excerpt.dir='auto';excerpt.lang='en';
 SOURCE_SENTENCES.forEach((sentence,i)=>{
  const rule=RULES.find(r=>r.sentence===i);
  if(rule){
   const m=el('mark',sentence,null,excerpt);m.dataset.req=rule.id;
   m.tabIndex=0;m.setAttribute('role','button');
   const pick=()=>{state.selected=rule.id;rerender();};
   m.addEventListener('click',pick);
   m.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}});
  }else el('span',sentence+' ',null,excerpt);
 });
 // Stage 2: requirements.
 const s2=el('article',null,'aw-stage',flow);s2.dataset.stage='requirements';
 el('h3',t.reqTitle,'aw-stage-title',s2);
 el('p',t.reqHint,'aw-hint',s2);
 const reqList=el('div',null,'aw-reqs',s2);reqList.setAttribute('role','group');
 for(const r of assessment.results){
  const b=el('button',null,'aw-req',reqList);
  b.dataset.req=r.requirementId;b.dataset.status=r.status;
  b.setAttribute('aria-pressed',String(state.selected===r.requirementId));
  el('span',names[r.requirementId]??r.requirementId,'aw-req-name',b);
  el('span',t.words[r.status],'aw-chip',b);
  b.addEventListener('click',()=>{state.selected=r.requirementId;rerender();});
 }
 // Stage 3: evidence.
 const s3=el('article',null,'aw-stage',flow);s3.dataset.stage='evidence';
 el('h3',t.evTitle,'aw-stage-title',s3);
 for(const doc of DOCS){
  const card=el('div',null,'aw-doc',s3);
  el('h4',doc.id==='synthetic-transcript'?t.docTranscript:t.docIelts,'aw-doc-title',card);
  for(const claim of doc.claims){
   const line=el('div',null,'aw-claim',card);
   line.dataset.req=claim.field==='languageTest'?'english':claim.field;
   const flagged=state.reviews[claim.id]==='flagged';
   if(flagged)line.dataset.flagged='true';
   el('p',claim.text,'aw-claim-text',line).dir='auto';
   const row=el('div',null,'aw-claim-actions',line);
   const confirm=el('button',t.confirm,'aw-mini',row);
   confirm.setAttribute('aria-pressed',String(!flagged));
   confirm.addEventListener('click',()=>{delete state.reviews[claim.id];rerender();});
   const flag=el('button',t.flag,'aw-mini aw-flag',row);
   flag.setAttribute('aria-pressed',String(flagged));
   flag.addEventListener('click',()=>{state.reviews[claim.id]='flagged';rerender();});
   el('p',flagged?t.flagged:t.confirmedNote,'aw-claim-state',line);
  }
 }
 // Stage 4: reasoning.
 const s4=el('article',null,'aw-stage',flow);s4.dataset.stage='reasoning';
 el('h3',t.reasonTitle,'aw-stage-title',s4);
 const banner=el('p',t.summary[assessment.summary],'aw-verdict',s4);
 banner.dataset.status=assessment.summary;
 const ringWrap=el('div',null,'aw-ring-wrap',s4);
 const NS='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 72 72');svg.classList.add('aw-ring');svg.setAttribute('role','img');
 svg.setAttribute('aria-label',`${decided}/${assessment.results.length} ${t.decided}`);
 const bg=document.createElementNS(NS,'circle');bg.setAttribute('cx','36');bg.setAttribute('cy','36');bg.setAttribute('r','30');bg.classList.add('aw-ring-bg');
 const fg=document.createElementNS(NS,'circle');fg.setAttribute('cx','36');fg.setAttribute('cy','36');fg.setAttribute('r','30');fg.classList.add('aw-ring-fg');
 fg.dataset.status=assessment.summary;
 const C=2*Math.PI*30;fg.style.strokeDasharray=String(C);
 fg.style.strokeDashoffset=String(C*(1-decided/assessment.results.length));
 svg.append(bg,fg);ringWrap.append(svg);
 const fmt=new Intl.NumberFormat(language);
 el('p',`${fmt.format(decided)}/${fmt.format(assessment.results.length)} ${t.decided}`,'aw-ring-label',ringWrap);
 for(const r of assessment.results){
  const row=el('div',null,'aw-reason',s4);row.dataset.req=r.requirementId;row.dataset.status=r.status;
  el('span',names[r.requirementId]??r.requirementId,'aw-reason-name',row);
  el('span',t.words[r.status],'aw-chip',row);
  el('p',t.reasons[r.reason]??t.reasons.fallback,'aw-reason-text',row);
  const used=r.usedFacts?.[0];
  if(used)el('p',`${t.factOrigin[used.origin]??used.origin} · ${t.words[r.status]}`,'aw-used',row);
 }
 // Stage 5: PathFinder.
 const s5=el('article',null,'aw-stage',flow);s5.dataset.stage='next';
 el('h3',t.nextTitle,'aw-stage-title',s5);
 for(const b of barriers){
  const item=el('div',null,'aw-next',s5);item.dataset.req=b.requirementId;
  const text=barrierText(b,language);
  el('span',`${names[b.requirementId]??b.requirementId} — ${text.status}`,'aw-next-title',item);
  el('p',text.action,'aw-next-action',item);
  const gap=gaps.get(b.requirementId);
  if(gap&&gapText[gap.action])el('p',gapText[gap.action],'aw-next-gap',item);
  if(b.evidence?.excerpt)el('blockquote',b.evidence.excerpt,'aw-next-quote',item).dir='auto';
 }
 const reset=el('button',t.reset,'aw-reset',shell);
 reset.addEventListener('click',()=>{state.selected='degree';state.reviews={};rerender();});
 // Async source digest (real SHA-256 of the fixture text).
 if(!state.digest&&window.crypto?.subtle){
  crypto.subtle.digest('SHA-256',new TextEncoder().encode(SOURCE_TEXT)).then(buf=>{
   state.digest=[...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
   const target=root.querySelector('.aw-digest');
   if(target)target.textContent=state.digest.slice(0,12)+'…';
  }).catch(()=>{});
 }
}
