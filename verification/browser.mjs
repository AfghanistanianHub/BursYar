import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createServer} from 'vite';
import {mkdirSync,writeFileSync} from 'node:fs';
const vite=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true}});await vite.listen();
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const evidence={criteria:[{id:'criterion-1',kind:'transcripts',required:true,excerpt:'Applicants must provide academic transcripts.',en:'Provide transcripts.',fa:'اسناد تحصیلی ارائه کنید.',ps:'تحصیلي اسناد وړاندې کړئ.'}],funding:['Tuition fees are covered.'],deadline:null,uncertainties:['The exact deadline is unknown.'],requiresHumanReview:true,sourceDigest:'a'.repeat(64),analyzedAt:'2026-10-26T12:00:00Z'};
const report={mode:'BROWSER_WITH_MOCK_AUTH_AND_API',liveMetaVerified:false,liveGoogleSignInVerified:false,cases:[]};
mkdirSync('verification/artifacts',{recursive:true});
try {
 for(const language of ['en','fa','ps'])for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
  // Test-only network interception, not a runtime bypass or simulated live verification.
  await page.route('**/src/auth.js',route=>route.fulfill({contentType:'text/javascript',body:'export async function signIn(){};export async function signOut(){};export async function getInferenceToken(){return "browser-test-only";}'}));
  let responseStatus=200;let sawRequest=false;let calls=0;
  await page.route('**/api/analyze',async route=>{const body=route.request().postDataJSON();expect(body.language).toBe(language);expect(body).not.toHaveProperty('transcripts');expect(route.request().headers().authorization).toBe('Bearer browser-test-only');sawRequest=true;calls++;await new Promise(resolve=>setTimeout(resolve,80));await route.fulfill({status:responseStatus,contentType:'application/json',body:JSON.stringify(responseStatus===200?evidence:{error:'test-error'})});});
  await page.goto('http://127.0.0.1:5173');await page.locator('#language').selectOption(language);
  await expect(page.locator('html')).toHaveAttribute('dir',language==='en'?'ltr':'rtl');
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
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);expect(overflow).toBe(false);
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  report.cases.push({language,width,overflow,accessibilityViolations:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}))});
  expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  if(width===390)await page.screenshot({path:`verification/artifacts/${language}-390.png`,fullPage:true});
  // Re-rendering via unrelated search must retain ephemeral source input.
  await page.locator('#search').fill('test');await expect(page.locator('#requirements')).toHaveValue('Applicants must provide academic transcripts. Tuition fees are covered.');
  responseStatus=429;await page.locator('#analyze-form button[type=submit]').click();await expect(page.locator('#analysis-result')).toContainText({en:'Quota',fa:'محدودیت',ps:'حد'}[language]);
  await page.locator('#source-url').focus();await page.keyboard.press('Tab');await expect(page.locator('#requirements')).toBeFocused();
  await context.close();
 }
 console.log(JSON.stringify({mode:report.mode,cases:report.cases.length,passed:true,liveMetaVerified:false,liveGoogleSignInVerified:false}));
}finally{writeFileSync('verification/artifacts/browser-report.json',JSON.stringify(report,null,2));await browser.close();await vite.close();}
