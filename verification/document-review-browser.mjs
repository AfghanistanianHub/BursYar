// Real local document API + synthetic files; identity is mocked, never live Meta.
import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createServer} from 'vite';
import {mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';
const vite=await createServer({server:{host:'127.0.0.1',port:0}});await vite.listen();
const origin=`http://127.0.0.1:${vite.httpServer.address().port}`;
const dir=mkdtempSync(join(tmpdir(),'bursyar-doc-review-'));const documents=new DocumentStore(join(dir,'docs.db'));
const api=createInferenceServer({quota:{reserve(){throw Error('Inference quota forbidden');}},infer:async()=>{throw Error('Inference forbidden');},documents,projectId:'demo-bursyar',origin,verify:async token=>({uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true})});
await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});mkdirSync('verification/artifacts',{recursive:true});
try{for(const language of ['en','fa','ps']){
 const context=await browser.newContext({viewport:{width:390,height:900}});const page=await context.newPage();const uid='document-review-'+language;let uploads=0,reviews=0;let statusOverride=null,releaseUpload=null,dropNextUpload=false;
 await page.addInitScript(lang=>localStorage.setItem('bursyar-language',lang),language);
 await page.route('**/src/auth.js',route=>route.fulfill({contentType:'text/javascript',body:`export async function signIn(){};export async function signOut(){};export async function onAuthChange(){return ()=>{}};export async function getInferenceToken(){return '${uid}'}` }));
 await page.route('**/api/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(path==='/api/analyze')throw Error('Inference forbidden in document review test');
  if(request.method()==='POST'&&path==='/api/documents'){uploads++;if(releaseUpload)await releaseUpload;}
  if(path.endsWith('/review')&&request.method()==='POST')reviews++;
  if(statusOverride){await route.fulfill({status:statusOverride,contentType:'application/json',body:'{}'});return;}
  const response=await fetch(`http://127.0.0.1:${api.address().port}`+path,{method:request.method(),headers:{authorization:request.headers().authorization,origin,'content-type':'application/json'},...(['POST','PUT'].includes(request.method())?{body:request.postData()}:{} )});
  if(dropNextUpload&&path==='/api/documents'&&request.method()==='POST'){dropNextUpload=false;await route.abort('failed');return;}
  await route.fulfill({status:response.status,contentType:'application/json',body:await response.text()});
 });
 await page.goto(origin);await page.locator('#workspace-overview a[href="#profile-mount"]').click();
 const form=page.locator('#documents > form'),file=form.locator('input[type=file]'),consent=form.locator('input[type=checkbox]'),status=page.locator('#documents > [role=status]');
 await consent.check();
 for(const [name,buffer]of [['scan.pdf',Buffer.from('pdf')],['large.txt',Buffer.alloc(12001,65)],['empty.txt',Buffer.from(' \n')],['invalid.txt',Buffer.from([0xc3,0x28])]]){
  await file.setInputFiles({name,mimeType:'text/plain',buffer});await form.locator('button').click();await expect(status).not.toBeEmpty();expect(uploads).toBe(0);
 }
 await file.setInputFiles({name:'synthetic.txt',mimeType:'text/plain',buffer:Buffer.from('SYNTHETIC TEST ONLY\nDegree: bachelor\nGPA: 3.4/4\nTOEFL iBT: overall=100; listening=25; reading=25; writing=25; speaking=25')});
 let finish;releaseUpload=new Promise(resolve=>finish=resolve);
 await form.locator('button').click();await expect(page.locator('#documents')).toHaveAttribute('aria-busy','true');await expect(form.locator('button')).toBeDisabled();finish();releaseUpload=null;
 await expect(page.locator('.document-claim')).toHaveCount(3);expect(uploads).toBe(1);
 const review=page.locator('#documents > div > form');await review.locator('button').click();expect(reviews).toBe(0);expect(documents.profile(uid)).toEqual({});
 const choices=page.locator('.document-claim select');await choices.nth(0).selectOption('correct');await page.locator('.document-claim').nth(0).locator('input').fill('master');await choices.nth(1).selectOption('reject');await choices.nth(2).selectOption('accept');await review.locator('button').click();
 await expect(page.locator('.document-claim')).toHaveCount(0);
 const profile=documents.profile(uid);expect(profile.degree.value).toBe('master');expect(profile.degree.origin).toBe('user_declared');expect(profile.gpa).toBeUndefined();expect(profile.languageTest.value.test).toBe('TOEFL iBT');expect(profile.languageTest.verificationStatus).toBe('not_verified');
 await page.reload();await page.locator('#workspace-overview a[href="#profile-mount"]').click();await page.locator('#documents > fieldset > button').first().click();await expect.poll(async()=>page.locator('#documents > fieldset select option').count(),{timeout:20000}).toBeGreaterThanOrEqual(1);await page.locator('#documents > fieldset > button').nth(1).click();await expect(page.locator('.document-source')).toContainText('SYNTHETIC TEST ONLY');
 await page.locator('#documents > div > button').click();await expect(page.locator('.document-source')).toHaveCount(0);expect(documents.list(uid)).toHaveLength(0);expect(documents.profile(uid)).toEqual({});
 // A GPA correction must support changing BOTH the score and its scale.
 const secondForm=page.locator('#documents > form');await secondForm.locator('input[type=checkbox]').check();
 await secondForm.locator('.document-paste summary').click();await secondForm.locator('textarea').fill('SYNTHETIC TEST ONLY\nGPA: 3.4/4');await expect(secondForm.locator('input[type=file]')).toBeDisabled();await secondForm.locator('button').click();
 await expect(page.locator('.document-claim')).toHaveCount(1);await page.locator('.document-claim select').selectOption('correct');
 await page.locator('.document-claim input').nth(1).fill('5');await page.locator('.document-claim input').nth(0).fill('4.5');
 expect(await page.locator('.document-claim input').nth(0).evaluate(el=>el.validity.valid)).toBe(true);
 await page.locator('#documents > div > form button').click();await expect(page.locator('.document-claim')).toHaveCount(0);
 expect(documents.profile(uid).gpa.value).toEqual({gpa:4.5,scale:5});
 await page.locator('#documents > div > button').click();await expect(page.locator('.document-source')).toHaveCount(0);
 await secondForm.locator('.document-paste summary').click();await expect(secondForm.locator('textarea')).toBeDisabled();
 await secondForm.locator('input[type=file]').setInputFiles({name:'synthetic-conflict.txt',mimeType:'text/plain',buffer:Buffer.from('SYNTHETIC TEST ONLY\nDegree: bachelor\nDegree: master')});await secondForm.locator('button').click();
 await expect(page.locator('#documents > div > p')).toContainText({en:'Conflicting values',fa:'مقادیر متعارض',ps:'متضاد ارزښتونه'}[language]);
 await expect(page.locator('.document-claim')).toHaveCount(0);expect(documents.profile(uid)).toEqual({});
 await page.locator('#documents > div > button').click();await expect(page.locator('.document-source')).toHaveCount(0);
 // The server commits but the response is lost: never silently re-submit.
 const uploadsBeforeLoss=uploads;dropNextUpload=true;
 await secondForm.locator('.document-paste summary').click();await secondForm.locator('textarea').fill('SYNTHETIC LOST RESPONSE TEST ONLY\nDegree: bachelor');await secondForm.locator('button').click();
 await expect(status).toContainText({en:'Your change may already be saved',fa:'ممکن است تغییر شما ذخیره شده باشد',ps:'ښايي بدلون خوندي شوی وي'}[language]);
 expect(documents.list(uid)).toHaveLength(1);expect(uploads).toBe(uploadsBeforeLoss+1);
 await page.locator('#documents > fieldset > button').first().click();await expect.poll(async()=>page.locator('#documents > fieldset select option').count(),{timeout:20000}).toBeGreaterThanOrEqual(1);await page.locator('#documents > fieldset > button').nth(1).click();await expect(page.locator('.document-source')).toContainText('SYNTHETIC LOST RESPONSE TEST ONLY');
 expect(uploads).toBe(uploadsBeforeLoss+1);
 await page.locator('#documents > div > button').click();await expect(page.locator('.document-source')).toHaveCount(0);
 for(const code of [401,409,429,503]){statusOverride=code;await page.locator('#documents > fieldset > button').first().click();await expect(status).not.toBeEmpty();}
 statusOverride=null;
 await page.locator('#documents .document-format summary').click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 const axe=await new AxeBuilder({page}).include('#documents').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations.map(x=>x.id)).toEqual([]);
 await page.screenshot({path:`verification/artifacts/${language}-document-review.png`,fullPage:true});
 console.log(`${language}: invalid files blocked before network; explicit correction/rejection/acceptance, provenance, reload, deletion, duplicate guard, errors and axe passed; no inference`);await context.close();
}}finally{await browser.close();await vite.close();await new Promise(resolve=>api.close(resolve));documents.close();rmSync(dir,{recursive:true,force:true});}
