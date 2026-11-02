// Layout adapted from the approved MagicPath workspace; all actions use the
// production panels. No synthetic profile facts, progress counts or AI results.
const copy={
 en:{label:'Your scholarship workspace',title:'From possibility to a plan.',intro:'Discover an opportunity. Review the evidence. Choose your next step.',profile:'Start with your evidence',profileNote:'Add documents or enter your profile, then review each fact before saving.',profileAction:'Review profile & documents',source:'Understand a scholarship',sourceNote:'Bring an official source. Review its content before preparing an analysis.',sourceAction:'Add a scholarship source',discover:'Explore opportunities',local:'Use local assessment',note:'Research leads need re-verification. Local assessment remains available when AI is unavailable.'},
 fa:{label:'فضای کاری بورسیهٔ شما',title:'از فرصت تا برنامهٔ عملی.',intro:'فرصت را بیابید، شواهد را بررسی کنید و گام بعدی را انتخاب کنید.',profile:'از شواهد خود آغاز کنید',profileNote:'اسناد را اضافه کنید یا پروفایل را دستی بنویسید؛ هر مورد را پیش از ذخیره بررسی کنید.',profileAction:'بررسی پروفایل و اسناد',source:'شرایط بورسیه را بشناسید',sourceNote:'منبع رسمی را وارد کنید و محتوای آن را پیش از آماده‌سازی تحلیل بررسی کنید.',sourceAction:'افزودن منبع بورسیه',discover:'یافتن فرصت‌ها',local:'ارزیابی محلی',note:'سرنخ‌های پژوهشی نیازمند بررسی مجددند. در نبود هوش مصنوعی، ارزیابی محلی در دسترس است.'},
 ps:{label:'ستاسو د بورس کاري ځای',title:'له فرصت څخه تر عملي پلان پورې.',intro:'فرصت ومومئ، شواهد وګورئ او راتلونکی ګام وټاکئ.',profile:'له خپلو شواهدو پیل وکړئ',profileNote:'اسناد زیات کړئ یا پروفایل ولیکئ؛ تر خوندي کولو مخکې هر معلومات وګورئ.',profileAction:'پروفایل او اسناد وګورئ',source:'د بورس شرایط وپېژنئ',sourceNote:'رسمي سرچینه راوړئ او تر تحلیل مخکې یې منځپانګه وګورئ.',sourceAction:'د بورس سرچینه زیاتول',discover:'فرصتونه ولټوئ',local:'محلي ارزونه',note:'څېړنیزې نښې بیا تایید ته اړتیا لري. که AI نه وي، محلي ارزونه شته.'}
};
export function mountWorkspaceOverview(root,language='en'){
 if(!root)return;const t=copy[language]??copy.en;
 const label=document.createElement('p');label.className='workspace-kicker';label.textContent=t.label;
 const title=document.createElement('h2');title.textContent=t.title;
 const intro=document.createElement('p');intro.className='workspace-intro';intro.textContent=t.intro;
 const grid=document.createElement('div');grid.className='workspace-overview-grid';
 for(const [icon,heading,note,action,target,disclosure] of [
 ['01',t.profile,t.profileNote,t.profileAction,'profile-mount','workspace'],
 ['02',t.source,t.sourceNote,t.sourceAction,'source-url',null]
 ]){
  const panel=document.createElement('section');panel.className='workspace-start-card';
  const number=document.createElement('span');number.className='workspace-card-number';number.textContent=icon;number.setAttribute('aria-hidden','true');
  const h=document.createElement('h3');h.textContent=heading;
  const p=document.createElement('p');p.textContent=note;
  const a=document.createElement('a');a.href='#'+target;a.textContent=action+' ↗';
  a.addEventListener('click',()=>{if(disclosure)document.querySelector('details.'+disclosure).open=true;const el=document.getElementById(target);if(el){if(!el.matches('input'))el.setAttribute('tabindex','-1');el.focus({preventScroll:true});}});
  panel.append(number,h,p,a);grid.append(panel);
 }
 const links=document.createElement('div');links.className='workspace-shortcuts';
 for(const [text,id,selector] of [[t.discover,'research-explorer','.resources'],[t.local,'local-assessment','.local-workflow']]){
  const a=document.createElement('a');a.href='#'+id;a.textContent=text+' ↗';
  a.addEventListener('click',()=>{const panel=document.querySelector(selector);if(panel)panel.open=true;});links.append(a);
 }
 const note=document.createElement('p');note.className='workspace-overview-note';note.textContent=t.note;
 root.replaceChildren(label,title,intro,grid,links,note);
}
