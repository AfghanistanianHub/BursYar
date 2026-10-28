import {getInferenceToken} from './auth.js';
const copy={
 en:{fetch:'Fetch scholarship page',loading:'Retrieving public page…',manual:'Manual text fallback',review:'Review the extracted source below. Web content and linked pages are unverified; course-specific conditions may remain unresolved.',approve:'I reviewed this source and approve sending this text for AI analysis.',error:'This page could not be retrieved safely. It may be blocked, too large, or unsupported. Use the manual text fallback.',auth:'Sign in with an approved demo account before fetching.',busy:'Retrieval limit reached. Wait a minute and try again.',status:'Retrieved',original:'Requested URL',digest:'Extracted text SHA-256',links:'Same-site links to review manually (not fetched)',changed:'Source changed. Review and approve it again.',translation:'Dari and Pashto translations await fluent human review.'},
 fa:{fetch:'دریافت صفحهٔ بورسیه',loading:'در حال دریافت صفحهٔ عمومی…',manual:'ورود دستی متن',review:'متن استخراج‌شده را بررسی کنید. محتوای وب و پیوندها تأیید نشده‌اند؛ شرایط خاص دوره ممکن است نامشخص بمانند.',approve:'این منبع را بررسی کردم و ارسال این متن برای تحلیل هوش مصنوعی را می‌پذیرم.',error:'دریافت امن این صفحه ممکن نشد. شاید مسدود، بسیار بزرگ یا پشتیبانی‌نشده باشد. از ورود دستی استفاده کنید.',auth:'پیش از دریافت، با حساب مجاز دمو وارد شوید.',busy:'حد دریافت تکمیل شده است. یک دقیقه منتظر بمانید.',status:'دریافت شد',original:'نشانی درخواستی',digest:'شناسهٔ SHA-256 متن استخراج‌شده',links:'پیوندهای همین وبگاه برای بررسی دستی (دریافت نشده‌اند)',changed:'منبع تغییر کرد. دوباره بررسی و تأیید کنید.',translation:'ترجمه‌های دری و پشتو در انتظار بازبینی فرد مسلط هستند.'},
 ps:{fetch:'د بورس پاڼه ترلاسه کړئ',loading:'عامه پاڼه ترلاسه کېږي…',manual:'متن په لاس ولیکئ',review:'لاندې راایستل شوی متن وګورئ. د وېب منځپانګه او تړوني نه دي تایید شوي؛ د دورې ځانګړي شرطونه ښايي نامعلوم پاتې شي.',approve:'ما دا سرچینه وکتله او د دې متن د ځیرکتیا تحلیل ته لېږل منم.',error:'دا پاڼه په خوندي ډول ترلاسه نه شوه. ښايي بنده، ډېره لویه یا نه ملاتړ کېدونکې وي. متن په لاس ولیکئ.',auth:'تر ترلاسه کولو مخکې د ډیمو له مجاز حساب سره ننوځئ.',busy:'د ترلاسه کولو حد پوره شوی. یوه دقیقه تم شئ.',status:'ترلاسه شوه',original:'غوښتل شوې پته',digest:'د راایستل شوي متن SHA-256 پېژند',links:'د همدې وېبپاڼې تړوني د لاسي کتنې لپاره (نه دي ترلاسه شوي)',changed:'سرچینه بدله شوه. بیا یې وګورئ او تایید کړئ.',translation:'د دري او پښتو ژباړې د روان ویونکي بیاکتنې ته منتظرې دي.'}
};
export function mountSourcePreview(form,url,textarea,submit,language,initial={}){
 const t=copy[language]??copy.en;
 const failures={en:{blocked:'This address is blocked by public-page security checks. Use an official public HTTPS page.',timeout:'The website did not respond in time. Try later or enter source text manually.',large:'This page exceeds the safe preview limit. Use a shorter official requirements page or manual text.',unsupported:'Only public UTF-8 HTML or text pages are supported. Use manual text for this source.',empty:'No readable article content was found. Use the manual text fallback.'},fa:{blocked:'این نشانی در بررسی امنیتی صفحهٔ عمومی مسدود شد. از صفحهٔ عمومی رسمی HTTPS استفاده کنید.',timeout:'وبگاه به‌موقع پاسخ نداد. بعداً تلاش کنید یا متن را دستی وارد کنید.',large:'این صفحه از حد امن پیش‌نمایش بزرگ‌تر است. از صفحهٔ کوتاه‌تر شرایط رسمی یا متن دستی استفاده کنید.',unsupported:'فقط صفحات عمومی HTML یا متن UTF-8 پشتیبانی می‌شوند. از متن دستی استفاده کنید.',empty:'محتوای خواندنی مقاله یافت نشد. از ورود دستی متن استفاده کنید.'},ps:{blocked:'دا پته د عامه پاڼې امنیتي کتنې بنده کړه. رسمي عامه HTTPS پاڼه وکاروئ.',timeout:'وېبپاڼې پر وخت ځواب ورنه کړ. وروسته هڅه وکړئ یا متن په لاس ولیکئ.',large:'دا پاڼه د خوندي مخکتنې تر حده لویه ده. د رسمي شرطونو لنډه پاڼه یا لاسي متن وکاروئ.',unsupported:'یوازې عامه UTF-8 HTML یا متني پاڼې ملاتړ کېږي. لاسي متن وکاروئ.',empty:'د لوستلو وړ مقاله ونه موندل شوه. متن په لاس ولیکئ.'}}[language]??{};
 const failure=code=>/blocked|connection_denied/.test(code??'')?failures.blocked:code==='timeout'?failures.timeout:/too_large/.test(code??'')?failures.large:/unsupported/.test(code??'')?failures.unsupported:code==='empty_content'?failures.empty:t.error;
 const fetchButton=document.createElement('button');fetchButton.type='button';fetchButton.id='fetch-source';fetchButton.textContent=t.fetch;
 const manual=document.createElement('button');manual.type='button';manual.textContent=t.manual;manual.id='manual-source';
 const status=document.createElement('p');status.setAttribute('role','status');
 const preview=document.createElement('div');preview.className='source-preview';preview.hidden=true;
 const label=document.createElement('label'),approval=document.createElement('input');approval.type='checkbox';approval.id='source-approved';label.append(approval,document.createTextNode(t.approve));
 const warning=document.createElement('p');warning.textContent=t.translation;
 url.parentElement.after(fetchButton,manual,status,preview,label,warning);
 let controller;
 form.sourceReceipt=initial.receipt??null;approval.checked=initial.sourceApproved===true;
 const sync=()=>{form.sourceApproved=approval.checked;submit.disabled=!approval.checked;};
 approval.addEventListener('change',sync);
 const invalidate=()=>{form.dispatchEvent(new Event('bursyar:sourcechanged'));controller?.abort();approval.checked=false;form.sourceReceipt=null;form.sourcePreview=null;preview.hidden=true;sync();};
 url.addEventListener('input',()=>{if(form.sourceReceipt){textarea.value='';textarea.readOnly=false;}invalidate();});textarea.addEventListener('input',()=>{invalidate();status.textContent=t.changed;});
 manual.addEventListener('click',()=>{invalidate();textarea.readOnly=false;textarea.focus();});
 function render(data){preview.replaceChildren();preview.hidden=false;
  const note=document.createElement('p');note.textContent=t.review;preview.append(note);
  for(const [key,value]of [[t.status,data.receipt.retrievedAt],[t.original,data.receipt.requestedUrl],[t.digest,data.receipt.digest]]){const p=document.createElement('p');p.className='source-digest';p.textContent=`${key}: ${value}`;p.dir='auto';preview.append(p);}
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=t.links;details.append(summary);
  for(const href of data.links){const p=document.createElement('p'),a=document.createElement('a');a.href=href;a.textContent=href;a.dir='ltr';a.target='_blank';a.rel='noopener noreferrer';p.append(a);details.append(p);}preview.append(details);
 }
 fetchButton.addEventListener('click',async()=>{
  invalidate();const current=controller=new AbortController();fetchButton.disabled=true;status.textContent=t.loading;
  try{const token=await getInferenceToken();const response=await fetch('/api/source',{method:'POST',credentials:'omit',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({url:url.value}),signal:AbortSignal.any([current.signal,AbortSignal.timeout(15000)])});if(!response.ok){const problem=await response.json().catch(()=>({}));throw Object.assign(Error(),{status:response.status,code:problem.code});}const data=await response.json();if(current.signal.aborted||!form.isConnected)return;
   textarea.value=data.text;textarea.readOnly=true;url.value=data.receipt.sourceUrl;form.sourceReceipt=data.receipt;form.sourcePreview=data;render(data);status.textContent=t.review;
  }catch(error){if(!current.signal.aborted&&form.isConnected)status.textContent=error.status===401?t.auth:error.status===429?t.busy:failure(error.code);}
  finally{if(controller===current)fetchButton.disabled=false;}
 });
 if(initial.preview){form.sourcePreview=initial.preview;render(initial.preview);textarea.readOnly=!!form.sourceReceipt;}
 document.addEventListener('bursyar:identity',()=>{invalidate();preview.hidden=true;form.sourcePreview=null;});
 sync();return ()=>approval.checked;
}
