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
import {sampleScholarships,filterScholarships,localizedCountry,localizedLevel} from './catalog.js';
import {journeyCopy} from './journey-copy.js';
import {translations} from './i18n.js';
import {researchScholarships,researchLabel} from './research-catalog.js';
const app=document.querySelector('#app');
const state={language:localStorage.getItem('bursyar-language')||'en',q:'',country:'all',level:'all',selected:null};
if(!translations[state.language])state.language='en';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let analyzerInput={};
function render(){const disclosures=Object.fromEntries(['workspace','resources','scenarios'].map(key=>[key,document.querySelector('.'+key)?.open]));const old=document.querySelector('#analyze-form');if(old)analyzerInput={text:old.querySelector('textarea').value,sourceUrl:old.querySelector('[name=sourceUrl]')?.value||'',analysis:old.analysis,receipt:old.sourceReceipt,sourceApproved:old.sourceApproved,preview:old.sourcePreview,barrierAnswers:old.barrierAnswers,manualMode:old.manualMode,sourceFailure:old.sourceFailure};const t=translations[state.language],rtl=state.language!=='en';document.documentElement.lang=state.language;document.documentElement.dir=rtl?'rtl':'ltr';document.title=`${t.brand} | ${t.missionTitle}`;document.querySelector('meta[name="description"]')?.setAttribute('content',t.description);const fmt=new Intl.NumberFormat(state.language);
const j=journeyCopy[state.language];
const ed={
en:{platform:"Platform",scholarships:"Scholarships",resources:"Resources",about:"About",headline:"Scholarships, clarified.",lead:"BursYar is a document-first platform that helps students discover, evaluate, and pursue funding with clarity and purpose.",explore:"Explore Scholarships",pillars:[["Document-first","Begin with documents you can inspect, correct and understand."],["Three-valued","Requirements are marked met, not met, or unknown — never guessed."],["PathFinder","A personal roadmap from barriers to concrete next steps."]],curated:"Curated. Compared. Understood.",selected:"Selected scholarships",note:"Browse opportunities with source and verification status. Sample data is always identified.",view:"Browse scholarships"},
fa:{platform:"پلتفرم",scholarships:"بورسیه‌ها",resources:"منابع",about:"دربارهٔ ما",headline:"بورسیه‌ها، روشن و قابل‌فهم.",lead:"بورس‌یار کمک می‌کند فرصت‌های تحصیلی را با تکیه بر مدارک، شواهد و راهنمایی روشن بررسی کنید.",explore:"جست‌وجوی بورسیه‌ها",pillars:[["مدارک در اولویت","با مدارکی شروع کنید که می‌توانید بررسی و اصلاح کنید."],["ارزیابی سه‌حالته","شرایط به‌صورت واجد، فاقد یا نامشخص ارزیابی می‌شوند؛ نه بر پایهٔ حدس."],["مسیر‌یاب","از موانع تا گام‌های عملی، مسیر مشخص داشته باشید."]],curated:"گزینش. مقایسه. شناخت.",selected:"فرصت‌های تحصیلی",note:"فرصت‌ها را همراه با وضعیت منبع و صحت‌سنجی بررسی کنید. داده‌های نمونه مشخص شده‌اند.",view:"مشاهدهٔ بورسیه‌ها"},
ps:{platform:"پلېټفارم",scholarships:"بورسونه",resources:"سرچینې",about:"زموږ په اړه",headline:"بورسونه، روښانه او د پوهېدو وړ.",lead:"بورس‌یار له محصلانو سره مرسته کوي چې د اسنادو او شواهدو پر بنسټ د زده‌کړو فرصتونه وڅېړي.",explore:"بورسونه وپلټئ",pillars:[["اسناد لومړی","له هغو اسنادو پیل وکړئ چې تاسو یې کتلی او سمولای شئ."],["درې‌حالته ارزونه","شرایط پوره، ناپوره یا نامعلوم ښودل کېږي؛ له اټکل پرته."],["لارموندونکی","له خنډونو تر عملي راتلونکو ګامونو پورې روښانه لاره."]],curated:"غوراوی. پرتله. پوهاوی.",selected:"ټاکل شوي فرصتونه",note:"فرصتونه د سرچینې او تایید له حالت سره وګورئ. بېلګې په ښکاره نښه کېږي.",view:"بورسونه وګورئ"}
}[state.language]||null;
const nav=journeyNavCopy[state.language];
const pathUI={
en:{eyebrow:'PATHFINDER',title:'Your path, mapped.',steps:[['Discover','Find promising opportunities.'],['Document','Collect and review your evidence.'],['Qualify','Check each requirement without guessing.'],['Apply','Use the institution’s official application route.'],['Follow up','Review dates and next actions.']],barrier:'Your next actions',note:'Guidance appears here when an assessment is available. Nothing is marked complete without evidence.'},
fa:{eyebrow:'مسیر‌یاب',title:'مسیر شما، روشن و مشخص.',steps:[['کشف','فرصت‌های مناسب را پیدا کنید.'],['مدارک','شواهد خود را گردآوری و بازبینی کنید.'],['ارزیابی','هر شرط را بدون حدس بررسی کنید.'],['درخواست','از مسیر رسمی مؤسسه درخواست دهید.'],['پیگیری','مهلت‌ها و گام‌های بعدی را بررسی کنید.']],barrier:'گام‌های بعدی شما',note:'پس از ارزیابی، راهنمایی در این بخش نمایش داده می‌شود. هیچ مرحله‌ای بدون مدرک تکمیل‌شده محسوب نمی‌شود.'},
ps:{eyebrow:'لارموندونکی',title:'ستاسې لاره، روښانه.',steps:[['موندل','مناسب فرصتونه ومومئ.'],['اسناد','شواهد راټول او بیاکتنه وکړئ.'],['ارزونه','هر شرط له اټکل پرته وارزوئ.'],['غوښتنلیک','د ادارې رسمي لاره وکاروئ.'],['تعقیب','نېټې او راتلونکي ګامونه وګورئ.']],barrier:'ستاسې راتلونکي ګامونه',note:'تر ارزونې وروسته دلته لارښوونې ښودل کېږي. هېڅ پړاو له شواهدو پرته بشپړ نه ګڼل کېږي.'}
}[state.language]||null;
const items=filterScholarships(sampleScholarships,state);
app.innerHTML=`<div class="site"><a class="skip-link" href="#top">${esc(t.skipToContent)}</a><header class="header"><a class="logo" href="#top" aria-label="${esc(t.brand)}"><span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 42 42" width="37" height="37" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"><path d="M21 34c-6-5-11-5-17-4V11c7-1 12 1 17 5 5-4 10-6 17-5v19c-6-1-11-1-17 4Z"/><path d="M21 16v18M6 33c7-1 11 0 15 3 4-3 8-4 15-3"/><path d="M21 4a7 7 0 0 0-7 7c0 5 7 11 7 11s7-6 7-11a7 7 0 0 0-7-7Z"/><circle cx="21" cy="11" r="2.5"/></svg></span><span>${esc(t.brand)}<small>${esc(t.tag)}</small></span></a><nav class="editorial-nav" aria-label="Main navigation"><a href="#top">${esc(ed.platform)}</a><a href="#editorial-selected">${esc(ed.scholarships)}</a><a href="#research-explorer" data-open=".resources">${esc(ed.resources)}</a><a href="#about" data-open=".resources">${esc(ed.about)}</a></nav><details class="account"><summary>${esc(j.account)}</summary><div id="account-controls"></div></details><a class="header-start" href="#profile-mount" data-open=".workspace">${esc(state.language==='fa'?'شروع':state.language==='ps'?'پیل':'Get started')}</a><label class="language"><span class="sr-only">${esc(t.language)}</span><select id="language" aria-label="${esc(t.language)}"><option value="en" ${state.language==='en'?'selected':''}>English</option><option value="fa" ${state.language==='fa'?'selected':''}>فارسی</option><option value="ps" ${state.language==='ps'?'selected':''}>پښتو</option></select></label></header><main id="top" tabindex="-1"><section class="hero"><div class="hero-copy"><p class="hero-kicker">${esc(j.heroKicker)}</p><h1>${esc(ed.headline)}</h1><div class="editorial-divider"></div><p class="lead">${esc(ed.lead)}</p><div class="hero-actions"><a class="primary-link" href="#research-explorer" data-open=".resources">${esc(ed.explore)} <span aria-hidden="true">↗</span></a><a class="primary-link secondary" href="#profile-mount" data-open=".workspace">${esc(j.profile)}</a></div></div><aside class="hero-visual" aria-label="${esc(j.evidence)}"><img class="editorial-hero-illustration" src="/editorial/hero-student.webp" alt="Student reviewing scholarship documents and opportunities" loading="eager" decoding="async"><div class="evidence-preview"><p class="preview-tag">${esc(t.demo)}</p><ol class="chain"><li><span class="chain-icon" data-icon="quote" aria-hidden="true"></span><div><strong>${esc(j.evidence)}</strong><q dir="auto">${esc(j.heroQuote)}</q></div><span class="chain-mark" data-mark="check" aria-hidden="true"></span></li><li><span class="chain-icon" data-icon="shield" aria-hidden="true"></span><div><strong>${esc(j.requirements)}</strong><span class="chain-sub">${esc(j.facts)}</span></div><span class="chain-mark" data-mark="check" aria-hidden="true"></span></li><li><span class="chain-icon" data-icon="chart" aria-hidden="true"></span><div><strong>${esc(j.eligibility)}</strong><span class="chain-verdicts"><span data-status="met">${esc(j.metWord)}</span><span data-status="not_met">${esc(j.notMetWord)}</span><span data-status="unknown">${esc(j.unknownWord)}</span></span></div></li></ol></div></aside></section>
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
      <span class="editorial-opportunity-status">${esc(state.language==='fa'?'نیازمند بازبینی':state.language==='ps'?'بیاکتنې ته اړتیا لري':'Needs re-verification')}</span>
    </div>
    <a href="#research-explorer" data-open=".resources" aria-label="${esc(row.title)} — ${esc(ed.view)}"><span aria-hidden="true">↗</span></a>
  </article>`).join('')}
 <a class="editorial-browse-all" href="#research-explorer" data-open=".resources">${esc(ed.view)} <span aria-hidden="true">↗</span></a>
 </div>
