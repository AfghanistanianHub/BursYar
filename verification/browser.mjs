import {createSourceFetcher} from '../engine/source-fetch.js';
import {normalizeEvidence} from '../engine/evidence.js';
import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createServer} from 'vite';
import {mkdirSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';
const vite=await createServer({server:{host:'127.0.0.1',port:0}});await vite.listen();
const baseUrl=`http://127.0.0.1:${vite.httpServer.address().port}`;
const documentDir=mkdtempSync(join(tmpdir(),'bursyar-browser-docs-'));
const documents=new DocumentStore(join(documentDir,'docs.db'));
const sources=createSourceFetcher({resolve:async()=>[{address:'93.184.216.34',family:4}],transport:async()=>({body:'<main><h1>SYNTHETIC OFFLINE SOURCE FIXTURE</h1><p>Applicants must provide academic transcripts.</p><p>Tuition fees are covered.</p><a href="/course">Course conditions require confirmation.</a></main>'})});
const api=createInferenceServer({sources,projectId:'demo-bursyar',origin:baseUrl,documents,quota:{reserve(){}},infer:async()=>{throw Error('Browser model must remain mocked');},verify:async token=>({uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true})});
await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
const apiUrl=`http://127.0.0.1:${api.address().port}`;
let browser;
try{browser=await chromium.launch({headless:true,args:['--no-sandbox']});}catch(error){await vite.close();await new Promise(resolve=>api.close(resolve));documents.close();rmSync(documentDir,{recursive:true,force:true});throw error;}
const evidence=normalizeEvidence(JSON.stringify({criteria:[{kind:'transcripts',required:true,excerpt:'Applicants must provide academic transcripts.',en:'Provide transcripts.',fa:'اسناد تحصیلی ارائه کنید.',ps:'تحصیلي اسناد وړاندې کړئ.'}],funding:['Tuition fees are covered.'],deadline:null}),{text:'Applicants must provide academic transcripts. Tuition fees are covered.',sourceUrl:'https://university.example/award'});
const report={mode:'BROWSER_WITH_MOCK_AUTH_AND_API',liveMetaVerified:false,liveGoogleSignInVerified:false,cases:[]};
mkdirSync('verification/artifacts',{recursive:true});
try {
 for(const language of ['en','fa','ps'])for(const width of [320,390,768,1280,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
  await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const note=document.createElement('p');note.textContent='OFFLINE REHEARSAL — mocked identity and Meta; synthetic applicant data';note.setAttribute('role','note');note.style.cssText='padding:12px;background:#fff;color:#111;border:2px solid #111';document.body.prepend(note);},{once:true}));
  // Test-only network interception, not a runtime bypass or simulated live verification.
  const browserToken=`browser-test-${language}-${width}`;
  await page.route('**/src/auth.js',route=>route.fulfill({contentType:'text/javascript',body:'export async function signIn(){};export async function signOut(){};export async function getInferenceToken(){return "'+browserToken+'";}'}));
  await page.route(/\/api\/(documents|profile|source)/,async route=>{const request=route.request();const response=await fetch(apiUrl+new URL(request.url()).pathname,{method:request.method(),headers:{authorization:request.headers().authorization,origin:baseUrl,'content-type':'application/json'},...(['POST','PUT'].includes(request.method())?{body:request.postData()}:{} )});await route.fulfill({status:response.status,contentType:'application/json',body:await response.text()});});
  let responseEvidence=evidence;let responseStatus=200;let sawRequest=false;let calls=0;
  await page.route('**/api/analyze',async route=>{const body=route.request().postDataJSON();expect(body.language).toBe(language);expect(body).not.toHaveProperty('transcripts');expect(route.request().headers().authorization).toBe(`Bearer ${browserToken}`);sawRequest=true;calls++;await new Promise(resolve=>setTimeout(resolve,80));await route.fulfill({status:responseStatus,contentType:'application/json',body:JSON.stringify(responseStatus===200?responseEvidence:{error:'test-error'})});});
  await page.goto(baseUrl);await page.locator('#language').selectOption(language);
  await expect(page.locator('html')).toHaveAttribute('dir',language==='en'?'ltr':'rtl');
  if(width===390){
   await page.locator('#eligibility-form [name=degree]').selectOption('bachelor');
   await page.locator('#eligibility-form [name=hasTest]').check();
   await expect(page.locator('#eligibility-result')).toHaveAttribute('data-status','not_met');
   await page.locator('#eligibility-simulate').click();
   await expect(page.locator('#eligibility-future')).toHaveAttribute('data-status','met');
   await expect(page.locator('#eligibility-form [name=overall]')).toHaveValue('6');
   await page.locator('#language').selectOption(language==='en'?'fa':'en');
   await expect(page.locator('#eligibility-result')).toHaveAttribute('data-status','not_met');
   await expect(page.locator('#eligibility-future')).toHaveAttribute('data-status','met');
   await page.locator('#language').selectOption(language);
  }
  await page.locator('#requirements').fill('Applicants must provide academic transcripts. Tuition fees are covered.');
  await page.locator('[name=sourceUrl]').fill('https://university.example/award');
  const submit=page.locator('#analyze-form button[type=submit]');await expect(submit).toBeDisabled();await page.locator('#source-approved').check();await submit.click();
  await expect(page.locator('#analyze-form')).toHaveAttribute('aria-busy','true');
  await expect(page.locator('.criterion')).toBeVisible();expect(sawRequest).toBe(true);
  await expect(page.locator('.criterion [lang=en]')).toBeVisible();
  if(language!=='en')await expect(page.locator(`.criterion [lang=${language}]`)).toBeVisible();
  await page.locator('[name=transcripts]').selectOption('unavailable');
  await expect(page.locator('#barrier-guidance')).toContainText({en:'Potential mismatch',fa:'ناسازگاری احتمالی',ps:'احتمالي نه سمون'}[language]);
  await page.locator('#language').selectOption(language==='en'?'fa':'en');await expect(page.locator('.criterion')).toBeVisible();await page.locator('#language').selectOption(language);await expect(page.locator('.criterion')).toBeVisible();expect(calls).toBe(1);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)console.log(JSON.stringify({language,width,overflowElements:await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1||el.getBoundingClientRect().left< -1).map(el=>({tag:el.tagName,id:el.id,class:el.className,width:el.getBoundingClientRect().width})).slice(0,20))}));expect(overflow).toBe(false);
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  report.cases.push({language,width,overflow,accessibilityViolations:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}))});
  expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  if(width===390){
   const profile=page.locator('#profile-form');await profile.locator('[name=academicHistory]').fill('SYNTHETIC EDUCATION ONLY');await profile.locator('[name=languages]').fill('English (self-declared)');await profile.locator('[name=continuingSameDegree]').selectOption('false');await profile.locator('[name=consent]').check();await profile.locator('button[type=submit]').click();await expect(page.locator('#profile [role=status]')).toContainText({en:'Profile saved.',fa:'پروفایل ذخیره شد.',ps:'پروفایل وساتل شو.'}[language]);await expect(page.locator('#profile-form [name=academicHistory]')).toHaveValue('SYNTHETIC EDUCATION ONLY');
   // Exercise the real local document API with synthetic text and mocked identity.
   const upload=page.locator('#documents form').first();
   await upload.locator('input[type=file]').setInputFiles({name:'synthetic-education.txt',mimeType:'text/plain',buffer:Buffer.from('SYNTHETIC TEST ONLY\nDegree: bachelor\nIELTS Academic: overall=7; listening=7; reading=7; writing=6; speaking=7')});
   await upload.locator('input[type=checkbox]').check();await upload.locator('button[type=submit]').click();
   await expect(page.locator('#documents .document-claim')).toHaveCount(2);
   await page.locator('#documents form').nth(1).locator('button[type=submit]').click();
   await expect(page.locator('#eligibility-form [name=degree]')).toHaveValue('bachelor');
   await expect(page.locator('#eligibility-form [name=hasTest]')).toBeChecked();
   const canonical=await page.locator('#eligibility-result').getAttribute('data-status');
   await page.locator('#language').selectOption(language==='en'?'fa':'en');
   await expect(page.locator('#eligibility-result')).toHaveAttribute('data-status',canonical);
   await expect(page.locator('#eligibility-form [name=degree]')).toHaveValue('bachelor');
   await page.locator('#language').selectOption(language);
   await expect(page.locator('#documents .document-claim')).toHaveCount(0);
   await page.locator('#documents fieldset > button').first().click();await page.locator('#documents fieldset > button').nth(1).click();await expect(page.locator('#documents .document-claim')).toHaveCount(0);
   await page.locator('#documents button').last().click();
   await expect(page.locator('#documents pre')).toHaveCount(0);
   await expect(page.locator('#eligibility-form [name=degree]')).toHaveValue('');
  }
  if(width===390)await page.screenshot({path:`verification/artifacts/${language}-390.png`,fullPage:true});
  // Re-rendering via unrelated search must retain ephemeral source input.
  await page.locator('#search').fill('test');await expect(page.locator('#requirements')).toHaveValue('Applicants must provide academic transcripts. Tuition fees are covered.');
  responseStatus=429;await page.locator('#analyze-form button[type=submit]').click();await expect(page.locator('#analysis-result')).toContainText({en:'Quota',fa:'محدودیت',ps:'حد'}[language]);
  for(const status of [502,503,504]){
   responseStatus=status;await page.locator('#analyze-form button[type=submit]').click();
   await expect(page.locator('#analyze-form')).not.toHaveAttribute('aria-busy','true');
   await expect(page.locator('#analyze-form button[type=submit]')).toBeEnabled();
   await expect(page.locator('.criterion')).toHaveCount(0);
   await expect(page.locator('#analysis-result')).not.toContainText('test-error');
  }
  await page.locator('#source-url').focus();await page.keyboard.press('Tab');await expect(page.locator('#fetch-source')).toBeFocused();
  if(width===390){
   const {readFileSync}=await import('node:fs');
   const continuing=JSON.parse(readFileSync('verification/fixtures/scholarship-evaluation.json','utf8')).cases[0].text;
   const deferred='Applicants who hold a deferred graduate offer are not eligible to be considered for this scholarship.';
   const source=`SYNTHETIC BROWSER FIXTURE ONLY\n${deferred}\n${continuing}\nCourse-specific deadlines require confirmation.`;
   responseEvidence=normalizeEvidence(JSON.stringify({criteria:[{kind:'other',required:true,excerpt:deferred,en:'Deferred offers are excluded.',fa:'پذیرش به‌تعویق‌افتاده مشمول نیست.',ps:'ځنډول شوی وړاندیز نه منل کېږي.'}],deadline:null,funding:[]}),{text:source,sourceUrl:'https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants'});
   const profile=page.locator('#profile-form');await profile.locator('[name=deferredOffer]').selectOption('true');await profile.locator('[name=continuingSameDegree]').selectOption('false');await profile.locator('[name=consent]').check();await profile.locator('button[type=submit]').click();await expect(page.locator('#profile [role=status]')).toContainText({en:'Profile saved.',fa:'پروفایل ذخیره شد.',ps:'پروفایل وساتل شو.'}[language]);
   responseStatus=200;await page.locator('#requirements').fill(source);await page.locator('[name=sourceUrl]').fill(responseEvidence.sourceUrl);await page.locator('#source-approved').check();await page.locator('#analyze-form button[type=submit]').click();
   await expect(page.locator('#eligibility-result')).toHaveAttribute('data-status','not_met');
   await page.locator('.source-inventory summary').click();await expect(page.locator('.source-inventory')).toContainText(continuing);
   await page.locator('#exclusion-simulate').click();await expect(page.locator('#exclusion-future')).toHaveAttribute('data-status','unknown');await expect(page.locator('#profile-form [name=deferredOffer]')).toHaveValue('true');
   await page.locator('#language').selectOption(language==='en'?'fa':'en');await expect(page.locator('#eligibility-result')).toHaveAttribute('data-status','not_met');await expect(page.locator('#exclusion-future')).toHaveAttribute('data-status','unknown');await page.locator('#language').selectOption(language);
   const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
   await page.screenshot({path:`verification/artifacts/${language}-oxford-profile-390.png`,fullPage:true});
  }
  // URL-only retrieval uses the real gateway/extractor with an offline transport fixture.
  responseStatus=200;responseEvidence=evidence;
  await page.locator('#source-url').fill('https://university.example/award');
  const beforeFetch=calls;await page.locator('#fetch-source').click();
  await expect(page.locator('#requirements')).toHaveValue(/SYNTHETIC OFFLINE SOURCE FIXTURE/);
  await expect(page.locator('#requirements')).toHaveAttribute('readonly','');
  expect(calls).toBe(beforeFetch);await expect(page.locator('#analyze-form button[type=submit]')).toBeDisabled();
  await page.locator('#source-approved').check();
  await page.locator('#language').selectOption(language==='en'?'fa':'en');
  await expect(page.locator('#source-approved')).toBeChecked();
  await expect(page.locator('.source-preview')).toBeVisible();
  await page.locator('#language').selectOption(language);
  await page.locator('#analyze-form button[type=submit]').click();await expect(page.locator('.criterion')).toBeVisible();expect(calls).toBe(beforeFetch+1);
  await page.locator('#manual-source').click();await page.locator('#requirements').fill('Manual replacement: Applicants must provide academic transcripts.');
  await expect(page.locator('#source-approved')).not.toBeChecked();await expect(page.locator('#analyze-form button[type=submit]')).toBeDisabled();
  await page.locator('#fetch-source').click();await expect(page.locator('#requirements')).toHaveAttribute('readonly','');
  await page.locator('#source-url').fill('https://other.example/scholarship');await expect(page.locator('#requirements')).toHaveValue('');await expect(page.locator('#requirements')).not.toHaveAttribute('readonly','');
  report.sourcePreviewCases=(report.sourcePreviewCases??0)+1;
  await context.close();
 }
 console.log(JSON.stringify({mode:report.mode,cases:report.cases.length,passed:true,liveMetaVerified:false,liveGoogleSignInVerified:false}));
}finally{writeFileSync('verification/artifacts/browser-report.json',JSON.stringify(report,null,2));await browser.close();await vite.close();await new Promise(resolve=>api.close(resolve));documents.close();rmSync(documentDir,{recursive:true,force:true});}
