import {mountWorkspaceOverview} from './workspace-overview.js';
import {mountResearchExplorer} from './research-explorer.js';
import {mountLocalWorkflow} from './local-workflow.js';
import {mountJourney,journeyNavCopy} from './journey-navigation.js';
import {mountProfile} from './profile-form.js';
import {mountAcademicEvidence} from './academic-evidence-form.js';
import {mountDocuments} from './documents.js';
import {mountAnalyzer} from './analyzer.js';
import {mountEligibility} from './eligibility-demo.js';
import {mountAnalysisWorkspace,analysisWorkspaceCopy} from './analysis-workspace.js';
import './fonts.css';
import './style.css';
import './journey-navigation.css';
import './workspace-theme.css';
import './analysis-workspace.css';
import './editorial-design.css';
import './editorial-landing.css';
import './editorial-repair.css';
import './editorial-composition.css';
import './guided-entry.css';
import './trust-explainer.css';
import './storyboard.css';
import './documents-storyboard.css';
import {sampleScholarships,filterScholarships,localizedCountry,localizedLevel} from './catalog.js';
import {journeyCopy} from './journey-copy.js';
import {translations} from './i18n.js';
import {researchScholarships,researchLabel,researchSourceUrl} from './research-catalog.js';
const app=document.querySelector('#app');
const state={language:localStorage.getItem('bursyar-language')||'en',q:'',country:'all',level:'all',selected:null};
if(!translations[state.language])state.language='en';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let analyzerInput={};
function render(){const disclosures=Object.fromEntries(['workspace','resources','scenarios','guided-demo'].map(key=>[key,document.querySelector('.'+key)?.open]));const old=document.querySelector('#analyze-form');if(old)analyzerInput={text:old.querySelector('textarea').value,sourceUrl:old.querySelector('[name=sourceUrl]')?.value||'',analysis:old.analysis,receipt:old.sourceReceipt,sourceApproved:old.sourceApproved,preview:old.sourcePreview,barrierAnswers:old.barrierAnswers,manualMode:old.manualMode,sourceFailure:old.sourceFailure};const t=translations[state.language],rtl=state.language!=='en';document.documentElement.lang=state.language;document.documentElement.dir=rtl?'rtl':'ltr';document.title=`${t.brand} | ${t.missionTitle}`;document.querySelector('meta[name="description"]')?.setAttribute('content',t.description);const fmt=new Intl.NumberFormat(state.language);
const j=journeyCopy[state.language];
const ed={
en:{platform:"Platform",scholarships:"Scholarships",resources:"Resources",about:"About",headline:"Scholarships, clarified.",lead:"Find opportunities, understand what they ask for, and plan your next steps — at your own pace.",explore:"Explore Scholarships",pillars:[["Start with what you have","Review your information and documents when you are ready."],["Understand each requirement","See what is met, not met, or still unknown — without guessing."],["Find your next step","Turn missing evidence and unanswered questions into a practical plan."]],curated:"A place to begin.",selected:"Opportunities to explore",note:"Browse opportunities with source and verification status. Sample data is always identified.",view:"Browse scholarships"},
fa:{platform:"پلتفرم",scholarships:"بورسیه‌ها",resources:"منابع",about:"دربارهٔ ما",headline:"بورسیه‌ها، روشن و قابل‌فهم.",lead:"فرصت‌ها را پیدا کنید، شرایط آن‌ها را بهتر بشناسید و با آرامش برای گام بعدی برنامه بریزید.",explore:"جست‌وجوی بورسیه‌ها",pillars:[["از داشته‌های خود شروع کنید","هر زمان آماده بودید، اطلاعات و مدارک خود را بررسی کنید."],["شرایط را روشن بفهمید","ببینید کدام شرایط برآورده شده، نشده یا هنوز نامشخص است."],["گام بعدی را پیدا کنید","پرسش‌ها و مدارک ناقص را به یک برنامهٔ عملی تبدیل کنید."]],curated:"جایی برای شروع.",selected:"فرصت‌هایی برای بررسی",note:"فرصت‌ها را همراه با وضعیت منبع و صحت‌سنجی بررسی کنید. داده‌های نمونه مشخص شده‌اند.",view:"مشاهدهٔ بورسیه‌ها"},
ps:{platform:"پلېټفارم",scholarships:"بورسونه",resources:"سرچینې",about:"زموږ په اړه",headline:"بورسونه، روښانه او د پوهېدو وړ.",lead:"فرصتونه ومومئ، شرایط یې وپېژنئ او په آرامۍ خپل راتلونکي ګامونه پلان کړئ.",explore:"بورسونه وپلټئ",pillars:[["له شته معلوماتو پیل وکړئ","کله چې چمتو وئ خپل معلومات او اسناد وګورئ."],["هر شرط درک کړئ","وګورئ کوم شرطونه پوره، ناپوره یا لا هم نامعلوم دي."],["راتلونکی ګام ومومئ","ناڅرګندې پوښتنې په عملي پلان بدلې کړئ."]],curated:"د پیل ځای.",selected:"د څېړلو فرصتونه",note:"فرصتونه د سرچینې او تایید له حالت سره وګورئ. بېلګې په ښکاره نښه کېږي.",view:"بورسونه وګورئ"}
}[state.language]||null;
const nav=journeyNavCopy[state.language];
const pathUI={
en:{eyebrow:'PATHFINDER',title:'Your path, mapped.',steps:[['Discover','Find promising opportunities.'],['Document','Collect and review your evidence.'],['Qualify','Check each requirement without guessing.'],['Apply','Use the institution’s official application route.'],['Follow up','Review dates and next actions.']],barrier:'Your next actions',note:'Guidance appears here when an assessment is available. Nothing is marked complete without evidence.'},
fa:{eyebrow:'مسیر‌یاب',title:'مسیر شما، روشن و مشخص.',steps:[['کشف','فرصت‌های مناسب را پیدا کنید.'],['مدارک','شواهد خود را گردآوری و بازبینی کنید.'],['ارزیابی','هر شرط را بدون حدس بررسی کنید.'],['درخواست','از مسیر رسمی مؤسسه درخواست دهید.'],['پیگیری','مهلت‌ها و گام‌های بعدی را بررسی کنید.']],barrier:'گام‌های بعدی شما',note:'پس از ارزیابی، راهنمایی در این بخش نمایش داده می‌شود. هیچ مرحله‌ای بدون مدرک تکمیل‌شده محسوب نمی‌شود.'},
ps:{eyebrow:'لارموندونکی',title:'ستاسې لاره، روښانه.',steps:[['موندل','مناسب فرصتونه ومومئ.'],['اسناد','شواهد راټول او بیاکتنه وکړئ.'],['ارزونه','هر شرط له اټکل پرته وارزوئ.'],['غوښتنلیک','د ادارې رسمي لاره وکاروئ.'],['تعقیب','نېټې او راتلونکي ګامونه وګورئ.']],barrier:'ستاسې راتلونکي ګامونه',note:'تر ارزونې وروسته دلته لارښوونې ښودل کېږي. هېڅ پړاو له شواهدو پرته بشپړ نه ګڼل کېږي.'}
}[state.language]||null;
const welcome={
en:{eyebrow:'START HERE',title:'What would you like to do today?',intro:'Choose one step. You can explore first and return to the others whenever you are ready.',browse:'Find scholarships',browseNote:'Explore research leads and check their official sources. No account needed.',understand:'Understand a scholarship',understandNote:'Bring a public scholarship link. Review the source before any analysis.',prepare:'Prepare my profile',prepareNote:'Sign in when you are ready to save or review your own information.',reassurance:'You are in control. Nothing here submits an application to a university.',demo:'See a guided example (fictional data)',demoNote:'Optional: explore how BursYar connects a source to evidence and next steps.'},
fa:{eyebrow:'از اینجا شروع کنید',title:'امروز می‌خواهید چه کاری انجام دهید؟',intro:'فقط یک مسیر را انتخاب کنید. هر زمان آماده بودید، می‌توانید سراغ بخش‌های دیگر بروید.',browse:'یافتن بورسیه‌ها',browseNote:'فرصت‌های پژوهشی و منابع رسمی آن‌ها را ببینید؛ بدون نیاز به حساب کاربری.',understand:'بررسی یک بورسیه',understandNote:'پیوند عمومی بورسیه را وارد کنید و پیش از تحلیل، منبع را بررسی کنید.',prepare:'آماده‌کردن پروفایل',prepareNote:'وقتی آمادهٔ ذخیره یا بررسی اطلاعات شخصی خود بودید، وارد حساب شوید.',reassurance:'کنترل با شماست. بورس‌یار هیچ درخواستی را مستقیماً به دانشگاه ارسال نمی‌کند.',demo:'مشاهدهٔ نمونهٔ راهنما (اطلاعات فرضی)',demoNote:'اختیاری: ببینید چگونه منبع، شواهد و گام‌های بعدی به هم وصل می‌شوند.'},
ps:{eyebrow:'له دې ځایه پیل کړئ',title:'نن څه کول غواړئ؟',intro:'یوه لاره وټاکئ. هر وخت چې چمتو وئ، نورو برخو ته تلای شئ.',browse:'بورسونه موندل',browseNote:'څېړنیز فرصتونه او رسمي سرچینې یې وګورئ؛ حساب ته اړتیا نشته.',understand:'د بورس پوهېدل',understandNote:'د بورس عامه لینک ورکړئ او تر تحلیل مخکې یې سرچینه وګورئ.',prepare:'خپل پروفایل چمتو کول',prepareNote:'کله چې خپل معلومات ساتل یا کتل غواړئ، حساب ته ننوځئ.',reassurance:'واک ستاسو په لاس کې دی. بورس‌یار پوهنتون ته ستاسو پر ځای غوښتنلیک نه لېږي.',demo:'لارښوود بېلګه وګورئ (فرضی معلومات)',demoNote:'اختیاري: وګورئ چې سرچینه، شواهد او راتلونکي ګامونه څنګه نښلي.'}
}[state.language]||null;
const trustCopy={
 en:{summary:'How can I trust these results?',intro:'BursYar separates what a source says, what a tool interprets, and what you have checked. A badge never means a university has approved an application.',source:'Official source',sourceNote:'A link or quotation from a program provider. Check the live provider page for changes.',ai:'AI interpretation',aiNote:'A suggested reading of source text. It may be wrong and needs your review.',human:'Reviewed by you',humanNote:'You confirmed this information for your own assessment. This does not authenticate a document.',met:'Met',metNote:'The reviewed evidence satisfies the stated requirement.',notMet:'Not met',notMetNote:'The reviewed evidence conflicts with the stated requirement.',unknown:'Unknown',unknownNote:'There is not enough reliable evidence to decide. It is not a rejection.',offline:'When AI is unavailable, the rule-based assessment can still work on reviewed information.'},
 fa:{summary:'چطور می‌توانم به این نتیجه‌ها اعتماد کنم؟',intro:'بورس‌یار متن منبع، تفسیر ابزار و بررسی شما را جدا نشان می‌دهد. هیچ نشانکی به معنی تأیید درخواست از طرف دانشگاه نیست.',source:'منبع رسمی',sourceNote:'پیوند یا نقل‌قول از ارائه‌دهندهٔ بورسیه؛ تغییرات را در صفحهٔ رسمی بررسی کنید.',ai:'تفسیر هوش مصنوعی',aiNote:'برداشت پیشنهادی از متن منبع که ممکن است اشتباه باشد و باید بازبینی شود.',human:'بازبینی‌شده توسط شما',humanNote:'شما اطلاعات را برای ارزیابی خود بررسی کرده‌اید؛ این به معنی تأیید اصالت سند نیست.',met:'برآورده شده',metNote:'شواهد بازبینی‌شده با شرط اعلام‌شده سازگار است.',notMet:'برآورده نشده',notMetNote:'شواهد بازبینی‌شده با شرط اعلام‌شده ناسازگار است.',unknown:'نامشخص',unknownNote:'هنوز شواهد قابل اتکای کافی وجود ندارد؛ این به معنی رد درخواست نیست.',offline:'وقتی AI در دسترس نیست، ارزیابی مبتنی بر قواعد همچنان می‌تواند با اطلاعات بازبینی‌شده کار کند.'},
 ps:{summary:'پر دغو پایلو څنګه باور وکړم؟',intro:'بورس‌یار د سرچینې متن، د وسیلې تفسیر او ستاسو بیاکتنه بېل ښيي. هېڅ نښه د پوهنتون د منلو معنا نه لري.',source:'رسمي سرچینه',sourceNote:'د بورس چمتوکوونکي لینک یا نقل‌قول؛ بدلونونه یې په رسمي پاڼه کې وګورئ.',ai:'د AI تفسیر',aiNote:'د سرچینې د متن وړاندیز شوی تعبیر دی؛ تېروتنه پکې کېدای شي او بیاکتنې ته اړتیا لري.',human:'ستاسو له خوا بیاکتل شوی',humanNote:'تاسو معلومات د خپلې ارزونې لپاره کتلي؛ د سند اصالت نه تاییدوي.',met:'پوره شوی',metNote:'کتل شوي شواهد له ټاکلي شرط سره سمون لري.',notMet:'ناپوره',notMetNote:'کتل شوي شواهد له ټاکلي شرط سره سمون نه لري.',unknown:'نامعلوم',unknownNote:'د پرېکړې لپاره کافي باوري شواهد نشته؛ دا رد نه دی.',offline:'کله چې AI نه وي، د قواعدو ارزونه لا هم په بیاکتل شوو معلوماتو کار کولای شي.'}
}[state.language]||null;
const items=filterScholarships(sampleScholarships,state);
app.innerHTML=`<div class="site"><a class="skip-link" href="#top">${esc(t.skipToContent)}</a><header class="header"><a class="logo" href="#top" aria-label="${esc(t.brand)}"><span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 42 42" width="37" height="37" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M21 34c-6-5-11-5-17-4V11c7-1 12 1 17 5 5-4 10-6 17-5v19c-6-1-11-1-17 4Z"/><path d="M21 16v18M6 33c7-1 11 0 15 3 4-3 8-4 15-3"/><path d="M21 4a7 7 0 0 0-7 7c0 5 7 11 7 11s7-6 7-11a7 7 0 0 0-7-7Z"/><circle cx="21" cy="11" r="2.5"/></svg></span><span>${esc(t.brand)}<small>${esc(t.tag)}</small></span></a><nav class="editorial-nav" aria-label="Main navigation"><a href="#top">${esc(ed.platform)}</a><a href="#research-explorer" data-open=".resources">${esc(ed.scholarships)}</a><a href="#research-explorer" data-open=".resources">${esc(ed.resources)}</a><a href="#about" data-open=".resources">${esc(ed.about)}</a></nav><details class="account"><summary>${esc(j.account)}</summary><div id="account-controls"></div></details><a class="header-start" href="#getting-started">${esc(state.language==='fa'?'شروع':state.language==='ps'?'پیل':'Get started')}</a><label class="language"><span class="sr-only">${esc(t.language)}</span><select id="language" aria-label="${esc(t.language)}"><option value="en" ${state.language==='en'?'selected':''}>English</option><option value="fa" ${state.language==='fa'?'selected':''}>فارسی</option><option value="ps" ${state.language==='ps'?'selected':''}>پښتو</option></select></label></header><main id="top" tabindex="-1"><section class="hero"><div class="hero-copy"><p class="hero-kicker">${esc(j.heroKicker)}</p><h1>${esc(ed.headline)}</h1><div class="editorial-divider"></div><p class="lead">${esc(ed.lead)}</p><div class="hero-actions"><a class="primary-link" href="#research-explorer" data-open=".resources">${esc(ed.explore)} <span aria-hidden="true">↗</span></a><a class="primary-link secondary" href="#profile-mount" data-open=".workspace">${esc(j.profile)}</a></div></div><aside class="hero-visual" aria-label="${esc(j.evidence)}"><figure class="story-hero"><div class="story-character"><img class="editorial-hero-illustration" src="/editorial/hero-student.webp" alt="Student reviewing scholarship documents and opportunities" loading="eager" decoding="async"></div><figcaption class="story-caption">${esc(j.heroCaption)}</figcaption><div class="story-flow-card"><p class="story-flow-kicker">${esc(t.demo)}</p><ol class="story-flow"><li><span class="flow-node">01</span><span>${esc(j.flowSource)}</span></li><li><span class="flow-node">02</span><span>${esc(j.flowAI)}</span></li><li><span class="flow-node">03</span><span>${esc(j.flowEvidence)}</span></li><li><span class="flow-node">04</span><span>${esc(j.storyEligibility)}</span></li><li><span class="flow-node">05</span><span>${esc(j.storyPathfinder)}</span></li><li><span class="flow-node">06</span><span>${esc(j.flowGoal)}</span></li></ol><p class="story-verdicts"><span data-status="met">${esc(j.metWord)}</span><span data-status="not_met">${esc(j.notMetWord)}</span><span data-status="unknown">${esc(j.unknownWord)}</span></p><p class="story-lang" dir="ltr"><span>EN</span> · <span>فارسی</span> · <span>پښتو</span></p><p class="story-note">${esc(j.flowNote)}</p></div></figure></aside></section>
<section class="guided-entry" id="getting-started" aria-labelledby="guided-entry-heading">
 <div class="guided-entry-head"><p class="guided-kicker">${esc(welcome.eyebrow)}</p><h2 id="guided-entry-heading">${esc(welcome.title)}</h2><p>${esc(welcome.intro)}</p></div>
 <div class="guided-entry-options">
  <a href="#research-explorer" data-open=".resources" class="guided-option"><span class="guided-option-icon" aria-hidden="true">⌕</span><strong>${esc(welcome.browse)}</strong><span>${esc(welcome.browseNote)}</span><span class="guided-arrow" aria-hidden="true">↗</span></a>
  <a href="#assistant" class="guided-option"><span class="guided-option-icon" aria-hidden="true">≡</span><strong>${esc(welcome.understand)}</strong><span>${esc(welcome.understandNote)}</span><span class="guided-arrow" aria-hidden="true">↗</span></a>
  <a href="#profile-mount" data-open=".workspace" class="guided-option"><span class="guided-option-icon" aria-hidden="true">▤</span><strong>${esc(welcome.prepare)}</strong><span>${esc(welcome.prepareNote)}</span><span class="guided-arrow" aria-hidden="true">↗</span></a>
 </div>
 <p class="guided-reassurance"><span aria-hidden="true">✓</span> ${esc(welcome.reassurance)}</p>
 <details class="trust-explainer" id="trust-explainer">
 <summary>${esc(trustCopy.summary)}</summary>
 <div class="trust-body">
  <p class="trust-intro">${esc(trustCopy.intro)}</p>
  <div class="trust-columns" role="list">
   ${[[trustCopy.source,trustCopy.sourceNote,'source'],[trustCopy.ai,trustCopy.aiNote,'interpretation'],[trustCopy.human,trustCopy.humanNote,'human']].map(([title,note,kind])=>`<div class="trust-cell" role="listitem"><span class="trust-pill" data-kind="${kind}">${esc(title)}</span><p>${esc(note)}</p></div>`).join('')}
  </div>
  <div class="trust-states" role="list">
    ${[[trustCopy.met,trustCopy.metNote,'met'],[trustCopy.notMet,trustCopy.notMetNote,'not_met'],[trustCopy.unknown,trustCopy.unknownNote,'unknown']].map(([title,note,kind])=>`<div class="trust-state" role="listitem"><span class="trust-verdict" data-status="${kind}">${esc(title)}</span><span>${esc(note)}</span></div>`).join('')}
  </div>
  <p class="trust-offline">${esc(trustCopy.offline)}</p>
 </div>
 </details>
</section>
<nav class="story-index" aria-label="${esc(j.storyIndex)}"><div class="story-index-inner"><span class="story-index-kicker">${esc(j.storyIndex)}</span><ol><li><a href="#documents-mount" data-open=".workspace">${esc(j.storyDocs)}</a></li><li><a href="#assistant">${esc(j.storyEvidence)}</a></li><li><a href="#eligibility-mount">${esc(j.storyEligibility)}</a></li><li><a href="#trust-explainer" data-open="#trust-explainer">${esc(j.storyProvenance)}</a></li><li><a href="#next-steps">${esc(j.storyPathfinder)}</a></li></ol></div></nav>
<section class="editorial-pillars" aria-label="BursYar approach">
${ed.pillars.map((p,i)=>`<article class="editorial-pillar"><div class="editorial-pillar-icon" aria-hidden="true">${['▤','◫','⌁'][i]}</div><h2>${esc(p[0])}</h2><p>${esc(p[1])}</p></article>`).join('')}
</section>
<section class="editorial-selected" id="editorial-selected" aria-labelledby="editorial-selected-heading">
 <div class="editorial-selected-heading">
  <p class="editorial-label">${esc(ed.selected)}</p>
  <h2 id="editorial-selected-heading">${esc(ed.curated)}</h2>
  <p class="editorial-research-disclaimer">${esc(state.language==='fa'?'فرصت‌های پژوهشی؛ شرایط، زمان‌بندی و پذیرش هنوز باید از منبع رسمی دوباره بررسی شوند.':state.language==='ps'?'د څېړنې فرصتونه؛ شرایط، نېټې او د نوم‌لیکنې حالت باید له رسمي سرچینې بیا وکتل شي.':'Research leads, not verified openings. Recheck dates and eligibility at the official source.')}</p>
 </div>
 <div class="editorial-opportunities">
 ${researchScholarships.slice(0,3).map((row,i)=>`<article class="editorial-opportunity">
    <span class="editorial-opportunity-num">${String(i+1).padStart(2,'0')}</span>
    <div class="editorial-opportunity-body">
      <p class="editorial-opportunity-meta">${esc(researchLabel(row.country,state.language))} · ${esc(row.degrees.map(degree=>researchLabel(degree,state.language)).join(' / '))}</p>
      <h3 dir="auto">${esc(row.title)}</h3>
      <p class="editorial-opportunity-provider" dir="auto">${esc(row.provider)}</p>
      <span class="editorial-opportunity-status">${esc(state.language==='fa'?'بررسی منبع رسمی':state.language==='ps'?'رسمي سرچینه وګورئ':'Check official details')}</span>
    </div>
    <a href="${esc(researchSourceUrl(row.sourceUrl)??'#research-explorer')}" ${researchSourceUrl(row.sourceUrl)?'target="_blank" rel="noopener noreferrer"':'data-open=".resources"'} aria-label="${esc(row.title)} — ${esc(state.language==='fa'?'بازکردن منبع برنامه':state.language==='ps'?'د پروګرام سرچینه پرانیزئ':'Open program source')}"><span aria-hidden="true">↗</span></a>
  </article>`).join('')}
 <a class="editorial-browse-all" href="#research-explorer" data-open=".resources">${esc(ed.view)} <span aria-hidden="true">↗</span></a>
 </div>
</section>
<section class="how-it-works" aria-label="${esc(j.howTitle)}"><h2>${esc(j.howTitle)}</h2><ol><li><a href="#profile-mount" data-open=".workspace"><span class="step-num">${fmt.format(1)}</span><strong>${esc(nav.profile)}</strong><span>${esc(j.how1d)}</span></a></li><li><a href="#assistant"><span class="step-num">${fmt.format(2)}</span><strong>${esc(nav.source)}</strong><span>${esc(j.how2d)}</span></a></li><li><a href="#eligibility-mount"><span class="step-num">${fmt.format(3)}</span><strong>${esc(nav.assessment)}</strong><span>${esc(j.how3d)}</span></a></li><li><a href="#next-steps"><span class="step-num">${fmt.format(4)}</span><strong>${esc(nav.next)}</strong><span>${esc(j.how4d)}</span></a></li></ol></section><details class="journey-more"><summary>${esc(state.language==='fa'?'راهنمای مرحله‌به‌مرحلهٔ بیشتر':state.language==='ps'?'نورې ګام په ګام لارښوونې':'More step-by-step guidance')}</summary><div id="journey-nav-mount"></div></details><section class="editorial-study-band" aria-label="${esc(ed.pillars[0][0])}"><div class="editorial-study-copy"><p class="editorial-label">${esc(ed.pillars[0][0])}</p><h2>${esc(ed.pillars[0][1])}</h2><a href="#profile-mount" data-open=".workspace">${esc(j.profile)} <span aria-hidden="true">↗</span></a></div><img src="/editorial/document-student.webp" alt="Student organizing academic records at a desk" loading="lazy" decoding="async"></section><section id="workspace-overview" aria-label="${esc(t.brand)}"></section><details class="guided-demo" id="guided-demo"><summary>${esc(welcome.demo)}</summary><p class="guided-demo-note">${esc(welcome.demoNote)}</p><section id="analysis-workspace" aria-label="${esc((analysisWorkspaceCopy[state.language]??analysisWorkspaceCopy.en).title)}"></section></details><section class="assistant" id="assistant" aria-labelledby="assistant-heading"><h2 id="assistant-heading">${esc(welcome.understand)}</h2><p class="assistant-copy">${esc(welcome.understandNote)}</p><form id="analyze-form"><div id="source-entry"></div><div id="source-text" hidden><label for="requirements">${esc(t.inputLabel)}</label><textarea id="requirements" minlength="30" maxlength="12000" placeholder="${esc(t.inputPlaceholder)}" required rows="7" dir="auto"></textarea></div><div id="analysis-consent" hidden><button type="submit" class="primary-link">${esc(t.translate)}</button></div><section id="requirements-step" hidden><h2 tabindex="-1">${fmt.format(2)} · ${esc(j.requirements)}</h2><div role="status" id="analysis-result" class="status" hidden></div><a class="next-link" href="#eligibility-mount">${esc(j.eligibility)}</a></section></form></section><div id="local-workflow-mount"></div><div id="eligibility-mount"></div><details class="workspace"><summary>${esc(j.profile)}</summary><div id="profile-mount"></div><div id="academic-evidence-mount"></div><div id="documents-mount"></div></details><section class="pathfinder-dashboard" aria-labelledby="pathfinder-dashboard-title">
 <div class="pathfinder-intro">
  <p class="pathfinder-eyebrow">${esc(pathUI.eyebrow)}</p>
  <h2 id="pathfinder-dashboard-title">${esc(pathUI.title)}</h2>
  <p class="pathfinder-note">${esc(pathUI.note)}</p>
  <ol class="pathfinder-timeline">
  ${pathUI.steps.map((step,i)=>`<li><a href="${['#research-explorer','#documents-mount','#eligibility-mount','#research-explorer','#next-steps'][i]}" ${[0,1,3].includes(i)?`data-open="${i===1?'.workspace':'.resources'}"`:''}><span class="pathfinder-index">${fmt.format(i+1)}</span><span class="pathfinder-step-copy"><strong>${esc(step[0])}</strong><small>${esc(step[1])}</small></span><span class="pathfinder-step-arrow" aria-hidden="true">↗</span></a></li>`).join('')}
  </ol>
 </div>
 <div class="pathfinder-live"><p class="pathfinder-eyebrow">${esc(pathUI.barrier)}</p><section id="next-steps"><h2>${fmt.format(4)} · ${esc(j.next)}</h2><div id="next-actions"><p class="empty-note">${esc(j.nextEmpty)} <a href="#assistant">${esc(j.nextEmptyCta)}</a></p></div><p>${esc(j.nextNote)}</p></section></div></section><details class="resources"><summary>${esc(j.resources)}</summary><div id="research-explorer-mount"></div><section id="explore" class="section"><div class="section-top"><div><p class="eyebrow">BURS YAR / 01</p><h2>${esc(t.scholarships)}</h2></div><span class="sample-note">${esc(t.demo)}</span></div><div class="filters"><label><span class="sr-only">${esc(t.search)}</span><input id="search" type="search" value="${esc(state.q)}" placeholder="${esc(t.search)}" autocomplete="off"></label><label><span class="sr-only">${esc(t.country)}</span><select id="country"><option value="all">${esc(t.allCountries)}</option>${['Canada','Germany','Japan'].map(x=>`<option value="${x}" ${state.country===x?'selected':''}>${esc(localizedCountry(x,state.language))}</option>`).join('')}</select></label><label><span class="sr-only">${esc(t.degree)}</span><select id="level"><option value="all">${esc(t.allLevels)}</option>${['Undergraduate','Masters','PhD'].map(x=>`<option value="${x}" ${state.level===x?'selected':''}>${esc(localizedLevel(x,state.language))}</option>`).join('')}</select></label></div><p class="count" role="status">${esc(t.results)}: ${fmt.format(items.length)}</p>${items.length?'':`<p class="empty-note">${esc(t.noResults)}</p>`}<div class="listing">${items.map(x=>`<article class="scholarship"><p class="small-caps">${esc(localizedCountry(x.country,state.language))} · ${esc(localizedLevel(x.level,state.language))}</p><h3>${esc(t.demoTitle)} — ${esc(localizedCountry(x.country,state.language))}</h3><p class="muted">${esc(t.sourceMissing)}</p><div class="card-bottom"><span class="pill">${esc(t.unverified)}</span><button class="detail-button" data-id="${esc(x.id)}">${esc(t.details)} <span aria-hidden="true">↗</span></button></div></article>`).join('')}</div><div id="detail" aria-live="polite">${state.selected?`<section class="detail" tabindex="-1"><h3>${esc(t.demoTitle)} · ${esc(localizedCountry(state.selected.country,state.language))}</h3><p>${esc(t.demo)}</p><p>${esc(t.deadline)}: ${esc(t.none)}</p><p>${esc(t.sourceMissing)}</p><button id="close-detail" type="button" aria-label="${esc(t.close)}">×</button></section>`:''}</div></section><section class="section about" id="about"><p class="eyebrow">BURS YAR / 03</p><h2>${esc(t.missionTitle)}</h2><p>${esc(t.missionCopy)}</p></section></details></main><footer><span>${esc(t.brand)} © 2026</span><span>${esc(t.footnote)}</span></footer></div>`;
document.querySelector('#language').addEventListener('change',e=>{state.language=e.target.value;localStorage.setItem('bursyar-language',state.language);render();document.querySelector('#language').focus()});
document.querySelector('#search').addEventListener('input',e=>{state.q=e.target.value;const p=e.target.selectionStart;render();const el=document.querySelector('#search');el.focus();el.setSelectionRange(p,p)});
for(const id of ['country','level'])document.querySelector('#'+id).addEventListener('change',e=>{state[id]=e.target.value;state.selected=null;render()});
document.querySelectorAll('[data-id]').forEach(el=>el.addEventListener('click',()=>{state.selected=sampleScholarships.find(x=>x.id===el.dataset.id);render();document.querySelector('#detail .detail')?.focus()}));
document.querySelector('#close-detail')?.addEventListener('click',()=>{state.selected=null;render()});
document.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',()=>{const panel=document.querySelector(el.dataset.open);if(panel)panel.open=true;}));
mountWorkspaceOverview(document.querySelector('#workspace-overview'),state.language);
mountAnalysisWorkspace(document.querySelector('#analysis-workspace'),state.language);
mountResearchExplorer(document.querySelector('#research-explorer-mount'),state.language);
mountJourney(document.querySelector('#journey-nav-mount'),state.language);
mountAnalyzer(document.querySelector('#analyze-form'),state.language,esc,analyzerInput);
mountLocalWorkflow(document.querySelector('#local-workflow-mount'),state.language);
mountProfile(document.querySelector('#profile-mount'),state.language);
mountAcademicEvidence(document.querySelector('#academic-evidence-mount'),state.language);
mountDocuments(document.querySelector('#documents-mount'),state.language);
mountEligibility(document.querySelector('#eligibility-mount'),state.language,document.querySelector('#analyze-form')?.analysis?.data?.compilation);
for(const [key,open]of Object.entries(disclosures))if(open!==undefined&&document.querySelector('.'+key))document.querySelector('.'+key).open=open;
}
// Only a localized action message is propagated; never broadcast private profile data.
function paintNextEmpty(){const actions=document.querySelector('#next-actions');if(!actions)return;const t=journeyCopy[state.language];actions.innerHTML=`<p class="empty-note">${esc(t.nextEmpty)} <a href="#assistant">${esc(t.nextEmptyCta)}</a></p>`;}
document.addEventListener('bursyar:local-next',event=>{
 const actions=document.querySelector('#next-actions');
 if(!actions)return;
 actions.replaceChildren();
 if(typeof event.detail==='string'&&event.detail){
  const p=document.createElement('p');p.textContent=event.detail;actions.append(p);
 }else{
  paintNextEmpty();
 }
});
document.addEventListener('bursyar:compilation',event=>{mountEligibility(document.querySelector('#eligibility-mount'),state.language,event.detail);queueMicrotask(()=>{const active=!!event.detail;document.querySelector('#requirements-step').hidden=!active&&document.querySelector('#analysis-result').hidden;if(!active)paintNextEmpty();if(active){const result=document.querySelector('#analysis-result');const fields=result.querySelector('fieldset'),guidance=result.querySelector('#barrier-guidance');if(fields)document.querySelector('#next-actions').replaceChildren(fields,guidance);}});});
render();
