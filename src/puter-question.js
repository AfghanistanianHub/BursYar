// Optional, user-paid Puter assistant. Never uploads BursYar documents, profiles or source text.
export const PUTER_SCRIPT_URL='https://js.puter.com/v2/';
export const PUTER_MODEL='gpt-6-luna';
const labels={
 en:{title:'Optional AI question (Puter)',hint:'Uses your own Puter account and its available free allowance. After that, Puter may charge you. Do not enter personal details, documents or private records.',placeholder:'Ask a general question about scholarships',button:'Ask with Puter',busy:'Waiting for Puter…',failed:'Puter is unavailable. No BursYar analysis was changed.',consent:'I agree to send this question to Puter and understand that my Puter account covers usage.',result:'AI response — unverified; check official scholarship sources.'},
 fa:{title:'پرسش اختیاری از هوش مصنوعی (Puter)',hint:'از حساب Puter و سهمیهٔ رایگان موجود آن استفاده می‌شود. پس از پایان سهمیه ممکن است هزینه داشته باشد. اطلاعات شخصی، مدارک یا سوابق خصوصی وارد نکنید.',placeholder:'یک سؤال عمومی دربارهٔ بورسیه بپرسید',button:'پرسش از Puter',busy:'در انتظار پاسخ Puter…',failed:'Puter در دسترس نیست. تحلیل بورس‌یار تغییر نکرد.',consent:'موافقم این سؤال به Puter ارسال شود و می‌دانم هزینهٔ استفاده بر عهدهٔ حساب Puter من است.',result:'پاسخ هوش مصنوعی تأیید نشده است؛ منابع رسمی را بررسی کنید.'},
 ps:{title:'اختیاري AI پوښتنه (Puter)',hint:'ستاسې د Puter حساب او شته وړيا سهميه کاروي؛ وروسته ښايي لګښت ولري. شخصي معلومات او اسناد مه ورکوئ.',placeholder:'د بورسونو په اړه عمومي پوښتنه وکړئ',button:'له Puter وپوښتئ',busy:'د Puter ځواب ته انتظار…',failed:'Puter نشته؛ د BursYar ارزونه نه ده بدله شوې.',consent:'زه منم چې دا پوښتنه Puter ته ولېږل شي او د کارونې لګښت زما د Puter حساب دی.',result:'د AI ځواب نه دی تایید شوی؛ رسمي سرچينې وګورئ.'}
};
let scriptPromise;
export function loadPuter({doc=document}={}){
 if(globalThis.puter?.ai?.chat)return Promise.resolve(globalThis.puter);
 if(!scriptPromise)scriptPromise=new Promise((resolve,reject)=>{
  const script=doc.createElement('script');script.src=PUTER_SCRIPT_URL;script.async=true;
  script.onload=()=>globalThis.puter?.ai?.chat?resolve(globalThis.puter):reject(Error('Puter API unavailable'));
  script.onerror=()=>reject(Error('Puter script unavailable'));
  doc.head.append(script);
 }).catch(error=>{scriptPromise=null;throw error;});
 return scriptPromise;
}
export function mountPuterQuestion(root,language='en',{load=loadPuter}={}){
 if(!root)return;
 const t=labels[language]??labels.en;
 const section=document.createElement('section');section.className='puter-question';
 const heading=document.createElement('h3');heading.textContent=t.title;
 const hint=document.createElement('p');hint.textContent=t.hint;
 const question=document.createElement('textarea');question.rows=2;question.maxLength=1500;question.placeholder=t.placeholder;question.setAttribute('aria-label',t.placeholder);
 const consent=document.createElement('label');const check=document.createElement('input');check.type='checkbox';consent.append(check,document.createTextNode(' '+t.consent));
 const button=document.createElement('button');button.type='button';button.textContent=t.button;
 const status=document.createElement('p');status.setAttribute('role','status');
 const output=document.createElement('p');output.dir='auto';
 section.append(heading,hint,question,consent,button,status,output);root.append(section);
 button.addEventListener('click',async()=>{
  if(!check.checked||!question.value.trim()||question.value.length>1500)return;
  button.disabled=true;output.textContent='';status.textContent=t.busy;
  try{
   const api=await load();
   const response=await api.ai.chat(question.value,{model:PUTER_MODEL,max_tokens:600});
   const text=typeof response==='string'?response:response?.message?.content??response?.text;
   if(typeof text!=='string'||!text.trim())throw Error('Empty Puter response');
   status.textContent=t.result;output.textContent=text.slice(0,10000);
  }catch{status.textContent=t.failed;}finally{button.disabled=false;}
 });
 return section;
}
