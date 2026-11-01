import {journeyCopy} from './journey-copy.js';
import {recoveryCopy} from './recovery-copy.js';
import {getInferenceToken} from './auth.js';
const copy={
 en:{fetch:'Fetch scholarship page',loading:'Retrieving public page…',manual:'Manual text fallback',review:'Review the extracted source below. Web content and linked pages are unverified; course-specific conditions may remain unresolved.',approve:'I reviewed this source and approve sending this text for AI analysis.',error:'This page could not be retrieved safely. It may be blocked, too large, or unsupported. Use the manual text fallback.',auth:'Sign in with an approved demo account before fetching.',busy:'Retrieval limit reached. Wait a minute and try again.',status:'Retrieved',original:'Requested URL',digest:'Extracted text SHA-256',links:'Same-site links to review manually (not fetched)',changed:'Source changed. Review and approve it again.',translation:'Dari and Pashto translations await fluent human review.'},
 fa:{fetch:'دریافت صفحهٔ بورسیه',loading:'در حال دریافت صفحهٔ عمومی…',manual:'ورود دستی متن',review:'متن استخراج‌شده را بررسی کنید. محتوای وب و پیوندها تأیید نشده‌اند؛ شرایط خاص دوره ممکن است نامشخص بمانند.',approve:'این منبع را بررسی کردم و ارسال این متن برای تحلیل هوش مصنوعی را می‌پذیرم.',error:'دریافت امن این صفحه ممکن نشد. شاید مسدود، بسیار بزرگ یا پشتیبانی‌نشده باشد. از ورود دستی استفاده کنید.',auth:'پیش از دریافت، با حساب مجاز دمو وارد شوید.',busy:'حد دریافت تکمیل شده است. یک دقیقه منتظر بمانید.',status:'دریافت شد',original:'نشانی درخواستی',digest:'شناسهٔ SHA-256 متن استخراج‌شده',links:'پیوندهای همین وبگاه برای بررسی دستی (دریافت نشده‌اند)',changed:'منبع تغییر کرد. دوباره بررسی و تأیید کنید.',translation:'ترجمه‌های دری و پشتو در انتظار بازبینی فرد مسلط هستند.'},
 ps:{fetch:'د بورس پاڼه ترلاسه کړئ',loading:'عامه پاڼه ترلاسه کېږي…',manual:'متن په لاس ولیکئ',review:'لاندې راایستل شوی متن وګورئ. د وېب منځپانګه او تړوني نه دي تایید شوي؛ د دورې ځانګړي شرطونه ښايي نامعلوم پاتې شي.',approve:'ما دا سرچینه وکتله او د دې متن د ځیرکتیا تحلیل ته لېږل منم.',error:'دا پاڼه په خوندي ډول ترلاسه نه شوه. ښايي بنده، ډېره لویه یا نه ملاتړ کېدونکې وي. متن په لاس ولیکئ.',auth:'تر ترلاسه کولو مخکې د ډیمو له مجاز حساب سره ننوځئ.',busy:'د ترلاسه کولو حد پوره شوی. یوه دقیقه تم شئ.',status:'ترلاسه شوه',original:'غوښتل شوې پته',digest:'د راایستل شوي متن SHA-256 پېژند',links:'د همدې وېبپاڼې تړوني د لاسي کتنې لپاره (نه دي ترلاسه شوي)',changed:'سرچینه بدله شوه. بیا یې وګورئ او تایید کړئ.',translation:'د دري او پښتو ژباړې د روان ویونکي بیاکتنې ته منتظرې دي.'}
};
export function mountSourcePreview(form,url,textarea,submit,language,initial={}){
 const t=copy[language]??copy.en,r=recoveryCopy[language]??recoveryCopy.en;
 const fetchButton=document.createElement('button');fetchButton.type='button';fetchButton.id='fetch-source';fetchButton.textContent=t.fetch;
 const manual=document.createElement('button');manual.type='button';manual.id='manual-source';manual.textContent=r.paste;
 const status=document.createElement('p');status.setAttribute('role','status');status.id='source-status';
 const preview=document.createElement('div');preview.className='source-preview';preview.hidden=true;
 const options=document.createElement('details');options.id='source-options';options.hidden=true;
 const summary=document.createElement('summary');summary.textContent=r.other;
 const open=document.createElement('a');open.id='open-source';open.textContent=r.open;open.target='_blank';open.rel='noopener noreferrer';
 const fileLabel=document.createElement('label');fileLabel.textContent=r.import;
 const file=document.createElement('input');file.id='source-file';file.type='file';file.accept='.html,.htm,.txt';fileLabel.append(file);
 const privacy=document.createElement('p');privacy.textContent=r.privacy;options.append(summary,open,fileLabel,privacy);
 const label=document.createElement('label'),approval=document.createElement('input');approval.type='checkbox';approval.id='source-approved';label.append(approval,document.createTextNode(t.approve));
 const warning=document.createElement('p');warning.textContent=t.translation;
 url.parentElement.after(fetchButton,manual,status,options,preview);form.querySelector('#analysis-consent').prepend(label,warning);
 let controller,revision=0,busy=false;
 form.sourceReceipt=initial.receipt??null;form.sourcePreview=initial.preview??null;form.manualMode=initial.manualMode===true;form.sourceFailure=initial.sourceFailure??null;approval.checked=initial.sourceApproved===true;
 const safeURL=()=>{try{const u=new URL(url.value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
 const sync=()=>{const hasText=textarea.value.trim().length>0,failed=!!form.sourceFailure;
  form.querySelector('#source-text').hidden=!hasText&&!form.manualMode;form.querySelector('#analysis-consent').hidden=!hasText;
  options.hidden=!failed&&!form.manualMode&&!hasText;const href=safeURL();open.hidden=!href;if(href)open.href=href;else open.removeAttribute('href');
  fetchButton.className=failed||hasText?'text-button':'primary-link';manual.className=failed&&!hasText?'primary-link':'text-button';
  form.sourceApproved=approval.checked;approval.disabled=busy;submit.disabled=busy||!approval.checked;
 };
 const invalidate=()=>{revision++;form.dispatchEvent(new Event('bursyar:sourcechanged'));controller?.abort();approval.checked=false;textarea.readOnly=false;form.sourceReceipt=null;form.sourcePreview=null;preview.hidden=true;sync();};
 const render=data=>{preview.replaceChildren();preview.hidden=false;
  const h=document.createElement('h2');h.textContent='1 · '+journeyCopy[language].overview;
  const host=document.createElement('p');host.textContent=new URL(data.receipt.sourceUrl).hostname;host.dir='ltr';
  const note=document.createElement('p');note.id='source-origin';note.textContent=data.receipt.kind==='server_fetched'?t.review:r.supplied;preview.append(h,host,note);
  const details=document.createElement('details'),title=document.createElement('summary');title.textContent=journeyCopy[language].evidence;details.append(title);
  const supplied=data.receipt.kind!=='server_fetched';
  for(const [key,value]of [[r.origin,supplied?(data.receipt.kind==='user_supplied_html'?r.html:r.text):r.server],[supplied?r.suppliedAt:t.status,data.receipt.retrievedAt??data.receipt.suppliedAt],[t.original,data.receipt.requestedUrl],[t.digest,data.receipt.digest]]){const p=document.createElement('p');p.className='source-digest';p.textContent=`${key}: ${value}`;p.dir='auto';details.append(p);}preview.append(details);
  if(data.links?.length){const links=document.createElement('details'),summary=document.createElement('summary');summary.textContent=t.links;links.append(summary);for(const href of data.links){const p=document.createElement('p'),a=document.createElement('a');a.href=href;a.textContent=href;a.dir='ltr';a.target='_blank';a.rel='noopener noreferrer';p.append(a);links.append(p);}preview.append(links);}
 };
 approval.addEventListener('change',sync);
 url.addEventListener('input',()=>{if(form.sourceReceipt){textarea.value='';textarea.readOnly=false;}form.sourceFailure=null;invalidate();status.textContent='';});
 textarea.addEventListener('input',()=>{invalidate();status.textContent=r.supplied;});
 manual.addEventListener('click',()=>{invalidate();form.manualMode=true;textarea.readOnly=false;sync();status.textContent=r.supplied;textarea.focus();});
 const requestSource=async(path,body)=>{
  invalidate();const current=controller=new AbortController();busy=true;sync();fetchButton.disabled=true;file.disabled=true;status.textContent=t.loading;
  try{const token=await getInferenceToken().catch(()=>{throw Object.assign(Error(),{status:401});});
   const response=await fetch(path,{method:'POST',credentials:'omit',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(body),signal:AbortSignal.any([current.signal,AbortSignal.timeout(15000)])});
   if(!response.ok){const problem=await response.json().catch(()=>({}));throw Object.assign(Error(),{status:response.status,code:problem.code});}
   const data=await response.json();if(current.signal.aborted||!form.isConnected)return;
   approval.checked=false;textarea.value=data.text;textarea.readOnly=true;url.value=data.receipt.sourceUrl;form.sourceReceipt=data.receipt;form.sourcePreview=data;form.sourceFailure=null;render(data);sync();status.textContent=r.review;
  }catch(error){if(!current.signal.aborted&&form.isConnected){form.sourceFailure=error.status===401?'auth':error.status===429?'busy':error.code??'unavailable';status.textContent=error.status===401?t.auth:error.status===429?t.busy:path.endsWith('/import')?r.fileError:error.code==='challenge'?r.blocked:r.unavailable;sync();}}
  finally{if(controller===current){busy=false;fetchButton.disabled=false;file.disabled=false;sync();}}
 };
 fetchButton.addEventListener('click',()=>requestSource('/api/source',{url:url.value}));
 file.addEventListener('change',async()=>{
  const selected=file.files?.[0];if(!selected)return;invalidate();const version=revision;
  const format=/\.html?$/i.test(selected.name)?'html':/\.txt$/i.test(selected.name)?'text':null;
  if(!format||selected.size>256*1024||!selected.size){status.textContent=r.fileError;file.value='';return;}
  const entered=url.value;try{const bytes=new Uint8Array(await selected.arrayBuffer());if(!form.isConnected||entered!==url.value||revision!==version)return;let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
   await requestSource('/api/source/import',{url:entered,format,contentBase64:btoa(binary)});
  }catch{if(form.isConnected)status.textContent=r.fileError;}finally{file.value='';}
 });
 if(initial.preview){render(initial.preview);textarea.readOnly=!!form.sourceReceipt;}else if(form.sourceFailure)status.textContent=form.sourceFailure==='auth'?t.auth:form.sourceFailure==='busy'?t.busy:form.sourceFailure==='challenge'?r.blocked:r.unavailable;
 document.addEventListener('bursyar:identity',()=>{if(!form.isConnected)return;invalidate();form.sourceFailure=null;form.manualMode=false;textarea.value='';sync();status.textContent='';});
 sync();return ()=>!busy&&approval.checked;
}
