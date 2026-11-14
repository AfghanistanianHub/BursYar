import {getInferenceToken} from './auth.js';
import {assessBarriers,barrierText} from './pathfinder.js';
import {planGaps,actionText} from './gap-actions.js';
// fa/ps strings are UNREVIEWED pending fluent human review (see docs/TRANSLATION-REVIEW.json).
export const localWorkflowCopy={
 en:{changed:'Saved profile changed. Run the comparison again.',title:'Assessment without an AI provider',note:'Use reviewed scholarship criteria and your saved profile. Unknown evidence stays unknown. This is not an award or issuer authentication.',student:'Student scope ID (guardian grant required; leave empty for yourself)',refresh:'Load reviewed scholarships',program:'Reviewed scholarship',degree:'Highest degree',unknown:'Unknown',bachelor:'Bachelor',master:'Master',doctorate:'Doctorate',secondary:'Secondary',consent:'I confirm this degree and consent to private local storage.',save:'Save degree in this scope',evaluate:'Assess saved profile',empty:'No current reviewed scholarships are available.',error:'Unavailable. Sign in and check the reviewed catalog or guardian grant.',saved:'Degree saved in the selected scope.',met:'Meets reviewed requirements only',not_met:'A reviewed requirement is not met',unknownResult:'Missing, conflicting or unsupported evidence',nextMet:'Next: verify current policy and submit documents through the institution’s official channel.',nextNotMet:'Next: inspect the cited condition and ask the institution whether an official exception or accepted alternative exists.',nextUnknown:'Next: obtain missing documents or ask admissions to clarify the cited requirement. Unknown is not a rejection.',official:'Open source for independent verification',sourceNote:'Source was reviewed for this local rule set; confirm its current conditions directly with the institution.'},
 fa:{changed:'پروفایل ذخیره‌شده تغییر کرد. ارزیابی را دوباره اجرا کنید.',title:'ارزیابی بدون ارائه‌دهندهٔ هوش مصنوعی',note:'از شرایط بازبینی‌شدهٔ بورسیه و پروفایل ذخیره‌شده استفاده کنید. شواهد نامعلوم، نامعلوم می‌مانند. این ارزیابی اعطای بورسیه یا تأیید صادرکننده نیست.',student:'شناسهٔ دانش‌آموز (نیازمند مجوز سرپرست؛ برای خودتان خالی بگذارید)',refresh:'بارگذاری بورسیه‌های بازبینی‌شده',program:'بورسیهٔ بازبینی‌شده',degree:'بالاترین مدرک',unknown:'نامعلوم',bachelor:'لیسانس',master:'ماستری',doctorate:'دوکتورا',secondary:'مکتب',consent:'این مدرک را تأیید می‌کنم و با ذخیرهٔ خصوصی محلی موافقم.',save:'ذخیرهٔ مدرک در این پروفایل',evaluate:'ارزیابی پروفایل ذخیره‌شده',empty:'بورسیهٔ بازبینی‌شدهٔ معتبر در دسترس نیست.',error:'در دسترس نیست. ورود، فهرست بازبینی‌شده یا مجوز سرپرست را بررسی کنید.',saved:'مدرک در پروفایل انتخاب‌شده ذخیره شد.',met:'فقط شرایط بازبینی‌شده برآورده شده‌اند',not_met:'یک شرط بازبینی‌شده برآورده نشده است',unknownResult:'شواهد مفقود، متناقض یا پشتیبانی‌نشده',nextMet:'گام بعدی: شرایط روز را بررسی کنید و اسناد را فقط از مسیر رسمی مؤسسه ارسال کنید.',nextNotMet:'گام بعدی: شرط مستند را بررسی کنید و دربارهٔ استثنا یا راه جایگزین مورد تأیید از مؤسسه بپرسید.',nextUnknown:'گام بعدی: سند مفقود را تهیه کنید یا دربارهٔ شرط نامشخص از بخش پذیرش بپرسید. نتیجهٔ نامشخص به معنی رد شدن نیست.',official:'باز کردن منبع برای بررسی مستقل',sourceNote:'این منبع برای قواعد محلی بازبینی شده است؛ شرایط روز آن را مستقیماً از مؤسسه تأیید کنید.'},
 ps:{changed:'ساتل شوی پروفایل بدل شو. ارزونه بیا ترسره کړئ.',title:'له هوښیار ماډل پرته ارزونه',note:'د بورس بیاکتل شوي شرایط او ساتل شوی پروفایل وکاروئ. نامعلوم شواهد نامعلوم پاتې کېږي. دا د بورس ورکول یا د صادرونکي تایید نه دی.',student:'د زده کوونکي پېژند (د سرپرست اجازه غواړي؛ د ځان لپاره تش پرېږدئ)',refresh:'بیاکتل شوي بورسونه راوړئ',program:'بیاکتل شوی بورس',degree:'لوړ تحصیلي سند',unknown:'نامعلوم',bachelor:'لېسانس',master:'ماسټري',doctorate:'دوکتورا',secondary:'ثانوي',consent:'دا سند منم او شخصي محلي ساتنې ته اجازه ورکوم.',save:'په دې پروفایل کې سند وساتئ',evaluate:'ساتل شوی پروفایل وارزوئ',empty:'اوس مهال د بیاکتنې معتبر بورس نشته.',error:'نه شته. ننوتل، بیاکتل شوی لړ یا د سرپرست اجازه وګورئ.',saved:'سند په ټاکلي پروفایل کې وساتل شو.',met:'یوازې بیاکتل شوي شرایط پوره دي',not_met:'یو بیاکتل شوی شرط نه دی پوره',unknownResult:'ورک، متضاد یا نه ملاتړ شوي شواهد',nextMet:'بل ګام: تازه رسمي شرطونه وګورئ او اسناد یوازې د ادارې رسمي لارې وسپارئ.',nextNotMet:'بل ګام: یاد شوی شرط وڅېړئ او د رسمي استثنا یا منل شوې بدیلې لارې پوښتنه وکړئ.',nextUnknown:'بل ګام: ورک سند برابر کړئ یا له ادارې د نامعلوم شرط وضاحت وغواړئ. نامعلومه پایله رد نه دی.',official:'د خپلواکې کتنې لپاره سرچینه پرانیزئ',sourceNote:'دا سرچینه د محلي قواعدو لپاره بیاکتل شوې؛ تازه شرطونه له ادارې سره تایید کړئ.'}
};
const expiredSourceCopy={
 en:'These reviews have expired. Check the current criteria on the official websites.',
 fa:'اعتبار این بازبینی‌ها پایان یافته است. شرایط فعلی را در وب‌سایت‌های رسمی بررسی کنید.',
 ps:'د دې بیاکتنو اعتبار پای ته رسېدلی. اوسني شرایط په رسمي وېبپاڼو کې وګورئ.'
};
const handlers=new WeakMap();
export function mountLocalWorkflow(root,language='en'){
 handlers.get(root)?.();const t=localWorkflowCopy[language]??localWorkflowCopy.en;root.replaceChildren();
 const add=(tag,text,parent=root)=>{const e=document.createElement(tag);if(text)e.textContent=text;parent.append(e);return e;};
 const panel=add('details');panel.className='local-workflow section';add('summary',t.title,panel);add('p',t.note,panel);
 const form=add('form',null,panel);form.id='local-assessment';
 const label=(text,tag,id)=>{const l=add('label',text,form);l.htmlFor=id;const input=add(tag,null,form);input.id=id;return input;};
 const scope=label(t.student,'input','local-scope');scope.maxLength=80;scope.pattern='[a-zA-Z0-9_-]{1,80}';scope.autocomplete='off';
 const scopeLabel=scope.previousElementSibling;
 scope.hidden=scopeLabel.hidden=true;
 panel.addEventListener('toggle',async()=>{
  if(!panel.open||!scope.hidden)return;
  try{
   const response=await fetch('/health',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))return;
   const health=await response.json();
   if(panel.isConnected&&health.capabilities?.familyAssessment?.available===true){
    scope.hidden=scopeLabel.hidden=false;
   }
  }catch{/* The personal workflow stays available without a capability response. */}
 });
 const degree=label(t.degree,'select','local-degree');for(const value of ['', 'secondary','bachelor','master','doctorate']){const o=add('option',t[value||'unknown'],degree);o.value=value;}
 const consent=label(t.consent,'input','local-consent');consent.type='checkbox';
 const save=add('button',t.save,form);save.type='button';
 const refresh=add('button',t.refresh,form);refresh.type='button';
 const select=label(t.program,'select','local-program');select.required=true;
 const submit=add('button',t.evaluate,form);submit.type='submit';submit.disabled=true;
 const status=add('p',null,panel);status.id='local-status';status.setAttribute('role','status');
 const sourceInfo=add('div',null,panel);sourceInfo.id='local-source-info';const output=add('div',null,panel);let epoch=0;
 const publish=message=>document.dispatchEvent(new CustomEvent('bursyar:local-next',{detail:message}));
 const clearResult=()=>{
  output.replaceChildren();
  status.textContent='';
  publish(null);
 };
 const unlock=()=>{
  for(const control of form.elements)control.disabled=false;
  submit.disabled=!select.value;
 };
 const clearCatalog=()=>{
  select.onchange=null;
  select.replaceChildren();
  sourceInfo.replaceChildren();
  submit.disabled=true;
 };
 const resetScope=()=>{
  epoch++;
  degree.value='';
  consent.checked=false;
  clearCatalog();
  unlock();
  clearResult();
 };
 const identity=()=>{scope.value='';resetScope();};
 document.addEventListener('bursyar:identity',identity);
 degree.addEventListener('change',()=>{
  epoch++;
  consent.checked=false;
  unlock();
  clearResult();
 });
 // Re-rendered panels discard their handler before another identity event.
 const profileChanged=event=>{if(scope.value)return;epoch++;const value=event.detail?.degree?.value;degree.value=['secondary','bachelor','master','doctorate'].includes(value)?value:'';consent.checked=false;unlock();clearResult();status.textContent=t.changed;};
 document.addEventListener('bursyar:profile',profileChanged);
 const cleanup=()=>{epoch++;document.removeEventListener('bursyar:identity',identity);document.removeEventListener('bursyar:profile',profileChanged);};handlers.set(root,cleanup);
 scope.addEventListener('input',resetScope);
 async function api(path,method='GET',body){const started=epoch;const scopeId=scope.value;const token=await getInferenceToken();if(!form.isConnected||started!==epoch)throw Error();const response=await fetch('/api'+(scopeId?'/family/'+encodeURIComponent(scopeId):'')+path,{method,credentials:'omit',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});if(!response.ok||!form.isConnected||started!==epoch)throw Error();const data=await response.json();if(!form.isConnected||started!==epoch)throw Error();return data;}
 async function busy(action){const started=epoch;for(const e of form.elements)e.disabled=true;try{await action();}catch{if(started===epoch)status.textContent=t.error;}finally{if(started===epoch)unlock();}}
 save.addEventListener('click',()=>{
  if(!consent.checked||!scope.reportValidity())return;
  busy(async()=>{
   const profile=await api('/profile','PUT',{consent:true,values:{degree:degree.value||null}});
   if(!scope.value){
    document.dispatchEvent(new CustomEvent('bursyar:profile',{detail:profile}));
   }else{
    consent.checked=false;
    clearResult();
   }
   status.textContent=t.saved;
  });
 });
 function addOfficialSource(raw,text,parent){
  let url;
  try{url=new URL(raw);}catch{return;}
  if(url.protocol!=='https:'||url.username||url.password)return;
  const link=add('a',text,parent);
  link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.dir='auto';
  return link;
 }
 refresh.addEventListener('click',()=>{
  if(!scope.reportValidity())return;
  const selectedProgram=select.value;
  clearCatalog();
  clearResult();
  busy(async()=>{
   const {scholarships,expiredSources=[]}=await api('/scholarships');
   const sourceMap=new Map();
   for(const program of scholarships){
    const option=add('option',program.title??program.id,select);
    option.value=program.id;
    sourceMap.set(program.id,program.sourceUrl);
   }
   if(sourceMap.has(selectedProgram))select.value=selectedProgram;
   const showSource=()=>{
    sourceInfo.replaceChildren();
    if(addOfficialSource(sourceMap.get(select.value),t.official,sourceInfo))add('p',t.sourceNote,sourceInfo);
   };
   select.onchange=()=>{clearResult();showSource();};
   showSource();
   if(!scholarships.length&&expiredSources.length){
    add('p',expiredSourceCopy[language]??expiredSourceCopy.en,sourceInfo);
    const list=add('ul',null,sourceInfo);
    for(const source of expiredSources){
     const item=add('li',null,list);
     if(!addOfficialSource(source.sourceUrl,source.title,item))item.remove();
    }
   }
   status.textContent=scholarships.length?'':t.empty;
  });
 });

 form.addEventListener('submit',event=>{event.preventDefault();if(submit.disabled||!select.value||!scope.reportValidity())return;clearResult();busy(async()=>{const result=await api('/evaluate','POST',{scholarshipId:select.value});const barriers=assessBarriers(result.results);const gaps=new Map(planGaps(result).map(g=>[g.requirementId,g]));const actions=actionText[language]??actionText.en;output.replaceChildren();status.textContent=t[result.summary==='unknown'?'unknownResult':result.summary];for(const r of result.results){const p=add('p',`${r.requirementId}: ${t[r.status==='unknown'?'unknownResult':r.status]}`,output);p.dir='auto';const quote=add('blockquote',r.source.excerpt,output);quote.dir='auto';const barrier=barriers.find(b=>b.requirementId===r.requirementId);if(barrier){const text=barrierText(barrier,language);const item=add('p',`${text.status} — ${text.action}`,output);item.dir='auto';item.dataset.requirement=r.requirementId;}const gap=gaps.get(r.requirementId);if(gap&&actions[gap.action]){const item=add('p',actions[gap.action],output);item.dir='auto';}}const next=add('p',t[result.summary==='met'?'nextMet':result.summary==='not_met'?'nextNotMet':'nextUnknown'],output);next.setAttribute('role','note');publish(next.textContent);});});
}
