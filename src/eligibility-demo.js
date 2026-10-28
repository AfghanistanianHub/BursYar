import {assessScholarship,simulate} from '../engine/eligibility.js';

// A visibly fictional rule set: not an actual admissions policy or an official verification.
const fixture=[
 {id:'degree',type:'minimum_degree',minimum:'bachelor',ambiguous:false,sourceUrl:'https://example.org/demo-only',sourceExcerpt:'FICTIONAL DEMO: Applicants need a bachelor degree.'},
 {id:'english',type:'ielts_academic',test:'IELTS Academic',overallMin:6.5,eachBandMin:6,ambiguous:false,sourceUrl:'https://example.org/demo-only',sourceExcerpt:'FICTIONAL DEMO: IELTS Academic 6.5 overall, no band below 6.0.'}
];
const copy={
 en:{title:'Explore your eligibility',disclaimer:'Offline illustration using fictional requirements. No document or score is verified. This does not assess any real scholarship.',degree:'Your highest degree (self-declared)',missing:'Not provided',secondary:'Secondary school',bachelor:'Bachelor',master:'Master',doctorate:'Doctorate',overall:'IELTS overall',bands:['Listening','Reading','Writing','Speaking'],test:'I have an IELTS Academic result (self-declared)',real:'Current profile assessment',future:'What if your IELTS overall score changes?',simulate:'Compare hypothetical scenario',state:{met:'Listed requirements met (not verified)',not_met:'One or more requirements not met',unknown:'Cannot determine: information missing or unsupported'},next:'A missing test certificate does not mean your English is weak. Check which tests the actual university accepts before booking.',fiction:'Fictional scholarship requirements',hypothetical:'Hypothetical result — not your verified profile',yes:'Yes',no:'No'},
 fa:{title:'بررسی شرایط تحصیلی',disclaimer:'نمونه آفلاین با شرایط کاملاً فرضی است. هیچ سند یا نمره‌ای تأیید نشده و این ارزیابی مربوط به بورسیه واقعی نیست.',degree:'بالاترین مدرک تحصیلی (اظهار کاربر)',missing:'ارائه نشده',secondary:'مکتب',bachelor:'لیسانس',master:'ماستری',doctorate:'دوکتورا',overall:'نمره مجموع آیلتس',bands:['شنیدن','خواندن','نوشتن','صحبت کردن'],test:'نتیجه آیلتس اکادمیک دارم (اظهار کاربر)',real:'ارزیابی اطلاعات فعلی',future:'اگر نمره مجموع آیلتس تغییر کند چه می‌شود؟',simulate:'مقایسه سناریوی فرضی',state:{met:'شروط نمونه برآورده شده‌اند (تأیید نشده)',not_met:'یک یا چند شرط برآورده نشده است',unknown:'به علت اطلاعات ناکافی نتیجه مشخص نیست'},next:'نداشتن سند زبان به معنای ضعف انگلیسی نیست. پیش از ثبت‌نام آزمون، شرایط پذیرش دانشگاه واقعی را بررسی کنید.',fiction:'شرایط بورسیه فرضی',hypothetical:'نتیجه فرضی است؛ پروفایل واقعی تغییر نکرده',yes:'بله',no:'خیر'},
 ps:{title:'د وړتیاوو ارزونه',disclaimer:'دا یوازې د فرضي شرایطو آفلاین بېلګه ده. هېڅ سند یا نمره نه ده تایید شوې او د واقعي بورس ارزونه نه ده.',degree:'لوړه زده کړه (ستاسې وینا)',missing:'نه ده ورکړل شوې',secondary:'ثانوي',bachelor:'لېسانس',master:'ماسټري',doctorate:'دوکتورا',overall:'د IELTS عمومي نمره',bands:['اورېدل','لوستل','لیکل','خبرې کول'],test:'د IELTS Academic پایله لرم (خپله وینا)',real:'د اوسني پروفایل ارزونه',future:'که د IELTS نمره بدله شي، څه پېښېږي؟',simulate:'د فرضي حالت پرتله',state:{met:'د بېلګې شرطونه پوره دي (نه دي تایید شوي)',not_met:'ځینې شرطونه نه دي پوره شوي',unknown:'د معلوماتو د نشتوالي له امله نامعلوم'},next:'د ژبې سند نه لرل د انګلیسي کمزوري نه ثابتوي. د ازموینې له ثبت مخکې د پوهنتون شرطونه وګورئ.',fiction:'د فرضي بورس شرطونه',hypothetical:'فرضی پایله؛ اصلي پروفایل نه دی بدل شوی',yes:'هو',no:'نه'}
};
let savedFields={},approvedProfile={};
document.addEventListener('bursyar:identity',()=>{savedFields={};approvedProfile={};document.dispatchEvent(new CustomEvent('bursyar:compilation',{detail:null}));});
document.addEventListener('bursyar:profile',event=>{
 approvedProfile=event.detail??{};
 savedFields={degree:approvedProfile.degree?.value??'',hasTest:!!approvedProfile.languageTest};
 const test=approvedProfile.languageTest?.value;
 if(test){savedFields.overall=test.overall;for(const key of ['listening','reading','writing','speaking'])savedFields[key]=test.bands?.[key]??'';}
 document.dispatchEvent(new CustomEvent('bursyar:compilation',{detail:document.querySelector('#analyze-form')?.analysis?.data?.compilation??null}));
});
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountEligibility(root,language='en',compilation=null){
 const t=copy[language]||copy.en;
 const rules=compilation?.rules??fixture;
 const liveCopy={en:'Selected AI-interpreted source requirements only. Source authenticity, completeness and translations are unverified. This is not an admissions decision.',fa:'فقط شرایط انتخاب‌شده از برداشت هوش مصنوعی. اعتبار منبع، کامل بودن و ترجمه‌ها تأیید نشده است. این تصمیم پذیرش نیست.',ps:'یوازې د مصنوعي ځیرکتیا له خوا ټاکل شوي شرطونه. د سرچینې اعتبار، بشپړتیا او ژباړې نه دي تایید شوي. دا د منلو پرېکړه نه ده.'};
 if(!root)return;
 root.innerHTML=`<section class="section" id="eligibility-demo" aria-labelledby="eligibility-heading">
 <p class="eyebrow">BURS YAR / EXPERIMENTAL</p><h2 id="eligibility-heading">${escape(t.title)}</h2>
 <p role="note">${escape(compilation?liveCopy[language]:t.disclaimer)}</p><ul>${rules.map(r=>`<li dir="auto">${escape(r.sourceExcerpt)}</li>`).join('')}</ul>
 <form id="eligibility-form">
 <label>${escape(t.degree)} <select name="degree"><option value="">${escape(t.missing)}</option>${['secondary','bachelor','master','doctorate'].map(x=>`<option value="${x}">${escape(t[x])}</option>`).join('')}</select></label>
 <label><input name="hasTest" type="checkbox"> ${escape(t.test)}</label>
 <div class="eligibility-scores" hidden><label>${escape(t.overall)} <input name="overall" type="number" min="0" max="9" step=".5" value="6"></label>
 ${['listening','reading','writing','speaking'].map((x,i)=>`<label>${escape(t.bands[i])} <input name="${x}" type="number" min="0" max="9" step=".5" value="6"></label>`).join('')}</div>
 <p><strong>${escape(t.real)}</strong></p><output id="eligibility-result" aria-live="polite"></output>
 <label>${escape(t.future)} <input name="futureScore" type="number" min="0" max="9" step=".5" value="7"></label>
 <button type="button" id="eligibility-simulate">${escape(t.simulate)}</button>
 <output id="eligibility-future" aria-live="polite"></output></form><p>${escape(t.next)}</p></section>`;
 const form=root.querySelector('#eligibility-form'),scores=form.querySelector('.eligibility-scores');
 form.addEventListener('submit',event=>event.preventDefault());
 const asFact=value=>({value,origin:'user_declared',claimIds:[]});
 function snapshot(){
  const degree=form.elements.namedItem('degree').value;
  const profile={}; if(degree)profile.degree=asFact(degree);
  if(form.elements.namedItem('hasTest').checked){
   const field=x=>{const value=form.elements.namedItem(x).value;return value===''?null:Number(value)};
   profile.languageTest=asFact({test:'IELTS Academic',overall:field('overall'),bands:Object.fromEntries(['listening','reading','writing','speaking'].map(x=>[x,field(x)]))});
  }
  for(const key of Object.keys(profile))if(JSON.stringify(profile[key].value)===JSON.stringify(approvedProfile[key]?.value))profile[key]=structuredClone(approvedProfile[key]);
  return profile;
 }
 for(const [name,value] of Object.entries(savedFields)){const el=form.elements.namedItem(name);if(el){if(el.type==='checkbox')el.checked=value;else el.value=value;}}
 function render(){
  savedFields=Object.fromEntries([...form.elements].filter(el=>el.name).map(el=>[el.name,el.type==='checkbox'?el.checked:el.value]));
  scores.hidden=!form.elements.namedItem('hasTest').checked;const assessment=assessScholarship(rules,snapshot());form.querySelector('#eligibility-result').dataset.status=assessment.summary;form.querySelector('#eligibility-result').textContent=t.state[assessment.summary];form.querySelector('#eligibility-future').textContent='';}
 form.addEventListener('input',render);form.addEventListener('change',render);
 form.querySelector('#eligibility-simulate').addEventListener('click',()=>{
  const value=form.elements.namedItem('futureScore').value;
  if(!form.elements.namedItem('hasTest').checked || value==='' || !Number.isInteger(Number(value)*2)||Number(value)<0||Number(value)>9){
   form.querySelector('#eligibility-future').textContent=t.state.unknown;return;
  }
  const profile=snapshot(),hypothetical=structuredClone(profile.languageTest.value);
  hypothetical.overall=Number(value);
  const compared=simulate(rules,profile,{languageTest:hypothetical});
  form.querySelector('#eligibility-future').textContent=t.hypothetical+': '+t.state[compared.scenario.summary];
 });
 render();
}
