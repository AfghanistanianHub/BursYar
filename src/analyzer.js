import {signIn,signOut,getInferenceToken} from './auth.js';
import {findBarriers} from './pathfinder.js';
export function mountAnalyzer(form, language, esc) {
  const result=form.querySelector('#analysis-result');
  const source=document.createElement('label');
  source.textContent={en:'Official source URL',fa:'نشانی منبع رسمی',ps:'د رسمي سرچینې پته'}[language];
  const url=document.createElement('input');url.type='url';url.required=true;url.name='sourceUrl';url.placeholder='https://';source.append(url);form.prepend(source);
  const login=document.createElement('button');login.type='button';
  login.textContent={en:'Sign in with Google (approved demo accounts)',fa:'ورود با گوگل (حساب‌های تأییدشدهٔ دمو)',ps:'د ګوګل له لارې ننوتل (د ډیمو تایید شوي حسابونه)'}[language];
  const logout=document.createElement('button');logout.type='button';
  logout.textContent={en:'Sign out',fa:'خروج',ps:'وتل'}[language];
  const authStatus=document.createElement('p');authStatus.setAttribute('role','status');
  login.addEventListener('click',async()=>{login.disabled=true;try{await signIn();authStatus.textContent={en:'Signed in. Demo approval is checked by the server.',fa:'وارد شدید. مجوز دمو در سرور بررسی می‌شود.',ps:'ننوتل بشپړ شول. د ډیمو اجازه په سرور کې کتل کېږي.'}[language];}catch{authStatus.textContent={en:'Sign-in unavailable. Firebase configuration and an enabled provider are required.',fa:'ورود ممکن نیست. پیکربندی فایربیس و فعال بودن ارائه‌دهنده لازم است.',ps:'ننوتل ممکن نه دي. د فایربیس تنظیم او فعال چمتو کوونکی اړین دي.'}[language];}finally{login.disabled=false;}});
  logout.addEventListener('click',async()=>{try{await signOut();result.replaceChildren();result.hidden=true;authStatus.textContent={en:'Signed out',fa:'خارج شدید',ps:'ووتل'}[language];}catch{authStatus.textContent={en:'Sign-out unavailable',fa:'خروج در دسترس نیست',ps:'وتل ممکن نه دي'}[language];}});
  form.prepend(login,logout,authStatus);
  form.addEventListener('submit',async event=>{
    event.preventDefault();result.hidden=false;
    result.textContent={en:'Analyzing…',fa:'در حال بررسی…',ps:'د څېړنې په حال کې…'}[language];
    const button=form.querySelector('button[type="submit"]');button.disabled=true;
    try {
      const token=await getInferenceToken();
      // Firebase user token goes only to same-origin gateway; never a Meta/shared secret.
      const submittedSource=new URL(url.value);
      if(submittedSource.protocol!=='https:' || submittedSource.username || submittedSource.password)throw Error('Invalid source');
      const response=await fetch('/api/analyze',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({text:form.querySelector('textarea').value,sourceUrl:url.value,language}),signal:AbortSignal.timeout(25000)});
      if(!response.ok)throw new Error('unavailable');
      const a=await response.json();
      if(a.requiresHumanReview!==true || !Array.isArray(a.criteria) || !a.criteria.every(c=>typeof c.excerpt==='string' && typeof c.en==='string' && typeof c[language]==='string'))throw new Error('invalid');
      result.innerHTML=`<p>${esc({en:'AI interpretation and translations — not human reviewed. Verify every requirement.',fa:'برداشت و ترجمهٔ هوش مصنوعی — بازبینی انسانی نشده است. هر شرط را تأیید کنید.',ps:'د مصنوعي ځیرکتیا تفسیر او ژباړې — انساني بیاکتنه نه ده شوې. هر شرط تایید کړئ.'}[language])}</p><p><a href="${esc(submittedSource.href)}" target="_blank" rel="noopener noreferrer">${esc(submittedSource.href)}</a></p>${a.criteria.map(c=>`<article><blockquote dir="auto">${esc(c.excerpt)}</blockquote><p lang="en" dir="ltr">${esc(c.en)}</p>${language!=='en'?`<p>${esc(c[language])}</p>`:''}</article>`).join('')}<p>${esc(a.deadline??{en:'Deadline: unknown',fa:'مهلت: نامشخص',ps:'وروستۍ نېټه: نامعلومه'}[language])}</p>`;
      const fields=document.createElement('fieldset');fields.innerHTML=`<legend>${esc({en:'Optional document availability (stays in this page)',fa:'دسترسی اختیاری به اسناد (فقط در این صفحه)',ps:'اسنادو ته اختیاري لاسرسی (یوازې په دې پاڼه کې)'}[language])}</legend>`;
      const answers={};
      const guidance=document.createElement('div');guidance.setAttribute('aria-live','polite');
      const update=()=>{guidance.replaceChildren();for(const r of findBarriers(a.criteria,answers)){const p=document.createElement('p');p.textContent=`${r.criterionId}: ${r.status} — ${r.action}`;p.lang='en';p.dir='ltr';guidance.append(p);}};
      for(const [kind,label] of Object.entries({transcripts:{en:'Academic documents',fa:'اسناد تحصیلی',ps:'تحصیلي اسناد'},language_test:{en:'Language test',fa:'آزمون زبان',ps:'د ژبې ازموینه'},travel_document:{en:'Travel document',fa:'سند سفر',ps:'د سفر سند'}})){
        const l=document.createElement('label');l.textContent=label[language];const s=document.createElement('select');
        for(const [value,text] of Object.entries({unknown:{en:'Unknown / skip',fa:'نامشخص / رد کردن',ps:'نامعلوم / پرېښودل'},available:{en:'Available',fa:'موجود',ps:'شته'},unavailable:{en:'Unavailable',fa:'موجود نیست',ps:'نشته'}})){const o=document.createElement('option');o.value=value;o.textContent=text[language];s.append(o);}s.addEventListener('change',()=>{answers[kind]=s.value;update();});l.append(s);fields.append(l);
      }result.append(fields,guidance);update();
    }catch{result.textContent={en:'Analysis unavailable. A configured, authenticated Meta gateway is required. No analysis was generated.',fa:'بررسی در دسترس نیست. اتصال پیکربندی‌شده و احراز هویت‌شدهٔ متا لازم است. نتیجه‌ای تولید نشد.',ps:'څېړنه شتون نه لري. د میټا تنظیم شوې او تایید شوې دروازه اړینه ده. پایله نه ده جوړه شوې.'}[language];}
    finally{button.disabled=false;}
  });
}
