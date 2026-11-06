// Synthetic private-profile records and a local deterministic backend only.
import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createServer} from 'vite';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';
import {createScholarshipCatalog} from '../engine/deterministic.js';
import {defaultCatalog} from '../engine/default-catalog.js';
const vite=await createServer({server:{host:'127.0.0.1',port:0}});await vite.listen();const origin='http://127.0.0.1:'+vite.httpServer.address().port;
const dir=mkdtempSync(join(tmpdir(),'bursyar-academic-')),documents=new DocumentStore(join(dir,'synthetic.db'));
const projectId='demo-bursyar',api=createInferenceServer({projectId,origin,documents,catalog:createScholarshipCatalog(defaultCatalog),quota:{reserve(){throw Error('NO INFERENCE');}},infer:async()=>{throw Error('NO INFERENCE');},verify:async token=>({uid:token,aud:projectId,iss:'https://securetoken.google.com/'+projectId,bursyarDemo:true})});await new Promise(r=>api.listen(0,'127.0.0.1',r));const apiBase='http://127.0.0.1:'+api.address().port;let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const language of ['en','fa','ps'])for(const width of [320,768]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),uid=`synthetic-exclusions-${language}-${width}`;let inference=0;
  await context.route('**/*',r=>new URL(r.request().url()).origin!==origin?r.abort():r.continue());
  await page.route('**/src/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export async function signIn(){};export async function signOut(){};export async function onAuthChange(){return ()=>{};}export async function getInferenceToken(){return '${uid}';}`}));
  await page.route('**/api/**',async r=>{const req=r.request(),path=new URL(req.url()).pathname;if(/analy|infer|interpret/.test(path)){inference++;return r.abort();}const response=await fetch(apiBase+path,{method:req.method(),headers:{authorization:req.headers().authorization,origin,'content-type':'application/json'},...(['POST','PUT'].includes(req.method())?{body:req.postData()}: {})});await r.fulfill({status:response.status,contentType:'application/json',body:await response.text()});});
  await page.addInitScript(lang=>localStorage.setItem('bursyar-language',lang),language);await page.goto(origin);await page.locator('#workspace-overview a[href="#profile-mount"]').click();
  const field=page.locator('#profile-turkishCitizenshipHistory');await expect(field).toHaveCount(1,{timeout:2000});
  const copy=await page.evaluate(async lang=>({profile:(await import('/src/profile-form.js')).profileCopy[lang],local:(await import('/src/local-workflow.js')).localWorkflowCopy[lang]}),language);
  await page.locator('#profile-turkiye').evaluate(el=>el.open=true);
  await expect(field).toHaveValue('');
  const save=async(a,b)=>{await page.locator('#profile-targetDegree').selectOption('master');await page.locator('#profile-turkiye').evaluate(el=>el.open=true);await page.locator('#profile-turkishCitizenshipHistory').selectOption(a);await page.locator('#profile-enrolledInTurkiyeAtTargetLevel').selectOption(b);await page.locator('#profile-form input[name=consent]').check();await page.locator('#profile-form button[type=submit]').click();await expect(page.locator('#profile [role=status]')).toHaveText(copy.profile.saved);};
  await save('true','false');expect(documents.profile(uid).turkishCitizenshipHistory.value).toBe(true);
  await page.locator('.local-workflow').evaluate(el=>el.open=true);await page.locator('#local-assessment button').nth(1).click();await page.locator('#local-program').selectOption('turkiye-general-exclusions');
  await page.locator('#local-assessment button[type=submit]').click();await expect(page.locator('#local-status')).toHaveText(copy.local.not_met);
  await save('false','false');await page.locator('#local-assessment button[type=submit]').click();await expect(page.locator('#local-status')).toHaveText(copy.local.unknownResult);
  await save('','');expect(documents.profile(uid).turkishCitizenshipHistory).toBeUndefined();await page.locator('#local-assessment button[type=submit]').click();await expect(page.locator('#local-status')).toHaveText(copy.local.unknownResult);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
  const axe=await new AxeBuilder({page}).include('#profile').include('.local-workflow').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations.map(v=>v.id)).toEqual([]);expect(inference).toBe(0);
  console.log(`PASS ${language}/${width}: citizenship/enrolment declaration, exact exclusion, unknown reset, RTL/overflow, axe; no inference`);await context.close();
 }
}finally{await browser?.close();await vite.close();await new Promise(r=>api.close(r));documents.close();rmSync(dir,{recursive:true,force:true});}
