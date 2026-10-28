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
const api=createInferenceServer({projectId:'demo-bursyar',origin:baseUrl,documents,quota:{reserve(){}},infer:async()=>{throw Error('Browser model must remain mocked');},verify:async()=>({uid:'browser-test',aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true})});
await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
const apiUrl=`http://127.0.0.1:${api.address().port}`;
let browser;
try{browser=await chromium.launch({headless:true,args:['--no-sandbox']});}catch(error){await vite.close();await new Promise(resolve=>api.close(resolve));documents.close();rmSync(documentDir,{recursive:true,force:true});throw error;}
const evidence=normalizeEvidence(JSON.stringify({criteria:[{id:'criterion-1',kind:'transcripts',required:true,excerpt:'Applicants must provide academic transcripts.',en:'Provide transcripts.',fa:'اسناد تحصیلی ارائه کنید.',ps:'تحصیلي اسناد وړاندې کړئ.'}],funding:['Tuition fees are covered.'],deadline:null,uncertainties:['The exact deadline is unknown.'],requiresHumanReview:true,sourceDigest:'a'.repeat(64),analyzedAt:'2026-10-26T12:00:00Z'}),{text:'Applicants must provide academic transcripts. Tuition fees are covered.',sourceUrl:'https://university.example/award'});
const report={mode:'BROWSER_WITH_MOCK_AUTH_AND_API',liveMetaVerified:false,liveGoogleSignInVerified:false,cases:[]};
mkdirSync('verification/artifacts',{recursive:true});
try {
 for(const language of ['en','fa','ps'])for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
  // Test-only network interception, not a runtime bypass or simulated live verification.
  await page.route('**/src/auth.js',route=>route.fulfill({contentType:'text/javascript',body:'export async function signIn(){};export async function signOut(){};export async function getInferenceToken(){return "browser-test-only";}'}));
  await page.route(/\/api\/(documents|profile)/,async route=>{const request=route.request();const response=await fetch(apiUrl+new URL(request.url()).pathname,{method:request.method(),headers:{authorization:request.headers().authorization,origin:baseUrl,'content-type':'application/json'},...(['POST','PUT'].includes(request.method())?{body:request.postData()}:{} )});await route.fulfill({status:response.status,contentType:'application/json',body:await response.text()});});
  let responseStatus=200;let sawRequest=false;let calls=0;
  await page.route('**/api/analyze',async route=>{const body=route.request().postDataJSON();expect(body.language).toBe(language);expect(body).not.toHaveProperty('transcripts');expect(route.request().headers().authorization).toBe('Bearer browser-test-only');sawRequest=true;calls++;await new Promise(resolve=>setTimeout(resolve,80));await route.fulfill({status:responseStatus,contentType:'application/json',body:JSON.stringify(responseStatus===200?evidence:{error:'test-error'})});});
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
  const submit=page.locator('#analyze-form button[type=submit]');await submit.click();
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
   // Exercise the real local document API with synthetic text and mocked identity.
   const upload=page.locator('#documents form').first();
   await upload.locator('input[type=file]').setInputFiles({name:'synthetic-education.txt',mimeType:'text/plain',buffer:Buffer.from('SYNTHETIC TEST ONLY\nDegree: bachelor\nIELTS Academic: overall=7; listening=7; reading=7; writing=6; speaking=7')});
   await upload.locator('input[type=checkbox]').check();await upload.locator('button[type=submit]').click();
   await expect(page.locator('#documents fieldset')).toHaveCount(2);
   await page.locator('#documents form').nth(1).locator('button[type=submit]').click();
   await expect(page.locator('#eligibility-form [name=degree]')).toHaveValue('bachelor');
   await expect(page.locator('#eligibility-form [name=hasTest]')).toBeChecked();
   const canonical=await page.locator('#eligibility-result').getAttribute('data-status');
   await page.locator('#language').selectOption(language==='en'?'fa':'en');
   await expect(page.locator('#eligibility-result')).toHaveAttribute('data-status',canonical);
   await expect(page.locator('#eligibility-form [name=degree]')).toHaveValue('bachelor');
   await page.locator('#language').selectOption(language);
   await expect(page.locator('#documents fieldset')).toHaveCount(0);
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
  await page.locator('#source-url').focus();await page.keyboard.press('Tab');await expect(page.locator('#requirements')).toBeFocused();
  await context.close();
 }
 console.log(JSON.stringify({mode:report.mode,cases:report.cases.length,passed:true,liveMetaVerified:false,liveGoogleSignInVerified:false}));
}finally{writeFileSync('verification/artifacts/browser-report.json',JSON.stringify(report,null,2));await browser.close();await vite.close();await new Promise(resolve=>api.close(resolve));documents.close();rmSync(documentDir,{recursive:true,force:true});}
