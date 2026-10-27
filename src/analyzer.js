import {signIn,signOut,getInferenceToken} from './auth.js';
import {findBarriers,barrierText} from './pathfinder.js';
const copy={
 en:{source:'Official source URL',login:'Sign in with Google (approved demo accounts)',logout:'Sign out',signedIn:'Signed in. Demo approval is checked by the server.',signedOut:'Signed out',authError:'Sign-in unavailable. Check Firebase configuration and the enabled Google provider.',loading:'Analyzing the source…',review:'AI interpretation and translations — not human reviewed. Verify every requirement.',deadline:'Deadline',unknown:'Unknown; verify with the institution.',funding:'Funding evidence',uncertainties:'Uncertainties',provenance:'Source and review status',unreviewed:'Not human reviewed',analyzed:'Analysis time',digest:'Source SHA-256',barriers:'Optional document availability (stays in this page)',transcripts:'Academic documents',language_test:'Language test',travel_document:'Travel document',skip:'Unknown / skip',available:'Available',unavailable:'Unavailable',error:'Analysis unavailable. No verified result was returned.',unauthorized:'Sign in with an approved demo account.',quota:'Quota or concurrency limit reached. Try later or contact the demo administrator.',gateway:'The analysis service is unavailable. Check the server configuration.'},
 fa:{source:'نشانی منبع رسمی',login:'ورود با گوگل (حساب‌های تأییدشدهٔ دمو)',logout:'خروج',signedIn:'وارد شدید. مجوز دمو در سرور بررسی می‌شود.',signedOut:'خارج شدید',authError:'ورود ممکن نیست. تنظیمات فایربیس و فعال بودن گوگل را بررسی کنید.',loading:'در حال بررسی منبع…',review:'برداشت و ترجمهٔ هوش مصنوعی — بازبینی انسانی نشده است. هر شرط را تأیید کنید.',deadline:'مهلت',unknown:'نامشخص؛ از مؤسسه تأیید بگیرید.',funding:'شواهد حمایت مالی',uncertainties:'موارد نامشخص',provenance:'منبع و وضعیت بازبینی',unreviewed:'بازبینی انسانی نشده است',analyzed:'زمان بررسی',digest:'شناسهٔ SHA-256 منبع',barriers:'دسترسی اختیاری به اسناد (فقط در این صفحه)',transcripts:'اسناد تحصیلی',language_test:'آزمون زبان',travel_document:'سند سفر',skip:'نامشخص / رد کردن',available:'موجود',unavailable:'موجود نیست',error:'بررسی در دسترس نیست. نتیجهٔ تأییدشده‌ای دریافت نشد.',unauthorized:'با حساب تأییدشدهٔ دمو وارد شوید.',quota:'محدودیت استفاده یا درخواست هم‌زمان تکمیل شده است. بعداً تلاش کنید یا با مدیر دمو تماس بگیرید.',gateway:'خدمت بررسی در دسترس نیست. تنظیمات سرور را بررسی کنید.'},
 ps:{source:'د رسمي سرچینې پته',login:'د ګوګل له لارې ننوتل (د ډیمو تایید شوي حسابونه)',logout:'وتل',signedIn:'ننوتل بشپړ شول. د ډیمو اجازه په سرور کې کتل کېږي.',signedOut:'ووتل',authError:'ننوتل ممکن نه دي. د فایربیس تنظیم او د ګوګل فعالول وګورئ.',loading:'سرچینه څېړل کېږي…',review:'د مصنوعي ځیرکتیا تفسیر او ژباړې — انساني بیاکتنه نه ده شوې. هر شرط تایید کړئ.',deadline:'وروستۍ نېټه',unknown:'نامعلوم؛ له ادارې یې تایید کړئ.',funding:'د مالي ملاتړ شواهد',uncertainties:'نامعلوم موارد',provenance:'سرچینه او د بیاکتنې حالت',unreviewed:'انساني بیاکتنه نه ده شوې',analyzed:'د څېړنې وخت',digest:'د سرچینې SHA-256 پېژند',barriers:'اسنادو ته اختیاري لاسرسی (یوازې په دې پاڼه کې)',transcripts:'تحصیلي اسناد',language_test:'د ژبې ازموینه',travel_document:'د سفر سند',skip:'نامعلوم / پرېښودل',available:'شته',unavailable:'نشته',error:'څېړنه شتون نه لري. تایید شوې پایله ترلاسه نه شوه.',unauthorized:'د ډیمو له تایید شوي حساب سره ننوځئ.',quota:'د کارونې یا هم‌مهاله غوښتنو حد پوره شوی. وروسته هڅه وکړئ یا د ډیمو له مدیر سره اړیکه ونیسئ.',gateway:'د څېړنې خدمت شتون نه لري. د سرور تنظیم وګورئ.'}
};
export function mountAnalyzer(form,language,esc,initial={}){
 const t=copy[language]||copy.en,result=form.querySelector('#analysis-result'),submit=form.querySelector('button[type="submit"]');
 let controller;
 const source=document.createElement('label');source.textContent=t.source;
 const url=document.createElement('input');url.type='url';url.required=true;url.name='sourceUrl';url.id='source-url';url.placeholder='https://';url.value=initial.sourceUrl||'';url.dir='ltr';source.append(url);
 const textarea=form.querySelector('textarea');textarea.value=initial.text||'';
 const login=document.createElement('button');login.type='button';login.textContent=t.login;
 const logout=document.createElement('button');logout.type='button';logout.textContent=t.logout;
 const authStatus=document.createElement('p');authStatus.setAttribute('role','status');
 form.prepend(login,logout,authStatus,source);
 login.addEventListener('click',async()=>{login.disabled=true;try{await signIn();authStatus.textContent=t.signedIn;}catch{authStatus.textContent=t.authError;}finally{login.disabled=false;}});
 logout.addEventListener('click',async()=>{controller?.abort();form.analysis=undefined;try{await signOut();result.replaceChildren();result.hidden=true;authStatus.textContent=t.signedOut;}catch{authStatus.textContent=t.authError;}});

 function renderAnalysis(a,submittedSource){
   form.analysis={data:a,url:submittedSource.href};result.hidden=false;
   const evidence=items=>items.length?`<ul>${items.map(x=>`<li dir="auto">${esc(x)}</li>`).join('')}</ul>`:`<p>${esc(t.unknown)}</p>`;
   result.innerHTML=`<p class="review-note">${esc(t.review)}</p><h3>${esc(t.provenance)}</h3><p><a href="${esc(submittedSource.href)}" target="_blank" rel="noopener noreferrer" dir="ltr">${esc(submittedSource.href)}</a></p><p>${esc(t.unreviewed)}</p><p>${esc(t.analyzed)}: <bdi>${esc(a.analyzedAt)}</bdi></p><p class="source-digest">${esc(t.digest)}: <bdi>${esc(a.sourceDigest)}</bdi></p>${a.criteria.map(c=>`<article class="criterion"><blockquote dir="auto">${esc(c.excerpt)}</blockquote><p lang="en" dir="ltr">${esc(c.en)}</p>${language!=='en'?`<p lang="${language}" dir="rtl">${esc(c[language])}</p>`:''}</article>`).join('')}<h3>${esc(t.deadline)}</h3><p dir="auto">${esc(a.deadline??t.unknown)}</p><h3>${esc(t.funding)}</h3>${evidence(a.funding)}<h3>${esc(t.uncertainties)}</h3>${evidence(a.uncertainties)}`;
   const fields=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent=t.barriers;fields.append(legend);
   const answers={},guidance=document.createElement('div');guidance.setAttribute('aria-live','polite');guidance.id='barrier-guidance';
   const update=()=>{guidance.replaceChildren();for(const r of findBarriers(a.criteria,answers)){const p=document.createElement('p'),content=barrierText(r,language);p.textContent=`${content.status} — ${content.action}`;p.dataset.criterion=r.criterionId;guidance.append(p);}};
   for(const kind of ['transcripts','language_test','travel_document']){const label=document.createElement('label');label.textContent=t[kind];const select=document.createElement('select');select.name=kind;for(const [value,key]of [['unknown','skip'],['available','available'],['unavailable','unavailable']]){const option=document.createElement('option');option.value=value;option.textContent=t[key];select.append(option);}select.addEventListener('change',()=>{answers[kind]=select.value;update();});label.append(select);fields.append(label);}
   result.append(fields,guidance);update();
 }
 if(initial.analysis)renderAnalysis(initial.analysis.data,new URL(initial.analysis.url));
 form.addEventListener('submit',async event=>{
  event.preventDefault();form.analysis=undefined;controller?.abort();const current=controller=new AbortController();
  result.hidden=false;result.textContent=t.loading;form.setAttribute('aria-busy','true');submit.disabled=true;
  try{
   const token=await getInferenceToken();
   const submittedSource=new URL(url.value);if(submittedSource.protocol!=='https:'||submittedSource.username||submittedSource.password)throw Error();
   const response=await fetch('/api/analyze',{method:'POST',credentials:'omit',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({text:textarea.value,sourceUrl:submittedSource.href,language}),signal:AbortSignal.any([current.signal,AbortSignal.timeout(75000)])});
   if(!response.ok)throw Object.assign(Error(),{status:response.status});
   const a=await response.json();
   if(a.requiresHumanReview!==true||!Array.isArray(a.criteria)||!Array.isArray(a.funding)||!Array.isArray(a.uncertainties)||!a.criteria.every(c=>typeof c.excerpt==='string'&&typeof c.en==='string'&&typeof c[language]==='string'))throw Error();
   if(current.signal.aborted||!form.isConnected)return;
   renderAnalysis(a,submittedSource);
  }catch(error){if(!current.signal.aborted&&form.isConnected)result.textContent=error.status===401?t.unauthorized:error.status===429?t.quota:error.status===503?t.gateway:t.error;}
  finally{if(controller===current){submit.disabled=false;form.removeAttribute('aria-busy');}}
 });
}
