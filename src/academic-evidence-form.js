import {getInferenceToken} from './auth.js';
import {validProfileValue} from '../engine/profile-schema.js';

// These are user declarations, never issuer-verified scores or accepted tests.
// This form edits only GPA and languageTest; existing profile fields remain intact.
// fa/ps strings are UNREVIEWED pending fluent human review (see docs/TRANSLATION-REVIEW.json).
export const academicEvidenceCopy={
 en:{title:'Academic scores (optional)',note:'Enter scores only as stated on your records. Nothing here proves issuer authenticity, scholarship eligibility or acceptance of a test.',gpa:'GPA',scale:'Official GPA scale',test:'Language test',none:'Not provided',overall:'Overall',reading:'Reading',listening:'Listening',speaking:'Speaking',writing:'Writing',consent:'I approve storing these scores privately as unverified declarations.',save:'Save score declarations',load:'Load saved scores',remove:'Clear saved scores',loaded:'Saved scores loaded.',cleared:'Saved score declarations cleared.',saved:'Score declarations saved; not issuer verified.',error:'Could not save or load scores.',consentRequired:'Tick the consent box before saving these scores.',invalidScore:'Check the scores: each value must be a number within the stated scale.',noValues:'Enter at least one score before saving.',locked:'Issuer-verified scores cannot be edited here.',working:'Working…'},
 fa:{title:'نمره‌های تحصیلی (اختیاری)',note:'نمره‌ها را فقط مطابق مدارک خود وارد کنید. این اطلاعات تأیید صادرکننده، واجد شرایط بودن یا پذیرش آزمون را اثبات نمی‌کند.',gpa:'معدل (GPA)',scale:'مقیاس رسمی معدل',test:'آزمون زبان',none:'ارائه نشده',overall:'نمره مجموع',reading:'خواندن',listening:'شنیدن',speaking:'صحبت کردن',writing:'نوشتن',consent:'ذخیره خصوصی این نمره‌ها را به‌عنوان اظهارات تأییدنشده می‌پذیرم.',save:'ذخیره نمره‌های اظهارشده',load:'بارگذاری نمره‌های ذخیره‌شده',remove:'پاک کردن نمره‌های ذخیره‌شده',loaded:'نمره‌های ذخیره‌شده بارگذاری شدند.',cleared:'نمره‌های اظهارشده پاک شدند.',saved:'نمره‌ها ذخیره شدند؛ تأیید صادرکننده نیستند.',error:'ذخیره یا بارگذاری نمره‌ها ممکن نشد.',consentRequired:'پیش از ذخیرهٔ نمره‌ها، کادر رضایت را علامت بزنید.',invalidScore:'نمره‌ها را بررسی کنید: هر مقدار باید عددی در محدودهٔ مقیاس اعلام‌شده باشد.',noValues:'پیش از ذخیره، حداقل یک نمره وارد کنید.',locked:'نمره‌های تأییدشدهٔ صادرکننده در اینجا قابل ویرایش نیستند.',working:'در حال انجام…'},
 ps:{title:'تحصیلي نمرې (اختیاري)',note:'یوازې د خپلو اسنادو مطابق نمرې ولیکئ. دا د صادرونکي تایید، د بورس وړتوب یا د ازموینې منل نه ثابتوي.',gpa:'اوسط نمره (GPA)',scale:'د اوسط رسمي مقیاس',test:'د ژبې ازموینه',none:'نه ده ورکړل شوې',overall:'ټولیزې نمرې',reading:'لوستل',listening:'اورېدل',speaking:'خبرې کول',writing:'لیکل',consent:'زه د دې نه تایید شویو نمراتو شخصي ساتنې ته رضایت ورکوم.',save:'د نمراتو ثبتول',load:'ساتل شوې نمرې راوړل',remove:'ثبت شوې نمرې پاکول',loaded:'ساتل شوې نمرې راوړل شوې.',cleared:'ثبت شوې نمرې پاکې شوې.',saved:'نمرې وساتل شوې؛ د صادرونکي تایید نه دی.',error:'د نمراتو ساتل یا راوړل ناکام شول.',consentRequired:'تر ساتلو مخکې د رضایت چوکاټ وټاکئ.',invalidScore:'نمرې وګورئ: هر ارزښت باید په ټاکلي مقیاس کې عدد وي.',noValues:'تر ساتلو مخکې لږ تر لږه یوه نمره ولیکئ.',locked:'د صادرونکي تایید شوې نمرې دلته نه شي بدلېدای.',working:'کار روان دی…'}
};
const sections=['listening','reading','speaking','writing'];
let profile={},epoch=0,notice='';
document.addEventListener('bursyar:identity',()=>{profile={};epoch++;notice='';const root=document.querySelector('#academic-evidence-mount');if(root)mountAcademicEvidence(root,document.documentElement.lang);});
document.addEventListener('bursyar:profile',event=>{profile=structuredClone(event.detail??{});const root=document.querySelector('#academic-evidence-mount');if(root)mountAcademicEvidence(root,document.documentElement.lang);});
export function mountAcademicEvidence(root,language='en'){
 if(!root)return;
 const t=academicEvidenceCopy[language]??academicEvidenceCopy.en,ownEpoch=epoch;
 root.replaceChildren();
 const section=document.createElement('section');section.className='section';section.id='academic-evidence';root.append(section);
 const create=(tag,parent=section,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;parent.append(el);return el;};
 create('h3',section,t.title);create('p',section,t.note);
 const form=create('form');form.id='academic-evidence-form';
 // One field anatomy everywhere: a real <label for> above its own control.
 const addField=(parent,key,labelText,kind='number')=>{
  const wrap=create('div',parent);wrap.className='field';
  const label=create('label',wrap,labelText);label.htmlFor='academic-'+key;
  const control=document.createElement(kind==='select'?'select':'input');
  control.id='academic-'+key;control.name=key;
  if(kind==='number'){control.type='number';control.step='any';control.min='0';control.inputMode='decimal';}
  wrap.append(control);return control;
 };
 const gradeFields=create('div',form);gradeFields.className='academic-grade-fields field-row';
 const gpa=addField(gradeFields,'gpa',t.gpa);
 const scale=addField(gradeFields,'scale',t.scale,'select');
 for(const value of ['4','5']){const option=create('option',scale,value);option.value=value;}
 const test=addField(form,'test',t.test,'select');
 for(const [value,label] of [['',t.none],['IELTS Academic','IELTS Academic'],['TOEFL iBT','TOEFL iBT']]){const opt=create('option',test,label);opt.value=value;}
 const scores=create('div',form);scores.className='academic-scores field-row';
 const overall=addField(scores,'overall',t.overall);
 const sectionInputs=Object.fromEntries(sections.map(key=>[key,addField(scores,key,t[key])]));
 const consentWrap=create('div',form);consentWrap.className='consent-field';
 const consent=create('input',consentWrap);consent.type='checkbox';consent.id='academic-consent';consent.name='consent';
 const consentLabel=create('label',consentWrap,t.consent);consentLabel.htmlFor='academic-consent';
 const actions=create('div',form);actions.className='form-actions';
 const save=create('button',actions,t.save);save.type='submit';save.className='primary-link';
 const secondaryActions=create('div',form);secondaryActions.className='secondary-actions';
 const reload=create('button',secondaryActions,t.load);reload.type='button';reload.className='text-button';
 const clear=create('button',secondaryActions,t.remove);clear.type='button';clear.className='text-button danger';
 const status=create('p',form,notice);status.className='form-status';
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
 const locked=key=>profile[key]?.origin==='issuer_verified';
 const refresh=()=>{
  const gp=profile.gpa?.value,lang=profile.languageTest?.value;
  gpa.value=gp?.gpa??'';scale.value=String(gp?.scale??4);
  test.value=['IELTS Academic','TOEFL iBT'].includes(lang?.test)?lang.test:'';
  overall.value=lang?.overall??'';
  for(const key of sections)sectionInputs[key].value=lang?.bands?.[key]??lang?.sections?.[key]??'';
  gpa.max=scale.value;
  gpa.disabled=scale.disabled=locked('gpa');
  test.disabled=overall.disabled=locked('languageTest');
  for(const key of sections)sectionInputs[key].disabled=locked('languageTest');
  scores.hidden=!test.value;
  updateLimits();
 };
 function updateLimits(){
  const isIelts=test.value==='IELTS Academic',max=isIelts?9:120,step=isIelts?'0.5':'1';
  overall.max=String(max);overall.step=step;
  for(const input of Object.values(sectionInputs)){input.max=String(isIelts?9:30);input.step=step;}
 }
 test.addEventListener('change',()=>{scores.hidden=!test.value;updateLimits();});
 scale.addEventListener('change',()=>{gpa.max=scale.value;});
 const toNumber=(input)=>{if(input.value.trim()==='')throw Error('Missing score');const v=Number(input.value);if(!Number.isFinite(v))throw Error('Invalid score');return v;};
 function valuesForSave(){
  const values={};
  if(!locked('gpa')){if(gpa.value.trim())values.gpa={gpa:toNumber(gpa),scale:Number(scale.value)};}
  if(!locked('languageTest')&&test.value){
   const numeric=Object.fromEntries(sections.map(k=>[k,toNumber(sectionInputs[k])]));
   values.languageTest=test.value==='IELTS Academic'?{test:'IELTS Academic',overall:toNumber(overall),bands:numeric}:{test:'TOEFL iBT',overall:toNumber(overall),sections:numeric};
  }
  for(const [key,value] of Object.entries(values))if(!validProfileValue(key,value))throw Error('Invalid score');
  return values;
 }
 async function api(method,values){
  const token=await getInferenceToken();
  if(epoch!==ownEpoch)throw Error('Identity changed');
  const result=await fetch('/api/profile',{method,credentials:'omit',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},...(values?{body:JSON.stringify({consent:true,values})}:{}),signal:AbortSignal.timeout(15000)});
  if(!result.ok)throw Error('Request failed');
  const data=await result.json();if(epoch!==ownEpoch)throw Error('Identity changed');
  notice=method==='GET'?t.loaded:values?.gpa===null?t.cleared:t.saved;
  document.dispatchEvent(new CustomEvent('bursyar:profile',{detail:data}));
 }
 async function act(fn){
  status.textContent=t.working;form.setAttribute('aria-busy','true');
  for(const button of [save,reload,clear])button.disabled=true;
  try{await fn();if(status.isConnected&&status.textContent===t.working)status.textContent=notice?t[notice]:'';}
  catch{if(status.isConnected)status.textContent=t.error;}
  finally{form.removeAttribute('aria-busy');for(const button of [save,reload,clear])button.disabled=false;}
 }
 function requireConsent(){
  consent.removeAttribute('aria-invalid');
  if(consent.checked)return true;
  status.textContent=t.consentRequired;consent.setAttribute('aria-invalid','true');consent.focus();return false;
 }
 form.addEventListener('submit',e=>{
  e.preventDefault();
  if(!requireConsent())return;
  let values;
  try{values=valuesForSave();}catch{status.textContent=t.invalidScore;return;}
  if(!Object.keys(values).length){status.textContent=t.noValues;return;}
  act(()=>api('PUT',values));
 });
 reload.addEventListener('click',()=>act(()=>api('GET')));
 clear.addEventListener('click',()=>{
  if(locked('gpa')||locked('languageTest')){status.textContent=t.locked;return;}
  if(!requireConsent())return;
  act(()=>api('PUT',{gpa:null,languageTest:null}));
 });
 refresh();
}
