import {dashboardCopy} from './dashboard-copy.js';
import {openPendingDocument} from './documents.js';
import {researchScholarships, researchSourceUrl} from './research-catalog.js';
import {getSavedResearchIds} from './research-explorer.js';

const paths = {
 home: 'M3 10l9-7 9 7v10h-6v-6H9v6H3z',
 documents: 'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6',
 saved: 'M6 4h12v17l-6-4-6 4z',
 assessments: 'M20 11v9H4V4h11m-7 8 3 3 10-10',
 book: 'M12 6C8 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-6-1-10 2v15',
 account: 'M5 20v-2a7 7 0 0 1 14 0v2M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0'
};
const icon = name => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none"
 stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]}"/></svg>`;
const illustration = `<svg class="dashboard-illustration" aria-hidden="true" viewBox="0 0 216 150" fill="none"
 stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
 <path d="M29 12h95l28 28v69a9 9 0 0 1-9 9H29a9 9 0 0 1-9-9V21a9 9 0 0 1 9-9Z"/>
 <path d="M124 12v19a9 9 0 0 0 9 9h19M37 32h55M37 45h42M37 62h96v40H37zm0 13h96m-96 14h96m-29-27v40"/>
 <path d="M46 69h42m-42 13h29m-29 13h36" stroke="#a5b995" stroke-width="4"/>
 <circle cx="148" cy="97" r="25" fill="#fdfbf8"/>
 <path d="m167 115 22 22a4 4 0 0 0 6-6l-22-22M136 91h24m-24 8h18m-18 8h12"/>
 </svg>`;

const routes = {home:'#dashboard', documents:'#dashboard/documents',
 saved:'#dashboard/saved', assessments:'#dashboard/assessments'};
const toolsByRoute = {
 documents:['#documents-mount','#profile-mount','#academic-evidence-mount'],
 assessments:['#assistant','#local-workflow-mount','#eligibility-mount','#next-steps']
};
export const isDashboardRoute = hash => Object.values(routes).includes(hash);

