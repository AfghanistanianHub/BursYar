// Progressive journey navigation. Never reads or stores student information.
const copy={
 en:{label:'Demo steps',profile:'1. Review your profile',source:'2. Read a scholarship source',assessment:'3. Assess eligibility',next:'4. Review next steps',note:'The offline assessment uses reviewed rules; sample listings are not verified.',offline:'Start without AI'},
 fa:{label:'مراحل نسخه نمایشی',profile:'۱. بررسی پروفایل',source:'۲. بررسی منبع بورسیه',assessment:'۳. ارزیابی شرایط',next:'۴. بررسی گام‌های بعدی',note:'ارزیابی آفلاین بر پایه قواعد بازبینی‌شده است؛ فهرست نمونه‌ها تأیید رسمی نشده است.',offline:'شروع بدون هوش مصنوعی'},
 ps:{label:'د ازمایښتي نسخې پړاوونه',profile:'۱. خپل پروفایل وګورئ',source:'۲. د بورس سرچینه وګورئ',assessment:'۳. د وړتیا ارزونه',next:'۴. راتلونکي ګامونه',note:'آفلاین ارزونه د بیاکتل شوو قواعدو پر بنسټ ده؛ بېلګې رسمي نه دي تایید شوې.',offline:'له ځیرک ماډل پرته پیل'}
};
export function mountJourney(root,language='en'){
 if(!root)return;
 const t=copy[language]||copy.en;
 const nav=document.createElement('nav');
 nav.className='journey-nav';nav.setAttribute('aria-label',t.label);
 const list=document.createElement('ol');
 for(const [label,id,disclosure] of [[t.profile,'profile-mount','workspace'],[t.source,'assistant',null],[t.assessment,'eligibility-mount',null],[t.next,'next-steps',null]]){
  const li=document.createElement('li'),a=document.createElement('a');a.href='#'+id;a.textContent=label;
  a.addEventListener('click',event=>{
   const target=document.getElementById(id);
   if(!target || target.hidden){event.preventDefault();return;}
   if(disclosure){const details=target.closest('details');if(details)details.open=true;}
   // Do not intercept normal anchor behavior or move sensitive data to URLs.
  });
  li.append(a);list.append(li);
 }
 nav.append(list);
 const offline=document.createElement('button');offline.type='button';offline.className='journey-offline';offline.textContent=t.offline;offline.addEventListener('click',()=>{const panel=document.querySelector('.local-workflow');if(!panel)return;panel.open=true;panel.scrollIntoView({block:'start'});panel.querySelector('summary')?.focus();});nav.append(offline);
 const note=document.createElement('p');note.textContent=t.note;note.className='journey-note';nav.append(note);
 root.replaceChildren(nav);
}
