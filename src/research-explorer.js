import {researchScholarships,researchCountries,filterResearch,researchLabel,researchDeadlineState,researchSourceUrl,loadResearchSaved,saveResearchIds,exportResearchSaved} from './research-catalog.js';
import {researchCopy} from './research-copy.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Discovery state contains no profile or document data. Keep it across shell
// language rerenders without remounting any analysis/auth workflows on search.
const state={q:'',country:'all',degree:'all',funding:'all',noFee:false,noIelts:false,hidePast:false,savedOnly:false};
let saved=null;
let storageFailed=false;
const storage=()=>{try{return globalThis.localStorage;}catch{return null;}};
export function mountResearchExplorer(root,language='en') {
 if(!root)return;
 const lang=researchCopy[language]?language:'en';const t=researchCopy[lang];
 if(saved===null)saved=loadResearchSaved(storage());
 const number=new Intl.NumberFormat(lang);
 const countries=researchCountries();
 function render(focusId=null,selection=null){
  const rows=filterResearch(researchScholarships,state).filter(row=>!state.savedOnly||saved.includes(row.id));
  root.innerHTML=`<section id="research-explorer" class="section" aria-labelledby="research-title">
   <h2 id="research-title">${esc(t.title)}</h2><p class="research-notice">${esc(t.notice)}</p>
   <div class="filters research-filters"><label for="research-search">${esc(t.search)}<input id="research-search" type="search" value="${esc(state.q)}" autocomplete="off"></label>
   <label for="research-country">${esc(t.country)}<select id="research-country"><option value="all">${esc(t.allCountries)}</option>${countries.map(country=>`<option value="${esc(country)}" ${country===state.country?'selected':''}>${esc(researchLabel(country,lang))}</option>`).join('')}</select></label>
   <label for="research-degree">${esc(t.degree)}<select id="research-degree"><option value="all">${esc(t.allDegrees)}</option>${['bachelor','master','phd'].map(degree=>`<option value="${degree}" ${degree===state.degree?'selected':''}>${esc(researchLabel(degree,lang))}</option>`).join('')}</select></label><label for="research-funding">${esc(t.funding)}<select id="research-funding"><option value="all">${esc(t.allFunding)}</option>${[['full','fullFunding'],['partial','partialFunding'],['unknown','unknownFunding']].map(([value,label])=>`<option value="${value}" ${state.funding===value?'selected':''}>${esc(t[label])}</option>`).join('')}</select></label></div>
   <div class="research-toggles">${[['no-fee','noFee'],['no-ielts','noIelts'],['hide-past','hidePast'],['saved-only','savedOnly']].map(([id,key])=>`<label><input id="research-${id}" type="checkbox" ${state[key]?'checked':''}> ${esc(t[key])}</label>`).join('')}</div>
   <p class="muted">${esc(t.filtersNote)}</p><p>${esc(t.storageNote)}</p>
   <div class="research-actions"><button id="research-export" type="button" ${saved.length?'':'disabled'}>${esc(t.export)}</button><button id="research-clear" type="button" ${saved.length?'':'disabled'}>${esc(t.clear)}</button></div>
   <p role="status">${storageFailed?esc(t.storageError):''}</p><p role="status">${esc(t.count)}: ${number.format(rows.length)} · ${esc(t.savedCount)}: ${number.format(saved.length)}</p>
   <div class="listing">${rows.map(row=>{
    const source=researchSourceUrl(row.sourceUrl);const deadlineState=researchDeadlineState(row);
    return `<article class="scholarship"><p>${esc(researchLabel(row.country,lang))} · ${row.degrees.map(d=>esc(researchLabel(d,lang))).join(' / ')}</p><h3 lang="en" dir="ltr">${esc(row.title)}</h3><p lang="en" dir="ltr">${esc(row.provider)}</p><p class="pill">${esc(t.needsReview)}</p><p>${esc(t[row.funding==='full'?'fullFunding':row.funding==='partial'?'partialFunding':'unknownFunding'])}</p><p>${esc(t.checked)}: <bdi>${esc(row.lastCheckedAt??t.unknown)}</bdi></p><p>${esc(t.deadline)}: <bdi>${esc(row.deadline??t.unknown)}</bdi> · ${esc(t[deadlineState==='past'?'past':deadlineState==='unknown'?'unknown':'unconfirmed'])}</p><div class="card-bottom">${source?`<a href="${esc(source)}" target="_blank" rel="noopener noreferrer">${esc(t.source)}</a>`:''}${source?`<button type="button" data-research-prepare="${esc(row.id)}">${esc(t.prepare)}</button>`:''}<button type="button" data-research-save="${esc(row.id)}" aria-pressed="${saved.includes(row.id)}">${esc(saved.includes(row.id)?t.remove:t.save)}</button></div></article>`;
   }).join('')}</div>${rows.length?'':`<p class="empty-note">${esc(t.empty)}</p>`}</section>`;
  root.querySelector('#research-search').addEventListener('input',event=>{state.q=event.target.value;render('research-search',event.target.selectionStart);});
  for(const key of ['country','degree','funding'])root.querySelector('#research-'+key).addEventListener('change',event=>{state[key]=event.target.value;render('research-'+key);});
  for(const [id,key] of [['no-fee','noFee'],['no-ielts','noIelts'],['hide-past','hidePast'],['saved-only','savedOnly']])root.querySelector('#research-'+id).addEventListener('change',event=>{state[key]=event.target.checked;render('research-'+id);});
  root.querySelectorAll('[data-research-save]').forEach(button=>button.addEventListener('click',()=>{
   const id=button.dataset.researchSave;saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];
   storageFailed=!saveResearchIds(storage(),saved);render();
   (root.querySelector(`[data-research-save="${id}"]`)??root.querySelector('#research-saved-only')).focus();
  }));
  root.querySelectorAll('[data-research-prepare]').forEach(button=>button.addEventListener('click',()=>{
   const row=researchScholarships.find(item=>item.id===button.dataset.researchPrepare);
   const url=researchSourceUrl(row?.sourceUrl);const input=document.querySelector('#source-url');
   if(!url||!input)return;
   input.value=url;input.dispatchEvent(new Event('input',{bubbles:true}));
   document.querySelector('#assistant')?.scrollIntoView({block:'start'});input.focus({preventScroll:true});
  }));
  root.querySelector('#research-clear').addEventListener('click',()=>{saved=[];storageFailed=!saveResearchIds(storage(),saved);render('research-saved-only');});
  root.querySelector('#research-export').addEventListener('click',()=>{
   const blob=new Blob([JSON.stringify(exportResearchSaved(saved),null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='bursyar-public-references.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  if(focusId){const input=root.querySelector('#'+focusId);input?.focus();if(selection!==null)input?.setSelectionRange(selection,selection);}
 }
 render();
}
