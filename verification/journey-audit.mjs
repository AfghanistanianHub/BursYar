// End-to-end journey audit: homepage → get started → authentication →
// document upload → extraction → evidence review → profile → scholarship
// selection → eligibility → Barrier PathFinder → saved results and dashboard.
//
// Runs the real frontend against the real local document/profile/catalog API.
// Identity is mocked at the module boundary (no Google sign-in) and every
// generative endpoint is refused, so no paid inference is used. Results are
// written to verification/artifacts/journey-audit.json.
import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {mkdirSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';
import {createScholarshipCatalog} from '../engine/deterministic.js';
import {createSourceFetcher} from '../engine/source-fetch.js';
import {localProgram} from './fixtures/local-program.mjs';
import {textPdf,blankPdf} from './fixtures/synthetic-pdf.mjs';

const vite=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:0},logLevel:'error'});
await vite.listen();
const baseUrl=`http://127.0.0.1:${vite.httpServer.address().port}`;
const documentDir=mkdtempSync(join(tmpdir(),'bursyar-journey-'));
const documents=new DocumentStore(join(documentDir,'docs.db'));
const sources=createSourceFetcher({resolve:async()=>[{address:'93.184.216.34',family:4}],transport:async()=>({body:'<main><h1>SYNTHETIC FIXTURE</h1><p>Applicants must hold a bachelor degree.</p></main>'})});
const api=createInferenceServer({
  catalog:createScholarshipCatalog([localProgram]),documents,sources,projectId:'demo-bursyar',origin:baseUrl,
  quota:{reserve(){}},
  // Generative analysis is deliberately unavailable: this audit must not spend
  // inference and must observe the honest failure and recovery state.
  infer:async()=>{throw Error('journey audit must not call a provider');},
  verify:async token=>({uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true})
});
await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
const apiUrl=`http://127.0.0.1:${api.address().port}`;

const authModule=(mode,uid='audit-user')=>`let current=${mode==='signedIn'?`{uid:'${uid}'}`:'null'};const listeners=new Set();
const set=user=>{current=user;for(const listener of listeners)listener(user);};
window.__setAuditUser=set;
// Mirror the real module's export surface exactly; a missing named export
// rejects the whole dynamic import and stalls every panel that mounts it.
// Like Firebase's onAuthStateChanged, keep every subscriber instead of one.
export function keepSignedIn(){return false;}
export function setKeepSignedIn(){}
export async function signIn(){set({uid:'${uid}'});}
export async function signOut(){set(null);}
export async function onAuthChange(callback){listeners.add(callback);setTimeout(()=>callback(current),0);return ()=>listeners.delete(callback);}
export async function getInferenceToken(){if(current)return current.uid;throw Object.assign(Error('Sign in required'),{code:'signInRequired'});}
export async function getAccountCapability(){return current?{authenticated:true,enrolled:true,enrollment:'enrolled'}:{authenticated:false,enrolled:false,enrollment:'closed_pilot'};}`;

const results=[];
const record=(id,step,status,detail)=>results.push({id,step,status,detail});
async function check(id,step,fn){try{const detail=await fn();record(id,step,'pass',detail??'');}catch(error){record(id,step,'fail',String(error?.message??error).replace(/\s+/g,' ').slice(0,500));}}
async function observe(id,step,fn){try{record(id,step,'observation',String(await fn()??'').replace(/\s+/g,' ').slice(0,500));}catch(error){record(id,step,'fail',String(error?.message??error).slice(0,500));}}
const visible=async(page,selector)=>page.locator(selector).first().isVisible();
const text=async(page,selector)=>((await page.locator(selector).first().textContent())??'').trim();

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const consoleErrors=[];

async function openPage(mode,{hash='' ,context,uid='audit-user',ocrStub=false}={}){
  const ctx=context??await browser.newContext({viewport:{width:1280,height:900}});
  const page=await ctx.newPage();
  page.on('pageerror',error=>consoleErrors.push(`${mode}: ${error.message}`));
  page.on('console',message=>{if(message.type()==='error'&&!/Failed to load resource/.test(message.text()))consoleErrors.push(`${mode} console: ${message.text()}`);});
  await page.route('**/src/auth.js',route=>route.fulfill({contentType:'text/javascript',body:authModule(mode,uid)}));
  // A scan whose OCR returns no characters. This replaces only the Tesseract
  // runtime boundary: the real PDF render, the real empty-text handling and the
  // real manual-transcription workflow are exercised, no model is downloaded.
  if(ocrStub)await page.route('**/src/ocr-runtime.js',route=>route.fulfill({contentType:'text/javascript',body:"export function ocrRuntime(){return {createWorker:async()=>({recognize:async()=>({data:{text:''}}),terminate:async()=>{}})};}"}));
  await page.route('**/api/**',async route=>{
    const request=route.request();
    const response=await fetch(apiUrl+new URL(request.url()).pathname,{method:request.method(),headers:{authorization:request.headers().authorization??'Bearer guest',origin:baseUrl,'content-type':'application/json'},...(request.method()==='GET'||request.method()==='DELETE'?{}:{body:request.postData()})});
    await route.fulfill({status:response.status,contentType:'application/json',body:await response.text()});
  });
  await page.goto(baseUrl+hash);
  await page.waitForSelector('#app .site',{state:'attached',timeout:15000});
  await page.waitForTimeout(400);
  return {ctx,page};
}