export function mountStudentDashboard(root, {language, brand, languageLabel, skipLabel, getStatus}) {
 const t = dashboardCopy[language] ?? dashboardCopy.en;
 const site = root.previousElementSibling;
 const accountControls = site.querySelector('#account-controls');
 const originalAccount = accountControls.parentElement;
 const originalLanguage = site.querySelector('#language');
 const number = new Intl.NumberFormat(language);
 const count = (value, forms) => `${number.format(value)} ${forms[value === 1 ? 0 : 1]}`;
 const navigation = Object.entries(routes).map(([key,href]) => `
  <a class="dashboard-nav-link" href="${href}">${icon(key)}
   <span class="dashboard-nav-full">${t[key]}</span>
   <span class="dashboard-nav-short">${t['mobile'+key[0].toUpperCase()+key.slice(1)]}</span>
  </a>`).join('');
 root.innerHTML = `
  <a class="skip-link" href="#dashboard-title">${skipLabel}</a>
  <header class="dashboard-header">
   <a class="dashboard-brand" href="#top" aria-label="${t.website}">${icon('book')}<span></span></a>
   <div class="dashboard-header-actions">
    <select id="dashboard-language" aria-label="${languageLabel}"></select>
    <details class="account dashboard-account"><summary aria-label="${t.account}">${icon('account')}</summary></details>
   </div>
  </header>
  <div class="dashboard-layout">
   <nav class="dashboard-nav" aria-label="${t.home}">${navigation}</nav>
   <main class="dashboard-main">
    <h1 id="dashboard-title" tabindex="-1"></h1>
    <div class="dashboard-panel"></div>
   </main>
  </div>`;
 root.querySelector('.dashboard-brand span').textContent = brand;
 const account = root.querySelector('.dashboard-account');
 const picker = root.querySelector('#dashboard-language');
 picker.append(...Array.from(originalLanguage.options, option => option.cloneNode(true)));
 picker.value = language;
 picker.addEventListener('change', () => {
  originalLanguage.value = picker.value;
  originalLanguage.dispatchEvent(new Event('change'));
 });
 const panel = root.querySelector('.dashboard-panel');
 const title = root.querySelector('h1');
 const parked = new Map();
 let view;
 let reviewRequested = false;
 function restoreTools() {
  for (const [node, placeholder] of parked) placeholder.replaceWith(node);
  parked.clear();
 }
 function attachTools() {
  for (const selector of toolsByRoute[view] ?? []) {
   const node = site.querySelector(selector);
   const placeholder = document.createComment('Dashboard tool');
   node.replaceWith(placeholder);
   parked.set(node, placeholder);
   panel.append(node);
  }
  if (view === 'assessments') panel.querySelector('.local-workflow').open = true;
 }
 function renderHome() {
  const {documents, assessment} = getStatus();
  const saved = getSavedResearchIds().length;
  const documentStatus = documents === undefined ? t.loadingDocuments :
   documents === null ? t.unavailableDocuments :
   documents.pending ? count(documents.pending,t.documentReview) :
   documents.total ? count(documents.total,t.documentCount) : t.noDocuments;
  let next = {title:t.openDocuments, action:t.openDocuments, route:'documents'};
  if (documents?.pending) next = {title:t.review, action:t.reviewAction, route:'documents', review:true};
  else if (documents?.total === 0) next = {title:t.add, action:t.add, route:'documents'};
  else if (assessment) next = {title:t.assessmentLink, action:t.openAssessments, route:'assessments'};
  else if (documents?.total) next = {title:t.assess, action:t.openAssessments, route:'assessments'};
  panel.innerHTML = `<section class="dashboard-next" aria-labelledby="dashboard-next-title">
   <div class="dashboard-next-copy">
    <p class="dashboard-next-label">${t.next}</p>
    <h2 id="dashboard-next-title">${next.title}</h2>
    <a class="dashboard-action" href="${routes[next.route]}" ${next.review ? 'data-dashboard-review' : ''}>${next.action}</a>
   </div>${illustration}</section>
   <div class="dashboard-shortcuts">
    ${[['documents',documentStatus],['saved',saved ? count(saved,t.savedCount) : t.noSaved],
      ['assessments',assessment ? t.assessmentReady : t.noAssessment]].map(([key,status]) =>
     `<a href="${routes[key]}" class="dashboard-shortcut">${icon(key)}<span>${status}</span></a>`).join('')}
   </div>`;
 }
 function renderSaved() {
  const saved = new Set(getSavedResearchIds());
  const rows = researchScholarships.filter(row => saved.has(row.id));
  const note = document.createElement('p');
  note.textContent = t.savedNote;
  const browse = document.createElement('a');
  browse.className = 'dashboard-action';
  browse.href = '#research-explorer';
  browse.textContent = t.browse;
  const list = document.createElement(rows.length ? 'ul' : 'p');
  if (!rows.length) list.textContent = t.noSaved;
  else {
   list.className = 'dashboard-saved-list';
   for (const row of rows) {
    const item = document.createElement('li');
    const source = researchSourceUrl(row.sourceUrl);
    const label = document.createElement(source ? 'a' : 'span');
    label.dir = 'auto';
    label.textContent = row.title;
    if (source) {
     label.href = source;
     label.target = '_blank';
     label.rel = 'noopener noreferrer';
    } else label.append(` · ${t.noSource}`);
    item.append(label);
    list.append(item);
   }
  }
  panel.replaceChildren(list,note,browse);
 }
 function sync(signedIn, focus = false) {
  const next = signedIn && Object.keys(routes).find(key => routes[key] === location.hash);
  site.querySelector('#dashboard-entry').hidden = !signedIn;
  if (view === next) return;
  const wasOpen = !!view;
  restoreTools();
  view = next;
  root.hidden = !view;
  site.hidden = !!view;
  panel.replaceChildren();
  if (!view) {
   originalAccount.append(accountControls);
   if (wasOpen) {
    const target = document.getElementById(location.hash.slice(1)) ?? site.querySelector('#top');
    const disclosure = target.closest('details');
    if (disclosure) disclosure.open = true;
    target.tabIndex = -1;
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'start'});
   }
   return;
  }
  account.append(accountControls);
  title.textContent = view === 'home' ? t.title : t[view];
  for (const link of root.querySelectorAll('.dashboard-nav-link')) {
   if (link.hash === routes[view]) link.setAttribute('aria-current','page');
   else link.removeAttribute('aria-current');
  }
  if (view === 'home') renderHome();
  else if (view === 'saved') renderSaved();
  else attachTools();
  if (focus) {
   title.focus({preventScroll:true});
   window.scrollTo(0,0);
  }
  if (view === 'documents' && reviewRequested) openPendingDocument(panel.querySelector('#documents-mount'));
  reviewRequested = false;
 }
 root.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a');
  if (!link) return;
  if (link.hasAttribute('data-dashboard-review')) reviewRequested = true;
  if (link.hash === '#dashboard-title' || (view === 'assessments' && link.hash === '#eligibility-mount')) {
   event.preventDefault();
   const target = root.querySelector(link.hash);
   target.tabIndex = -1;
   target.focus();
  }
 });
 return {sync, update() {
  if (view === 'home') {
   const focused = panel.contains(document.activeElement) ? document.activeElement : null;
   const index = [...panel.querySelectorAll('a')].indexOf(focused);
   renderHome();
   if (index >= 0) panel.querySelectorAll('a')[index]?.focus({preventScroll:true});
  } else if (view === 'saved') renderSaved();
 }};
}
