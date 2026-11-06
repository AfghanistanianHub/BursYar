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
 for(const language of ['en','fa','ps'])for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),uid=`synthetic-academic-${language}-${width}`;const outside=[];let inference=0;
  await context.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin){outside.push(r.request().url());return r.abort();}return r.continue();});
  await page.route('**/src/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export async function signIn(){};export async function signOut(){};export async function onAuthChange(){return ()=>{};}export async function getInferenceToken(){return '${uid}';}`}));
  await page.route('**/api/**',async r=>{const req=r.request(),path=new URL(req.url()).pathname;if(/analy|infer|interpret/.test(path)){inference++;return r.abort();}const response=await fetch(apiBase+path,{method:req.method(),headers:{authorization:req.headers().authorization,origin,'content-type':'application/json'},...(['POST','PUT'].includes(req.method())?{body:req.postData()}: {})});await r.fulfill({status:response.status,contentType:'application/json',body:await response.text()});});
  await page.addInitScript(lang=>localStorage.setItem('bursyar-language',lang),language);await page.goto(origin);
  await page.locator('#workspace-overview a[href="#profile-mount"]').click();
  await expect(page.locator('#academic-academicScore')).toHaveCount(1);
  const copy=await page.evaluate(async lang=>({academic:(await import('/src/academic-evidence-form.js')).academicEvidenceCopy[lang],local:(await import('/src/local-workflow.js')).localWorkflowCopy[lang]}),language);
  const save=async(score,scale)=>{await page.locator('#academic-academicScore').fill(String(score));await page.locator('[name="academicScale"]').selectOption(String(scale));await page.locator('#academic-evidence input[type=checkbox]').check();await page.locator('#academic-evidence button[type=submit]').click();await expect(page.locator('#academic-evidence [role=status]')).toHaveText(copy.academic.saved);};
  await save(18,20);expect(documents.profile(uid).academicScore.value).toEqual({score:18,scale:20});
  await page.locator('.local-workflow').evaluate(el=>el.open=true);await page.locator('#local-assessment button').nth(1).click();await page.locator('#local-program').selectOption('turkiye-health-academic');
  const assess=async()=>page.locator('#local-assessment button[type=submit]').click();await assess();await expect(page.locator('#local-status')).toHaveText(copy.local.unknownResult);await expect(page.locator('#local-source-info a')).toHaveAttribute('href','https://www.turkiyeburslari.gov.tr/scholarshipsprograms');
  await save(89,100);await expect(page.locator('.local-workflow blockquote')).toHaveCount(0);await assess();await expect(page.locator('#local-status')).toHaveText(copy.local.not_met);
  await save(90,100);await expect(page.locator('.local-workflow blockquote')).toHaveCount(0);await assess();await expect(page.locator('#local-status')).toHaveText(copy.local.unknownResult);await expect(page.locator('.local-workflow blockquote')).toContainText('90%');
  if(language==='en'&&width===320){
   let release,seen;const held=new Promise(r=>{release=r;}),requested=new Promise(r=>{seen=r;});
   const delayed=async route=>{const req=route.request(),response=await fetch(apiBase+'/api/evaluate',{method:'POST',headers:{authorization:req.headers().authorization,origin,'content-type':'application/json'},body:req.postData()}),body=await response.text();seen();await held;await route.fulfill({status:response.status,contentType:'application/json',body});};
   await page.route('**/api/evaluate',delayed);await assess();await requested;
   await save(89,100);const completed=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/evaluate');release();await (await completed).finished();await page.evaluate(()=>new Promise(r=>setTimeout(r,30)));
   await expect(page.locator('.local-workflow blockquote')).toHaveCount(0);await expect(page.locator('#local-status')).toHaveText(copy.local.changed);await page.unroute('**/api/evaluate',delayed);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
  const a11y=await new AxeBuilder({page}).include('#academic-evidence').include('.local-workflow').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(a11y.violations.map(v=>v.id)).toEqual([]);expect(outside).toEqual([]);expect(inference).toBe(0);
  console.log(`PASS ${language}/${width}: exact scale, below-threshold, incomplete coverage, stale-result clearing, consent, official source, axe; no inference`);await context.close();
 }
}finally{await browser?.close();await vite.close();await new Promise(r=>api.close(r));documents.close();rmSync(dir,{recursive:true,force:true});}
