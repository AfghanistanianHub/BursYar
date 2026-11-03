// Browser regression: synthetic OCR staging MUST NOT persist until reviewed text
// is explicitly confirmed. The extractor is mocked here; real OCR is separate.
import {chromium,expect} from '@playwright/test';
import {createServer} from 'vite';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';
const vite=await createServer({server:{host:'127.0.0.1',port:0}});await vite.listen();
const origin='http://127.0.0.1:'+vite.httpServer.address().port;
const dir=mkdtempSync(join(tmpdir(),'bursyar-ocr-review-'));
const documents=new DocumentStore(join(dir,'docs.db'));
const api=createInferenceServer({
 projectId:'demo-bursyar',origin,documents,
 quota:{reserve(){throw Error('No inference allowed');}},
 infer:async()=>{throw Error('No inference allowed');},
 verify:async token=>({uid:token,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true})
});
await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const language of ['en','fa','ps']){
  const context=await browser.newContext();
  const page=await context.newPage();const user='ocr-test-'+language;
  await page.addInitScript(lang=>localStorage.setItem('bursyar-language',lang),language);
  await page.route('**/src/auth.js',route=>route.fulfill({contentType:'text/javascript',body:'export async function signIn(){};export async function signOut(){};export async function onAuthChange(){return ()=>{}};export async function getInferenceToken(){return "'+user+'";}'}));
  await page.route('**/src/document-extraction.js',route=>route.fulfill({contentType:'text/javascript',body:"export async function extractDocumentText(){return {text:'Degree: bachelor',method:'local_image_ocr'}}"}));
  let writes=0;
  await page.route('**/api/**',async route=>{
   const request=route.request(),path=new URL(request.url()).pathname;
   if(request.method()==='POST'&&path==='/api/documents')writes++;
   const response=await fetch('http://127.0.0.1:'+api.address().port+path,{
    method:request.method(),
    headers:{authorization:request.headers().authorization,origin,'content-type':'application/json'},
    ...(['POST','PUT'].includes(request.method())?{body:request.postData()}: {})
   });
   await route.fulfill({status:response.status,contentType:'application/json',body:await response.text()});
  });
  await page.goto(origin);
  await page.locator('#workspace-overview a[href="#profile-mount"]').click();
  const form=page.locator('#documents > form');
  await form.locator('input[type=checkbox]').check();
  const file=form.locator('input[type=file]');
  await file.setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10,0,0])});
  await form.locator('button[type=submit]').click();
  const preview=page.locator('.document-extraction-preview');
  await expect(preview).toBeVisible();
  expect(writes).toBe(0);
  expect(documents.list(user)).toHaveLength(0);
  await preview.locator('button').nth(1).click();
  await expect(preview).toBeHidden();
  expect(writes).toBe(0);
  await form.locator('button[type=submit]').click();
  await expect(preview).toBeVisible();
  await preview.locator('textarea').fill('Degree: master');
  await preview.locator('button').first().click();
  await expect(page.locator('.document-source')).toContainText('Degree: master');
  expect(writes).toBe(1);
  expect(documents.list(user)).toHaveLength(1);
  assertNoProof(documents.get(user,documents.list(user)[0].id));
  await context.close();
 }
 console.log('PDF/image preview consent gate passed across en/fa/ps');
}finally{
 await browser?.close();
 await vite.close();
 await new Promise(resolve=>api.close(resolve));
 documents.close();rmSync(dir,{recursive:true,force:true});
}
function assertNoProof(record){if(record.authenticity!=='not_verified'||record.extractionMethod!=='local_image_ocr')throw Error('OCR promoted verification');}