</section>
<section class="how-it-works" aria-label="${esc(j.howTitle)}"><h2>${esc(j.howTitle)}</h2><ol><li><a href="#profile-mount" data-open=".workspace"><span class="step-num">${fmt.format(1)}</span><strong>${esc(nav.profile)}</strong><span>${esc(j.how1d)}</span></a></li><li><a href="#assistant"><span class="step-num">${fmt.format(2)}</span><strong>${esc(nav.source)}</strong><span>${esc(j.how2d)}</span></a></li><li><a href="#eligibility-mount"><span class="step-num">${fmt.format(3)}</span><strong>${esc(nav.assessment)}</strong><span>${esc(j.how3d)}</span></a></li><li><a href="#next-steps"><span class="step-num">${fmt.format(4)}</span><strong>${esc(nav.next)}</strong><span>${esc(j.how4d)}</span></a></li></ol></section><div id="journey-nav-mount"></div><section class="editorial-study-band" aria-label="${esc(ed.pillars[0][0])}"><div class="editorial-study-copy"><p class="editorial-label">${esc(ed.pillars[0][0])}</p><h2>${esc(ed.pillars[0][1])}</h2><a href="#profile-mount" data-open=".workspace">${esc(j.profile)} <span aria-hidden="true">↗</span></a></div><img src="/editorial/document-student.webp" alt="Student organizing academic records at a desk" loading="lazy" decoding="async"></section><section id="workspace-overview" aria-label="${esc(t.brand)}"></section><section id="analysis-workspace" aria-label="${esc((analysisWorkspaceCopy[state.language]??analysisWorkspaceCopy.en).title)}"></section><section class="assistant" id="assistant" aria-labelledby="assistant-heading"><h2 id="assistant-heading">${esc(t.assistant)}</h2><p class="assistant-copy">${esc(t.assistantCopy)}</p><form id="analyze-form"><div id="source-entry"></div><div id="source-text" hidden><label for="requirements">${esc(t.inputLabel)}</label><textarea id="requirements" minlength="30" maxlength="12000" placeholder="${esc(t.inputPlaceholder)}" required rows="7" dir="auto"></textarea></div><div id="analysis-consent" hidden><button type="submit" class="primary-link">${esc(t.translate)}</button></div><section id="requirements-step" hidden><h2 tabindex="-1">${fmt.format(2)} · ${esc(j.requirements)}</h2><div role="status" id="analysis-result" class="status" hidden></div><a class="next-link" href="#eligibility-mount">${esc(j.eligibility)}</a></section></form></section><div id="local-workflow-mount"></div><div id="eligibility-mount"></div><details class="workspace"><summary>${esc(j.profile)}</summary><div id="profile-mount"></div><div id="academic-evidence-mount"></div><div id="documents-mount"></div></details><section class="editorial-pathfinder-image" aria-label="${esc(ed.pillars[2][0])}"><img src="/editorial/collaboration-students.webp" alt="Students reviewing information together" loading="lazy" decoding="async"><p>${esc(ed.pillars[2][0])}</p></section><section class="pathfinder-dashboard" aria-labelledby="pathfinder-dashboard-title">
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
