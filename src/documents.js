import {getInferenceToken} from './auth.js';
const copy={
 en:{title:'Review an educational text document',note:'Private local demo: UTF-8 .txt only, up to 12 KB. PDF and image extraction are unsupported. Inspection never proves authenticity. Documents are not sent to Meta.',consent:'I consent to private local storage and extraction for this demonstration.',upload:'Upload and inspect',review:'Approve reviewed claims',remove:'Delete document and linked profile facts',load:'Load my approved profile',accept:'Accept extracted value',correct:'Use my correction',reject:'Reject',pending:'Review every claim before approval. Translations and issuer authenticity are not verified.',error:'Document request unavailable. Sign in with an approved account and check that private document storage is enabled.',done:'Profile updated. Claims remain unverified.',deleted:'Document and linked facts deleted.',empty:'No supported claims extracted, or conflicting claims require manual review.',file:'Educational text file',bands:['Overall','Listening','Reading','Writing','Speaking'],degree:'Degree',languageTest:'IELTS Academic (overall, listening, reading, writing, speaking)'},
 fa:{title:'بازبینی سند متنی تحصیلی',note:'دموی محلی خصوصی: فقط فایل متنی UTF-8 تا ۱۲ کیلوبایت. استخراج PDF و تصویر پشتیبانی نمی‌شود. بررسی، اصالت سند را ثابت نمی‌کند. اسناد به متا فرستاده نمی‌شوند.',consent:'با ذخیره و استخراج محلی خصوصی برای این نمایش موافقم.',upload:'بارگذاری و بررسی',review:'تأیید ادعاهای بازبینی‌شده',remove:'حذف سند و اطلاعات مرتبط پروفایل',load:'بارگذاری پروفایل تأییدشدهٔ من',accept:'پذیرش مقدار استخراج‌شده',correct:'استفاده از اصلاح من',reject:'رد',pending:'هر ادعا را پیش از تأیید بازبینی کنید. ترجمه و اصالت صادرکننده تأیید نشده است.',error:'درخواست سند در دسترس نیست. با حساب مجاز وارد شوید و ذخیرهٔ خصوصی را بررسی کنید.',done:'پروفایل به‌روزرسانی شد. ادعاها هنوز تأیید رسمی نشده‌اند.',deleted:'سند و اطلاعات مرتبط حذف شدند.',empty:'ادعای پشتیبانی‌شده پیدا نشد یا تناقض به بازبینی دستی نیاز دارد.',file:'فایل متنی تحصیلی',bands:['مجموع','شنیدن','خواندن','نوشتن','صحبت کردن'],degree:'مقطع تحصیلی',languageTest:'آیلتس اکادمیک (مجموع، شنیدن، خواندن، نوشتن، صحبت کردن)'},
 ps:{title:'د تحصیلي متني سند بیاکتنه',note:'شخصي محلي ډیمو: یوازې UTF-8 متني فایل تر ۱۲ کیلوبایټه. PDF او انځور نه لوستل کېږي. کتنه د سند اصالت نه ثابتوي. اسناد مېټا ته نه لېږل کېږي.',consent:'د دې نندارې لپاره د شخصي محلي ساتنې او استخراج اجازه ورکوم.',upload:'پورته کول او کتنه',review:'بیاکتل شوې ادعاوې ومنئ',remove:'سند او د پروفایل تړلي معلومات ړنګ کړئ',load:'زما منل شوی پروفایل راواخلئ',accept:'استخراج شوی ارزښت منل',correct:'زما سمون کارول',reject:'رد',pending:'هره ادعا تر منلو مخکې وګورئ. ژباړه او د صادرونکي اصالت نه دي تایید شوي.',error:'د سند غوښتنه نه کېږي. له مجاز حساب سره ننوځئ او شخصي ساتنه وګورئ.',done:'پروفایل بدل شو. ادعاوې لا رسمي تایید نه لري.',deleted:'سند او تړلي معلومات ړنګ شول.',empty:'ملاتړ شوې ادعا ونه موندل شوه یا تناقض لاسي بیاکتنې ته اړتیا لري.',file:'تحصیلي متني فایل',bands:['عمومي','اورېدل','لوستل','لیکل','خبرې کول'],degree:'تحصیلي کچه',languageTest:'IELTS Academic (عمومي، اورېدل، لوستل، لیکل، خبرې کول)'}
};
const libraryCopy={en:{title:'Private document library',refresh:'Refresh list',open:'Open selected document',empty:'No documents saved',reviewed:'Reviewed — not verified',pending:'Pending review'},fa:{title:'کتابخانهٔ اسناد خصوصی',refresh:'تازه‌سازی فهرست',open:'باز کردن سند انتخاب‌شده',empty:'سندی ذخیره نشده است',reviewed:'بازبینی‌شده؛ تأیید نشده',pending:'در انتظار بازبینی'},ps:{title:'د شخصي اسنادو زېرمتون',refresh:'لړ تازه کول',open:'ټاکل شوی سند پرانیستل',empty:'هېڅ سند نه دی ساتل شوی',reviewed:'بیاکتل شوی؛ نه دی تایید شوی',pending:'د بیاکتنې په تمه'}};
let current=null,identityEpoch=0;
document.addEventListener('bursyar:identity',()=>{current=null;identityEpoch++;const root=document.querySelector('#documents-mount');if(root)mountDocuments(root,document.documentElement.lang);});
export function mountDocuments(root,language='en'){
 if(!root)return;
 const mountEpoch=identityEpoch;
 const t=copy[language]??copy.en;
 root.replaceChildren();const section=document.createElement('section');section.className='section';section.id='documents';root.append(section);
 const element=(tag,text,parent=section)=>{const el=document.createElement(tag);if(text)el.textContent=text;parent.append(el);return el;};
 element('h2',t.title);element('p',t.note);
 const form=element('form'),label=element('label',t.file,form),file=element('input','',label);file.type='file';file.accept='.txt,text/plain';file.required=true;
 const consentLabel=element('label',t.consent,form),consent=element('input','',consentLabel);consent.type='checkbox';consent.required=true;
 const upload=element('button',t.upload,form);upload.type='submit';
 const load=element('button',t.load);load.type='button';
 const l=libraryCopy[language]??libraryCopy.en;const library=element('fieldset');element('legend',l.title,library);const chooser=element('select','',library);chooser.setAttribute('aria-label',l.title);const refresh=element('button',l.refresh,library);refresh.type='button';const open=element('button',l.open,library);open.type='button';
 const status=element('p');status.setAttribute('role','status');const content=element('div');
 async function api(path,method='GET',body){if(mountEpoch!==identityEpoch)throw Error();const epoch=identityEpoch;const token=await getInferenceToken();const r=await fetch(path,{method,credentials:'omit',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error();const data=await r.json();if(epoch!==identityEpoch)throw Error();return data;}
 const publish=profile=>document.dispatchEvent(new CustomEvent('bursyar:profile',{detail:profile}));
 async function busy(action){for(const button of section.querySelectorAll('button'))button.disabled=true;try{await action();}catch{status.textContent=t.error;}finally{for(const button of section.querySelectorAll('button'))button.disabled=false;open.disabled=!chooser.value;}}
 async function refreshLibrary(){const items=await api('/api/documents');chooser.replaceChildren();for(const [i,item]of items.entries()){const date=new Intl.DateTimeFormat(language==='fa'?'fa-AF':language==='ps'?'ps-AF':'en',{dateStyle:'medium',timeStyle:'short'}).format(new Date(item.uploadedAt));const option=element('option',`${new Intl.NumberFormat(language).format(i+1)} · ${date} · ${item.reviewed?l.reviewed:l.pending}`,chooser);option.value=item.id;}if(!items.length){const option=element('option',l.empty,chooser);option.value='';}open.disabled=!chooser.value;}
 refresh.addEventListener('click',()=>busy(refreshLibrary));open.addEventListener('click',()=>busy(async()=>{if(!chooser.value)return;current=await api('/api/documents/'+chooser.value);show(current);}));open.disabled=true;
 load.addEventListener('click',()=>busy(async()=>{publish(await api('/api/profile'));status.textContent=t.done;}));
 function show(doc){
  content.replaceChildren();element('p',t.pending,content);
  const source=element('pre',doc.text,content);source.dir='auto';
  const review=element('form','',content),editors=[];
  if(!doc.pending.length)element('p',doc.reviewedAt?t.done:t.empty,review);
  for(const claim of doc.pending){
   const field=element('fieldset','',review);field.className='document-claim';element('legend',t[claim.field],field);element('blockquote',claim.sourceExcerpt,field);
   const decisionLabel=element('label',t.review,field),decision=element('select','',decisionLabel);
   for(const [value,key]of [['accept','accept'],['correct','correct'],['reject','reject']]){const option=element('option',t[key],decision);option.value=value;}
   const values=claim.field==='degree'?[claim.value]:[claim.value.overall,...['listening','reading','writing','speaking'].map(k=>claim.value.bands[k])];
   const inputs=values.map((value,i)=>{const label=element('label',claim.field==='degree'?t.degree:t.bands[i],field);const input=element('input','',label);input.value=value;input.disabled=true;if(claim.field!=='degree'){input.type='number';input.min='0';input.max='9';input.step='.5';}input.required=true;return input;});
   decision.addEventListener('change',()=>inputs.forEach(input=>input.disabled=decision.value!=='correct'));
   editors.push({claim,decision,inputs});
  }
  if(editors.length){const approve=element('button',t.review,review);approve.type='submit';}
  review.addEventListener('submit',event=>{event.preventDefault();busy(async()=>{
   const decisions=Object.fromEntries(editors.map(({claim,decision,inputs})=>{const values=inputs.map(input=>input.type==='number'?Number(input.value):input.value);const value=claim.field==='degree'?values[0]:{test:'IELTS Academic',overall:values[0],bands:Object.fromEntries(['listening','reading','writing','speaking'].map((key,i)=>[key,values[i+1]]))};return [claim.id,{action:decision.value,...(decision.value==='correct'?{value}:{})}];}));
   publish(await api(`/api/documents/${doc.id}/review`,'POST',{decisions}));doc.reviewedAt=true;doc.pending=[];current=doc;status.textContent=t.done;review.remove();
  });});
  const remove=element('button',t.remove,content);remove.type='button';remove.addEventListener('click',()=>busy(async()=>{await api(`/api/documents/${doc.id}`,'DELETE');current=null;content.replaceChildren();publish(await api('/api/profile'));status.textContent=t.deleted;await refreshLibrary();}));
 }
 form.addEventListener('submit',event=>{event.preventDefault();busy(async()=>{const selected=file.files[0];if(!selected||selected.size>12000||!selected.name.toLowerCase().endsWith('.txt')||!consent.checked)throw Error();const text=new TextDecoder('utf-8',{fatal:true}).decode(await selected.arrayBuffer());current=await api('/api/documents','POST',{text,mime:'text/plain',consent:true});show(current);await refreshLibrary();});});
 if(current)show(current);
}
