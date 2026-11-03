// Progressive journey navigation. Never reads or stores student information.
// fa/ps strings are UNREVIEWED pending fluent human review (see docs/TRANSLATION-REVIEW.json).
export const journeyNavCopy={
 en:{label:'Demo steps',profile:'Review your profile',source:'Read a scholarship source',assessment:'Assess eligibility',next:'Review next steps',note:'The offline assessment uses reviewed rules; sample listings are not verified.',offline:'Start without AI'},
 fa:{label:'مراحل نسخه نمایشی',profile:'بررسی پروفایل',source:'بررسی منبع بورسیه',assessment:'ارزیابی شرایط',next:'بررسی گام‌های بعدی',note:'ارزیابی آفلاین بر پایه قواعد بازبینی‌شده است؛ فهرست نمونه‌ها تأیید رسمی نشده است.',offline:'شروع بدون هوش مصنوعی'},
 ps:{label:'د ازمایښتي نسخې پړاوونه',profile:'خپل پروفایل وګورئ',source:'د بورس سرچینه وګورئ',assessment:'د وړتوب ارزونه',next:'راتلونکي ګامونه',note:'آفلاین ارزونه د بیاکتل شوو قواعدو پر بنسټ ده؛ بېلګې رسمي نه دي تایید شوې.',offline:'له ځیرک ماډل پرته پیل'}
};
export function mountJourney(root,language='en'){
 if(!root)return;
 const t=journeyNavCopy[language]||journeyNavCopy.en;
 const nav=document.createElement('nav');
 nav.className='journey-nav';nav.setAttribute('aria-label',t.label);
 const list=document.createElement('ol');
 const links=[];
 for(const [label,id,disclosure] of [[t.profile,'profile-mount','workspace'],[t.source,'assistant',null],[t.assessment,'eligibility-mount',null],[t.next,'next-steps',null]]){
  const li=document.createElement('li'),a=document.createElement('a');a.href='#'+id;a.textContent=label;
  a.addEventListener('click',event=>{
   const target=document.getElementById(id);
   if(!target || target.hidden){event.preventDefault();return;}
   if(disclosure){const details=target.closest('details');if(details)details.open=true;}
   // Do not intercept normal anchor behavior or move sensitive data to URLs.
  });
  li.append(a);list.append(li);
  links.push([a,id]);
 }
 if(typeof IntersectionObserver!=='undefined'){
  const byId=new Map(links.map(([a,id])=>[id,a]));
  const spy=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    const current=byId.get(entry.target.id);
    if(!current)continue;
    for(const [a] of links)a.removeAttribute('aria-current');
    current.setAttribute('aria-current','true');
   }
  },{rootMargin:'-25% 0px -65% 0px'});
  for(const [,id] of links){const section=document.getElementById(id);if(section)spy.observe(section);}
 }
 nav.append(list);
 const offline=document.createElement('button');offline.type='button';offline.className='journey-offline';offline.textContent=t.offline;offline.addEventListener('click',()=>{const panel=document.querySelector('.local-workflow');if(!panel)return;for(const [a] of links)a.removeAttribute('aria-current');panel.open=true;panel.scrollIntoView({block:'start'});panel.querySelector('summary')?.focus();});nav.append(offline);
 const note=document.createElement('p');note.textContent=t.note;note.className='journey-note';nav.append(note);
 root.replaceChildren(nav);
}
