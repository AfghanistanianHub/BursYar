import {getInferenceToken} from './auth.js';
import {validProfileValue} from '../engine/profile-schema.js';

// These are user declarations, never issuer-verified scores or accepted tests.
// This form edits only GPA and languageTest; existing profile fields remain intact.
const copy={
 en:{title:'Academic scores (optional)',note:'Enter scores only as stated on your records. Nothing here proves issuer authenticity, scholarship eligibility or acceptance of a test.',gpa:'GPA',scale:'Official GPA scale',test:'Language test',none:'Not provided',overall:'Overall',reading:'Reading',listening:'Listening',speaking:'Speaking',writing:'Writing',consent:'I approve storing these scores privately as unverified declarations.',save:'Save score declarations',load:'Reload saved scores',remove:'Clear these score declarations',saved:'Score declarations saved; not issuer verified.',error:'Could not save or load scores.',locked:'Issuer-verified scores cannot be edited here.',working:'Working…'},
 fa:{title:'نمره‌های تحصیلی (اختیاری)',note:'نمره‌ها را فقط مطابق مدارک خود وارد کنید. این اطلاعات تأیید صادرکننده، واجد شرایط بودن یا پذیرش آزمون را اثبات نمی‌کند.',gpa:'معدل (GPA)',scale:'مقیاس رسمی معدل',test:'آزمون زبان',none:'ارائه نشده',overall:'نمره مجموع',reading:'خواندن',listening:'شنیدن',speaking:'صحبت کردن',writing:'نوشتن',consent:'ذخیره خصوصی این نمره‌ها را به‌عنوان اظهارات تأییدنشده می‌پذیرم.',save:'ذخیره نمره‌های اظهارشده',load:'بارگذاری نمره‌های ذخیره‌شده',remove:'پاک کردن نمره‌های اظهارشده',saved:'نمره‌ها ذخیره شدند؛ تأیید صادرکننده نیستند.',error:'ذخیره یا بارگذاری نمره‌ها ممکن نشد.',locked:'نمره‌های تأییدشدهٔ صادرکننده در اینجا قابل ویرایش نیستند.',working:'در حال انجام…'},
 ps:{title:'تحصیلي نمرې (اختیاري)',note:'یوازې د خپلو اسنادو مطابق نمرې ولیکئ. دا د صادرونکي تایید، د بورس وړتیا یا د ازموینې منل نه ثابتوي.',gpa:'اوسط نمره (GPA)',scale:'د اوسط رسمي مقیاس',test:'د ژبې ازموینه',none:'نه ده ورکړل شوې',overall:'ټولیزې نمرې',reading:'لوستل',listening:'اورېدل',speaking:'خبرې کول',writing:'لیکل',consent:'زه د دې نه تایید شویو نمراتو شخصي ساتنې ته رضایت ورکوم.',save:'د نمراتو ثبتول',load:'ساتل شوې نمرې راوړل',remove:'ثبت شوې نمرې پاکول',saved:'نمرې وساتل شوې؛ د صادرونکي تایید نه دی.',error:'د نمراتو ساتل یا راوړل ناکام شول.',locked:'د صادرونکي تایید شوې نمرې دلته نه شي بدلېدای.',working:'کار روان دی…'}
};
const sections=['listening','reading','speaking','writing'];
let profile={},epoch=0,notice='';
document.addEventListener('bursyar:identity',()=>{profile={};epoch++;notice='';});
document.addEventListener('bursyar:profile',event=>{profile=structuredClone(event.detail??{});});
export function mountAcademicEvidence(root,language='en'){
 if(!root)return;
 const t=copy[language]??copy.en,ownEpoch=epoch;
 root.replaceChildren();
 const section=document.createElement('section');section.className='section';section.id='academic-evidence';root.append(section);
 const create=(tag,parent=section,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;parent.append(el);return el;};
 create('h3',section,t.title);create('p',section,t.note);
 const form=create('form');
 const field=(key,type='number',parent=form)=>{
  const label=create('label',parent,t[key]);const input=create('input',label);
  input.name=key;input.id='academic-'+key;input.type=type;if(type==='number'){input.step='any';input.min='0';}
  return input;
 };
 const gpa=field('gpa');
 const scaleLabel=create('label',form,t.scale),scale=create('select',scaleLabel);
 scale.name='scale';for(const value of ['4','5']){const option=create('option',scale,value);option.value=value;}
 const testLabel=create('label',form,t.test),test=create('select',testLabel);
 test.name='test';
 for(const [value,label] of [['',t.none],['IELTS Academic','IELTS Academic'],['TOEFL iBT','TOEFL iBT']]){const opt=create('option',test,label);opt.value=value;}
 const scores=create('div',form);scores.className='academic-scores';
 const overall=field('overall','number',scores);
 const sectionInputs=Object.fromEntries(sections.map(key=>[key,field(key,'number',scores)]));
 const consentLabel=create('label',form,t.consent),consent=create('input',consentLabel);consent.type='checkbox';consent.required=true;
 const save=create('button',form,t.save);save.type='submit';
 const reload=create('button',section,t.load);reload.type='button';
 const clear=create('button',section,t.remove);clear.type='button';
 const status=create('p',section,notice);status.setAttribute('role','status');
 const locked=key=>profile[key]?.origin==='issuer_verified';
 const refresh=()=>{
  const gp=profile.gpa?.value,lang=profile.languageTest?.value;
  gpa.value=gp?.gpa??'';scale.value=String(gp?.scale??4);
  test.value=['IELTS Academic','TOEFL iBT'].includes(lang?.test)?lang.test:'';
  overall.value=lang?.overall??'';
  for(const key of sections)sectionInputs[key].value=lang?.bands?.[key]??lang?.sections?.[key]??'';
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
  profile=data;document.dispatchEvent(new CustomEvent('bursyar:profile',{detail:data}));refresh();
 }
 async function act(fn){
  status.textContent=t.working;for(const button of [save,reload,clear])button.disabled=true;
  try{await fn();status.textContent=t.saved;}catch{status.textContent=t.error;}finally{for(const button of [save,reload,clear])button.disabled=false;}
 }
 form.addEventListener('submit',e=>{e.preventDefault();act(async()=>{if(!consent.checked)throw Error('Consent required');const values=valuesForSave();if(!Object.keys(values).length)throw Error('No values');await api('PUT',values);});});
 reload.addEventListener('click',()=>act(()=>api('GET')));
 clear.addEventListener('click',()=>act(async()=>{if(!consent.checked||locked('gpa')||locked('languageTest'))throw Error('Unavailable');await api('PUT',{gpa:null,languageTest:null});}));
 refresh();
}