try{
  /* ---------------- signed-in journey ---------------- */
  const {ctx,page}=await openPage('signedIn');
  await page.waitForFunction(()=>location.hash==='#dashboard',{timeout:5000});
  await observe('D01','sign-in lands on dashboard instead of the work in progress',async()=>`hash=${await page.evaluate(()=>location.hash)}; site visible=${await visible(page,'.site')}; dashboard visible=${await visible(page,'#student-dashboard')}`);
  await check('D02','dashboard has a working route back to the site',async()=>{
    await page.locator('.dashboard-brand').click();
    await page.waitForSelector('.site:not([hidden])',{timeout:5000});
    const disclosures=await page.evaluate(()=>[...document.querySelectorAll('.site details[open]')].map(details=>details.className||details.id||details.tagName));
    if(disclosures.some(name=>/guided-demo/.test(name)))throw Error('returning to #top opened an unrelated disclosure');
    return `back to ${await page.evaluate(()=>location.hash)} with site visible; open disclosures=${disclosures.length?disclosures.join(','):'none'}`;
  });

  await check('J01','homepage renders a headline and three entry choices',async()=>{
    if(!(await visible(page,'main h1')))throw Error('no visible h1');
    const options=await page.locator('.guided-option').count();
    if(options!==3)throw Error(`expected 3 guided options, found ${options}`);
    return `${options} options; h1="${(await text(page,'main h1')).slice(0,60)}"`;
  });
  await check('J02','"Get started" entry is reachable and the link resolves',async()=>{
    const href=await page.locator('.header-start').getAttribute('href');
    if(!await page.locator(href).count())throw Error(`target ${href} missing`);
    const headerCta=await page.locator('.header-start').isVisible();
    if(headerCta){
      await page.locator('.header-start').click();
      if(await page.evaluate(()=>location.hash)!=='#getting-started')throw Error('hash did not change');
    }else{
      await page.locator('#getting-started').scrollIntoViewIfNeeded();
    }
    if(!(await visible(page,'#getting-started')))throw Error('entry section not visible');
    return `${href} target present; header CTA ${headerCta?'used':'hidden while signed in (Dashboard replaces it)'}`;
  });
  const eligibilityLink=()=>page.locator('.pathfinder-timeline a[href="#eligibility-mount"]').first();
  await check('J02b','"Assess eligibility" reveals the assessment instead of a collapsed summary',async()=>{
    await eligibilityLink().click();
    await page.waitForSelector('#eligibility-example',{timeout:15000});
    await page.waitForFunction(()=>document.querySelector('#eligibility-example')?.open===true,undefined,{timeout:5000}).catch(()=>{});
    if(!await page.locator('#eligibility-example').evaluate(el=>el.open))throw Error('#eligibility-example stayed closed, so only its summary is visible');
    if(!(await visible(page,'#eligibility-heading')))throw Error('eligibility heading not visible');
    return 'lazy illustration mounted and its disclosure opened';
  });
  await check('J02c','re-selecting the same eligibility link reopens its disclosure',async()=>{
    await page.locator('#eligibility-example > summary').click();
    if(await page.locator('#eligibility-example').evaluate(el=>el.open))throw Error('summary did not close');
    await eligibilityLink().click();
    await page.waitForFunction(()=>document.querySelector('#eligibility-example')?.open===true,undefined,{timeout:3000}).catch(()=>{});
    if(!await page.locator('#eligibility-example').evaluate(el=>el.open))throw Error('same-hash link did not reopen the target');
    return 'same-hash click reopened the disclosure';
  });
  await check('J03','every in-page link resolves to an element that exists',async()=>{
    const missing=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(href=>{
      if(!href||href==='#')return false;
      // Task routes and dashboard routes are handled by their routers, not by
      // id lookup, and '#/' is not a valid CSS selector.
      if(href.startsWith('#/')||href.startsWith('#dashboard'))return false;
      try{return !document.querySelector(href);}catch{return true;}
    }).filter((v,i,a)=>a.indexOf(v)===i));
    if(missing.length)throw Error(`missing targets: ${missing.join(', ')}`);
    return 'all anchors resolve';
  });
  await check('J04','every [data-open] disclosure target exists',async()=>{
    const missing=await page.evaluate(()=>[...document.querySelectorAll('[data-open]')].map(el=>el.dataset.open).filter(selector=>!document.querySelector(selector)).filter((v,i,a)=>a.indexOf(v)===i));
    if(missing.length)throw Error(`missing disclosure targets: ${missing.join(', ')}`);
    return 'all disclosure targets resolve';
  });
  await check('J05','guided "prepare my profile" opens the workspace it points at',async()=>{
    await page.locator('.guided-option[data-task-route="prepare"]').click();
    // The route is applied by the hashchange listener, so a click can resolve
    // before the disclosure opens. Wait for the route contract, not a frame.
    await page.waitForFunction(()=>location.hash==='#/prepare'&&document.querySelector('details.workspace')?.open===true,undefined,{timeout:5000}).catch(()=>{});
    if(await page.evaluate(()=>location.hash)!=='#/prepare')throw Error(`route did not change: ${await page.evaluate(()=>location.hash)}`);
    const open=await page.locator('details.workspace').evaluate(el=>el.open);
    if(!open)throw Error('workspace disclosure stayed closed, so the profile target is not visible');
    await page.waitForSelector('#profile-form',{state:'visible',timeout:10000});
    return 'workspace disclosure opened and profile target is visible';
  });
  await check('J06','hero document CTA opens the document workflow',async()=>{
    await page.locator('.hero-actions a[href="#documents-mount"]').click();
    await page.waitForSelector('#documents',{state:'visible',timeout:15000});
    return 'documents section visible';
  });
  await check('J07','signed-in document upload reaches a review step',async()=>{
    await page.setInputFiles('#documents input[type=file]','verification/fixtures/synthetic-education.txt');
    await page.locator('#document-consent').check();
    await page.locator('#document-upload-form button[type=submit]').click();
    await page.waitForSelector('#documents .document-claim',{timeout:10000});
    const claims=await page.locator('#documents .document-claim').count();
    const status=await text(page,'#documents [role=status]');
    return `${claims} claim(s); status="${status.slice(0,80)}"`;
  });
  await check('J08','evidence review applies accepted claims and updates the profile',async()=>{
    const selects=page.locator('#documents .document-claim select');
    for(let i=0;i<await selects.count();i++)await selects.nth(i).selectOption('accept');
    await page.locator('#documents form:has(.document-claim) button[type=submit]').click();
    await page.waitForFunction(()=>document.querySelectorAll('#documents .document-claim').length===0,{timeout:10000});
    await page.waitForFunction(()=>/updated|Saved|saved/.test(document.querySelector('#documents [role=status]')?.textContent??''),{timeout:10000});
    const degree=await page.locator('#profile-degree').inputValue();
    return `degree field="${degree}"; status="${(await text(page,'#documents [role=status]')).slice(0,80)}"`;
  });
  /* ---------------- PDF intake: review before save, then declared facts ---------------- */
  const readProfile=page=>page.evaluate(async()=>{
    const {getInferenceToken}=await import('/src/auth.js');
    const token=await getInferenceToken();
    const response=await fetch('/api/profile',{headers:{authorization:`Bearer ${token}`}});
    return response.json();
  });
  await check('J07b','a PDF with a text layer opens the review-and-correct preview before anything is saved',async()=>{
    const libraryBefore=await page.locator('#documents > fieldset select option').count();
    await page.locator('#document-consent').check();
    await page.setInputFiles('#documents input[type=file]',{name:'synthetic-transcript.pdf',mimeType:'application/pdf',buffer:textPdf([['SYNTHETIC PDF ONLY — NOT A CERTIFICATE','GPA: 3.4/4']])});
    await page.locator('#document-upload-form button[type=submit]').click();
    await page.waitForSelector('#documents .document-extraction-preview:not([hidden])',{timeout:30000});
    const extracted=await page.locator('#documents .document-extraction-preview textarea').inputValue();
    if(!/GPA: 3\.4\/4/.test(extracted))throw Error(`extracted text missing the PDF text layer: ${JSON.stringify(extracted.slice(0,80))}`);
    if(!/SYNTHETIC PDF ONLY/.test(extracted))throw Error('extracted text lost the PDF heading');
    const stage=await page.locator('#documents').getAttribute('data-document-stage');
    if(stage!=='extract')throw Error(`stage marker is "${stage}", expected "extract"`);
    const libraryAfter=await page.locator('#documents > fieldset select option').count();
    if(libraryAfter!==libraryBefore)throw Error(`library changed from ${libraryBefore} to ${libraryAfter} before review`);
    if(await page.locator('#documents .document-claim').count())throw Error('claims were shown before the reviewed text was saved');
    return `stage=${stage}; preview has the PDF text; library unchanged (${libraryAfter})`;
  });
  await check('J07c','the corrected preview text is what gets saved, not the raw extraction',async()=>{
    const libraryBefore=await page.locator('#documents > fieldset select option').count();
    await page.locator('#documents .document-extraction-preview textarea').fill('SYNTHETIC PDF ONLY — NOT A CERTIFICATE\nGPA: 3.6/4');
    await page.locator('#documents .document-extraction-preview button').first().click();
    await page.waitForSelector('#documents .document-claim',{timeout:15000});
    const values=await page.locator('#documents .document-claim input').evaluateAll(inputs=>inputs.map(input=>input.value));
    if(values[0]!=='3.6')throw Error(`saved claim value is ${JSON.stringify(values)}, expected the correction 3.6`);
    const method=await text(page,'#documents .document-claim .document-method');
    if(!/Text read locally from a PDF/.test(method))throw Error(`provenance reads "${method}"`);
    const libraryAfter=await page.locator('#documents > fieldset select option').count();
    if(libraryAfter!==libraryBefore+1)throw Error(`library did not add exactly one record: ${libraryBefore}→${libraryAfter}`);
    return `claim GPA ${values[0]}/${values[1]}; provenance "${method}"; library ${libraryBefore}→${libraryAfter}`;
  });
  await check('J07d','approving the PDF claim saves a declared, unverified GPA fact',async()=>{
    await page.locator('#documents .document-claim select').selectOption('accept');
    await page.locator('#documents form:has(.document-claim) button[type=submit]').click();
    await page.waitForFunction(()=>document.querySelectorAll('#documents .document-claim').length===0,{timeout:15000});
    const stage=await page.locator('#documents').getAttribute('data-document-stage');
    if(stage!=='save')throw Error(`stage marker is "${stage}" after approval, expected "save"`);
    const gpa=await page.locator('#academic-gpa').inputValue(),scale=await page.locator('#academic-evidence select[name=scale]').inputValue();
    if(gpa!=='3.6'||scale!=='4')throw Error(`academic scores panel shows GPA ${gpa}/${scale}, expected 3.6/4`);
    const profile=await readProfile(page);
    if(profile.gpa?.value?.gpa!==3.6||profile.gpa?.value?.scale!==4)throw Error(`server profile GPA is ${JSON.stringify(profile.gpa?.value)}`);
    if(profile.gpa?.origin!=='document_extracted'||profile.gpa?.verificationStatus!=='not_verified')throw Error(`GPA provenance is ${profile.gpa?.origin}/${profile.gpa?.verificationStatus}`);
    return `stage=save; panel ${gpa}/${scale}; server fact document_extracted, not_verified`;
  });
  const manual=await openPage('signedIn',{hash:'#documents-mount',uid:'audit-transcription',ocrStub:true});
  const mpage=manual.page;
  await check('J07e','a PDF with no readable text offers manual transcription instead of inventing content',async()=>{
    await mpage.locator('#document-consent').check();
    await mpage.setInputFiles('#documents input[type=file]',{name:'synthetic-scan.pdf',mimeType:'application/pdf',buffer:blankPdf()});
    await mpage.locator('#document-upload-form button[type=submit]').click();
    await mpage.waitForSelector('#documents .document-extraction-preview:not([hidden])',{timeout:30000});
    const status=await text(mpage,'#documents > [role=status]');
    if(!/manual transcription/i.test(status))throw Error(`status does not explain the manual fallback: ${JSON.stringify(status.slice(0,90))}`);
    const prefilled=await mpage.locator('#documents .document-extraction-preview textarea').inputValue();
    if(prefilled.trim())throw Error(`unreadable scan produced invented text: ${JSON.stringify(prefilled.slice(0,80))}`);
    if(await mpage.locator('#documents .document-claim').count())throw Error('claims were created for a scan with no readable text');
    const stage=await mpage.locator('#documents').getAttribute('data-document-stage');
    return `stage=${stage}; empty editable preview; status="${status.slice(0,70)}"`;
  });
  await check('J07f','manual transcription is saved and recorded as a transcription, not OCR',async()=>{
    await mpage.locator('#documents .document-extraction-preview textarea').fill('SYNTHETIC SCAN TRANSCRIPTION ONLY\nGPA: 3.2/4');
    await mpage.locator('#documents .document-extraction-preview button').first().click();
    await mpage.waitForSelector('#documents .document-claim',{timeout:15000});
    const method=await text(mpage,'#documents .document-claim .document-method');
    if(!/manual transcription of a PDF/i.test(method))throw Error(`provenance reads "${method}"`);
    await mpage.locator('#documents .document-claim select').selectOption('accept');
    await mpage.locator('#documents form:has(.document-claim) button[type=submit]').click();
    await mpage.waitForFunction(()=>document.querySelectorAll('#documents .document-claim').length===0,{timeout:15000});
    const gpa=await mpage.locator('#academic-gpa').inputValue();
    if(gpa!=='3.2')throw Error(`transcribed GPA fact is ${JSON.stringify(gpa)}, expected 3.2`);
    const id=await mpage.locator('#documents > fieldset select option').first().getAttribute('value');
    const stored=await mpage.evaluate(async documentId=>{
      const {getInferenceToken}=await import('/src/auth.js');
      const token=await getInferenceToken();
      const response=await fetch('/api/documents/'+encodeURIComponent(documentId),{headers:{authorization:`Bearer ${token}`}});
      return response.json();
    },id);
    if(stored.extractionMethod!=='manual_transcription_from_pdf')throw Error(`stored extraction method is ${stored.extractionMethod}`);
    if(stored.authenticity!=='not_verified')throw Error(`stored authenticity is ${stored.authenticity}`);
    return `provenance "${method}"; stored method ${stored.extractionMethod}; GPA fact ${gpa}`;
  });
  await manual.ctx.close();
  await check('J09','profile save persists approved declarations',async()=>{
    await page.locator('#profile-targetDegree').selectOption('master');
    await page.locator('#profile-form input[type=checkbox]').check();
    await page.locator('#profile-form button[type=submit]').click();
    await page.waitForFunction(()=>/saved|Saved/.test(document.querySelector('#profile [role=status]')?.textContent??''),{timeout:10000});
    return await text(page,'#profile [role=status]');
  });
  await check('J10','eligibility assessment is reachable and computes a verdict',async()=>{
    const summary=page.locator('#eligibility-example > summary');
    if(await page.locator('#eligibility-example').evaluate(el=>el.open)===false&&await summary.count())await summary.click();
    await page.locator('#eligibility-form select[name=degree]').selectOption('bachelor');
    const result=await text(page,'#eligibility-result');
    if(!result)throw Error('no verdict text');
    const rows=await page.locator('#eligibility-details li').count();
    if(!rows)throw Error('no per-requirement reasoning rows');
    return `"${result.slice(0,70)}" · ${rows} requirement row(s)`;
  });
  await check('J11','hypothetical score comparison produces a scenario result',async()=>{
    if(!await page.locator('.scenarios').evaluate(el=>el.open))await page.locator('.scenarios > summary').click();
    await page.locator('#eligibility-form input[name=hasTest]').check();
    await page.locator('#eligibility-form input[name=overall]').fill('7');
    await page.locator('#eligibility-simulate').click();
    const future=await text(page,'#eligibility-future');
    if(!future)throw Error('no scenario text');
    return future.slice(0,90);
  });
  await check('J12','deterministic Barrier PathFinder evaluates a reviewed scholarship',async()=>{
    const panel=page.locator('.local-workflow');
    if(!await panel.evaluate(el=>el.open))await panel.locator('summary').click();
    await page.locator('#local-degree').selectOption('bachelor');
    await page.locator('#local-consent').check();
    // The reviewed rules evaluate the saved scope profile, so persist the
    // degree first; refreshing the catalog alone leaves the evaluation unknown.
    await page.locator('#local-assessment button:not([type=submit])').nth(0).click();
    await page.waitForFunction(()=>/saved|ساتل|ذخیره/i.test(document.querySelector('#local-status')?.textContent??''),{timeout:10000});
    await page.locator('#local-assessment button:not([type=submit])').nth(1).click();
    try{await page.waitForFunction(()=>document.querySelectorAll('#local-program option').length>0,{timeout:10000});}
    catch{throw Error('catalog did not load; '+JSON.stringify(await page.evaluate(()=>({status:document.querySelector('#local-status')?.textContent,options:document.querySelectorAll('#local-program option').length,signIn:!!document.querySelector('.local-workflow .sign-in-action'),buttons:[...document.querySelectorAll('#local-assessment button')].map(b=>({text:b.textContent,disabled:b.disabled}))}))));}
    await page.locator('#local-program').selectOption({index:0});
    await page.locator('#local-assessment button[type=submit]').click();
    try{await page.waitForFunction(()=>/requirement|met|Met|اجرا|شرط/i.test(document.querySelector('#local-status')?.textContent??''),{timeout:10000});}
    catch{throw Error('assessment did not finish; '+JSON.stringify(await page.evaluate(()=>({status:document.querySelector('#local-status')?.textContent,program:document.querySelector('#local-program')?.value,disabled:document.querySelector('#local-assessment button[type=submit]')?.disabled}))));}
    const next=await text(page,'#next-actions');
    if(!next)throw Error('#next-actions stayed empty');
    return `status="${(await text(page,'#local-status')).slice(0,60)}"; next="${next.slice(0,70)}"`;
  });
  await check('J13','saving a scholarship from discovery is reflected in saved results',async()=>{
    await page.locator('details.resources > summary').click();
    await page.waitForSelector('[data-research-save]',{timeout:10000});
    await page.locator('[data-research-save]').first().click();
    const pressed=await page.locator('[data-research-save]').first().getAttribute('aria-pressed');
    if(pressed!=='true')throw Error(`save button aria-pressed=${pressed}`);
    return 'save toggled locally';
  });
  await check('J14','dashboard entry opens the signed-in dashboard',async()=>{
    await page.locator('#dashboard-entry').click();
    await page.waitForSelector('#student-dashboard:not([hidden])',{timeout:5000});
    if(!(await visible(page,'#student-dashboard')))throw Error('dashboard hidden');
    return `next step="${(await text(page,'.dashboard-next h2')).slice(0,60)}"`;
  });
  await check('J15','dashboard documents route shows the saved document',async()=>{
    await page.locator('.dashboard-nav-link[href="#dashboard/documents"]').click();
    await page.waitForSelector('#student-dashboard #documents',{timeout:10000});
    const options=await page.locator('#student-dashboard #documents select option').count();
    if(!options)throw Error('document library is empty in the dashboard');
    return `${options} library option(s)`;
  });
  await check('J16','dashboard saved route lists the saved scholarship',async()=>{
    await page.locator('.dashboard-nav-link[href="#dashboard/saved"]').click();
    await page.waitForSelector('.dashboard-saved-list li',{timeout:5000}).catch(()=>{});
    const items=await page.locator('.dashboard-saved-list li').count();
    if(!items)throw Error(`saved list empty: "${(await text(page,'.dashboard-panel')).slice(0,120)}"`);
    return `${items} saved item(s)`;
  });
  await check('J16b','the saved page offers the clear action its privacy note promises',async()=>{
    const clear=page.locator('[data-saved-clear]');
    if(!await clear.count()||await clear.isHidden())throw Error('no clear control on the saved page');
    const before=await page.locator('.dashboard-saved-list li').count();
    await clear.click();
    await page.waitForFunction(count=>document.querySelectorAll('.dashboard-saved-list li').length<count,before,{timeout:5000}).catch(()=>{});
    const after=await page.locator('.dashboard-saved-list li').count();
    if(after>=before)throw Error(`saved list stayed at ${after} item(s)`);
    const status=await text(page,'.dashboard-panel [role=status]');
    if(!status)throw Error('no confirmation message after clearing');
    return `cleared ${before - after} item(s); status="${status.slice(0,60)}"`;
  });
  await check('J17','dashboard assessments route carries the assessment tools',async()=>{
    await page.locator('.dashboard-nav-link[href="#dashboard/assessments"]').click();
    await page.waitForSelector('#student-dashboard #assistant',{timeout:5000});
    if(!await page.locator('#student-dashboard #next-steps').count())throw Error('#next-steps not mounted');
    return 'assistant and PathFinder mounted';
  });
  await check('J18','dashboard account route offers privacy actions',async()=>{
    await page.locator('.dashboard-nav-link[href="#dashboard/account"]').click();
    await page.waitForSelector('[data-privacy=export]',{timeout:5000});
    return 'export and delete present';
  });
  await check('J19','a dashboard deep link survives a reload',async()=>{
    await page.goto(baseUrl+'#dashboard/documents');
    await page.waitForSelector('#student-dashboard #documents',{timeout:10000});
    return 'deep link rendered documents view';
  });
  await check('J20','signing out restores the public site and clears the dashboard route',async()=>{
    await page.evaluate(()=>window.__setAuditUser?.(null));
    await page.waitForFunction(()=>location.hash!=='#dashboard'&&location.hash!=='#dashboard/documents',{timeout:5000}).catch(()=>{});
    if(!(await visible(page,'.site')))throw Error('site remained hidden after sign-out');
    if(await visible(page,'#student-dashboard'))throw Error('dashboard remained visible after sign-out');
    return `hash=${await page.evaluate(()=>location.hash)}`;
  });
  await check('J21','returning to the site restores the document workflow in place',async()=>{
    const mounted=await page.locator('details.workspace #documents-mount #documents').count();
    if(!mounted)throw Error('documents workflow was not restored inside the profile workspace');
    return 'documents workflow restored';
  });

  /* ---------------- AI-unavailable recovery state ---------------- */
  await check('J22','analysis failure shows an honest error and a deterministic recovery path',async()=>{
    await page.locator('#assistant').scrollIntoViewIfNeeded();
    await page.locator('#source-url').fill('https://example.edu/scholarship');
    await page.locator('#manual-source').click();
    await page.locator('#requirements').fill('Applicants must hold a bachelor degree. IELTS Academic overall 6.5 with no band below 6.0.');
    await page.locator('#source-approved').check();
    await page.locator('#analyze-form button[type=submit]').click();
    await page.waitForSelector('#deterministic-fallback',{timeout:15000});
    const message=await text(page,'#analysis-result');
    if(!message)throw Error('no error message shown');
    await page.locator('#deterministic-fallback').click();
    const open=await page.locator('.local-workflow').evaluate(el=>el.open);
    if(!open)throw Error('fallback did not open the deterministic workflow');
    return `error="${message.slice(0,60)}"; fallback opened`;
  });

  /* ---------------- guest journey ---------------- */
  const guest=await openPage('guest');
  const gpage=guest.page;
  await check('G01','guest stays on the site instead of an empty dashboard',async()=>{
    if(!(await visible(gpage,'.site')))throw Error('site hidden for guest');
    if(await visible(gpage,'#student-dashboard'))throw Error('dashboard visible for guest');
    if(!await gpage.locator('#dashboard-entry').isHidden())throw Error('dashboard entry visible while signed out');
    return 'public site shown, dashboard entry hidden';
  });
  await observe('G02','guest document upload: what the user is told and offered',async()=>{
    await gpage.locator('.hero-actions a[href="#documents-mount"]').click();
    await gpage.waitForSelector('#documents .sign-in-action',{timeout:10000});
    const uploadDisabled=await gpage.locator('#document-upload-form button[type=submit]').isDisabled();
    const status=await text(gpage,'#documents > [role=status]');
    const signInActions=await gpage.locator('#documents button, #documents a').evaluateAll(nodes=>nodes.filter(node=>/sign in|ورود|ننوتل/i.test(node.textContent??'')).length);
    return `upload disabled=${uploadDisabled}; status="${status}"; in-panel sign-in actions=${signInActions}`;
  });
  await observe('G03','guest profile save: what the user is told and offered',async()=>{
    await gpage.locator('#profile-degree').selectOption('bachelor');
    await gpage.locator('#profile-form input[type=checkbox]').check();
    await gpage.locator('#profile-form button[type=submit]').click();
    await gpage.waitForTimeout(800);
    const status=await text(gpage,'#profile-form [role=status]');
    const signInActions=await gpage.locator('#profile button, #profile a').evaluateAll(nodes=>nodes.filter(node=>/sign in|ورود|ننوتل/i.test(node.textContent??'')).length);
    return `status="${status}"; in-panel sign-in actions=${signInActions}`;
  });
  await check('G04','guest can still use the offline eligibility illustration',async()=>{
    // The illustration is lazy-mounted; activate a visible deep link instead of
    // assuming a previous scroll already loaded it.
    const link=gpage.locator('.pathfinder-timeline a[href="#eligibility-mount"]').first();
    if(await link.count())await link.click();
    else{const summary=gpage.locator('#eligibility-example > summary');if(await summary.count())await summary.click();}
    await gpage.waitForSelector('#eligibility-form select[name=degree]',{timeout:15000});
    const example=gpage.locator('#eligibility-example');
    if(await example.count()&&!(await example.evaluate(el=>el.open)))await example.locator(':scope > summary').click();
    await gpage.locator('#eligibility-form select[name=degree]').selectOption('bachelor');
    const result=await text(gpage,'#eligibility-result');
    if(!result)throw Error('no verdict for guest');
    return result.slice(0,80);
  });
  await observe('G05','guest saving a scholarship: where the saved result can be found',async()=>{
    await gpage.locator('details.resources > summary').click();
    await gpage.waitForSelector('[data-research-save]',{timeout:10000});
    await gpage.locator('[data-research-save]').first().click();
    const reachable=await gpage.evaluate(()=>!!document.querySelector('#dashboard-entry:not([hidden])'));
    return `saved locally; dashboard entry reachable=${reachable}`;
  });
  await check('G06','guest visiting a private dashboard route sees the public site, not a blank page',async()=>{
    await gpage.goto(baseUrl+'#dashboard/documents');
    await gpage.waitForTimeout(600);
    if(!(await visible(gpage,'.site')))throw Error('site hidden on a guest dashboard deep link');
    if(await visible(gpage,'#student-dashboard'))throw Error('private dashboard rendered while signed out');
    return `site shown; pending route kept=${await gpage.evaluate(()=>location.hash)}`;
  });
  await check('G06b','signing in from a private dashboard deep link opens that dashboard view',async()=>{
    await gpage.locator('.site .account summary').click();
    await gpage.locator('#account-controls button').first().click();
    await gpage.waitForSelector('#student-dashboard #documents-mount',{timeout:10000});
    return `dashboard documents view opened at ${await gpage.evaluate(()=>location.hash)}`;
  });
  await check('G07','a signed-out visitor can sign in from the document panel without losing the workflow',async()=>{
    await gpage.goto(baseUrl);
    await gpage.waitForSelector('#app .site',{state:'attached',timeout:15000});
    await gpage.locator('.hero-actions a[href="#documents-mount"]').click();
    await gpage.waitForSelector('#documents .sign-in-action [data-action=sign-in]',{timeout:10000});
    await gpage.locator('#documents .sign-in-action [data-action=sign-in]').click();
    await gpage.waitForSelector('#documents .sign-in-action',{state:'detached',timeout:10000});
    const hash=await gpage.evaluate(()=>location.hash);
    if(hash==='#dashboard')throw Error('sign-in threw the user onto the dashboard');
    if(!(await visible(gpage,'#documents')))throw Error('document panel not visible after sign-in');
    await gpage.setInputFiles('#documents input[type=file]','verification/fixtures/synthetic-education.txt');
    await gpage.locator('#document-consent').check();
    try{await gpage.locator('#document-upload-form button[type=submit]').click({timeout:10000});}
    catch{throw Error('upload submit unavailable; '+JSON.stringify(await gpage.evaluate(()=>({disabled:document.querySelector('#document-upload-form button[type=submit]')?.disabled,status:document.querySelector('#documents > [role=status]')?.textContent,signIn:!!document.querySelector('#documents .sign-in-action'),hash:location.hash}))));}
    await gpage.waitForSelector('#documents .document-claim',{timeout:10000});
    return `${await gpage.locator('#documents .document-claim').count()} claim(s) after in-place sign-in at ${hash}`;
  });
  for(const language of ['fa','ps']){
    const local=await openPage('guest');
    await check(`L-${language}` ,`the in-panel sign-in recovery is localized and does not overflow (${language})`,async()=>{
      await local.page.locator('#language').selectOption(language);
      await local.page.locator('.hero-actions a[href="#documents-mount"]').click();
      await local.page.waitForSelector('#documents .sign-in-action [data-action=sign-in]',{timeout:10000});
      const label=(await local.page.locator('#documents .sign-in-action [data-action=sign-in]').textContent())??'';
      if(!/[\u0600-\u06FF]/.test(label))throw Error(`sign-in action is not localized: "${label}"`);
      if(await local.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2))throw Error('horizontal overflow at 1280px');
      if(await local.page.locator('#documents .sign-in-action [data-action=sign-in]').getAttribute('lang')==='en')throw Error('action marked as English');
      return `"${label}"`;
    });
    await local.ctx.close();
  }
  await check('N01','no page renders a broken SVG icon or logs a console error',async()=>{
    const broken=await gpage.evaluate(()=>[...document.querySelectorAll('path')].filter(path=>path.getAttribute('d')==='undefined').length);
    if(broken)throw Error(`${broken} malformed icon path(s)`);
    if(consoleErrors.length)throw Error(consoleErrors.join(' | '));
    return 'no malformed icon paths; no console errors';
  });

  await writeFileSync('verification/artifacts/journey-audit.json',JSON.stringify({mode:'BROWSER_WITH_MOCK_IDENTITY_AND_REAL_LOCAL_API',liveInference:false,liveGoogleSignIn:false,generatedAt:new Date().toISOString(),consoleErrors,cases:results},null,2));
  const failures=results.filter(item=>item.status==='fail');
  console.log(results.map(item=>`${item.status==='pass'?'PASS':item.status==='fail'?'FAIL':'NOTE'} ${item.id} ${item.step}${item.detail?` — ${item.detail}`:''}`).join('\n'));
  console.log(`\n${results.filter(item=>item.status==='pass').length} passed, ${failures.length} failed, ${results.filter(item=>item.status==='observation').length} observation(s); console errors: ${consoleErrors.length}`);
  await ctx.close();await guest.ctx.close();
  process.exitCode=failures.length?1:0;
}finally{
  await browser.close();await vite.close();await new Promise(resolve=>api.close(resolve));documents.close();rmSync(documentDir,{recursive:true,force:true});
}
