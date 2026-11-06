// Synthetic text only: hold credential retrieval to exercise withdrawal before POST.
import {chromium,expect} from '@playwright/test';
import {createServer} from 'vite';
const vite=await createServer({server:{host:'127.0.0.1',port:0}});await vite.listen();
const origin='http://127.0.0.1:'+vite.httpServer.address().port;let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const language of ['en','fa','ps']){
  const context=await browser.newContext(),page=await context.newPage();let writes=0;
  await context.route('**/*',r=>new URL(r.request().url()).origin!==origin?r.abort():r.continue());
  await page.route('**/src/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export async function getInferenceToken(){if(globalThis.holdToken)await new Promise(r=>{globalThis.releaseToken=r;});return 'synthetic-consent';}`}));
  await page.route('**/api/**',r=>{if(r.request().method()==='POST')writes++;return r.fulfill({contentType:'application/json',body:'[]'});});
  await page.route(origin+'/fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body><div id="mount"></div></body></html>'}));
  await page.goto(origin+'/fixture');
  await page.evaluate(async language=>{(await import('/src/documents.js')).mountDocuments(document.querySelector('#mount'),language);},language);
  await expect(page.locator('#documents')).not.toHaveAttribute('aria-busy','true');
  await page.locator('#documents input[type=file]').setInputFiles({name:'synthetic.txt',mimeType:'text/plain',buffer:Buffer.from('SYNTHETIC ONLY\nDegree: bachelor')});
  await page.locator('#documents > form input[type=checkbox]').check();
  await page.evaluate(()=>{globalThis.holdToken=true;});
  await page.locator('#documents > form button[type=submit]').click();
  await expect.poll(()=>page.evaluate(()=>typeof globalThis.releaseToken)).toBe('function');
  await page.locator('#documents > form input[type=checkbox]').uncheck();
  // Rechecking does not renew the consent of an already invalidated save.
  await page.locator('#documents > form input[type=checkbox]').check();
  await page.evaluate(()=>{globalThis.holdToken=false;globalThis.releaseToken();});
  await expect(page.locator('#documents')).not.toHaveAttribute('aria-busy','true');
  expect(writes).toBe(0);console.log(`PASS ${language}: withdrawal while token pending prevents document POST even after recheck`);await context.close();
 }
}finally{await browser?.close();await vite.close();}
