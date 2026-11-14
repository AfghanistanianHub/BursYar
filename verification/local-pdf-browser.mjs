// Synthetic browser fixture: actual PDF.js, no auth, API, models or external network.
import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
import {textPdf} from './fixtures/text-pdf.mjs';

const vite=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:0}});await vite.listen();
const origin='http://127.0.0.1:'+vite.httpServer.address().port;
let browser;const external=[];
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin!==origin){external.push(url.origin);return route.abort();}
  return route.continue();
 });
 await page.route(origin+'/pdf-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic local PDF test</title>'}));
 await page.goto(origin+'/pdf-fixture');
 const extract=(bytes,name,language)=>page.evaluate(async({bytes,name,language})=>{
  const {extractDocumentText}=await import('/src/document-extraction.js');
  try{return await extractDocumentText(new File([new Uint8Array(bytes)],name,{type:'application/pdf'}),{ocrLanguage:language});}
  catch(error){return {error:error.code};}
 },{bytes:[...bytes],name,language});
 const fixture=textPdf([['SYNTHETIC FIXTURE ONLY','Degree: bachelor','GPA: 3.4/4']]);
 for(const [language,name] of [['eng','sample.pdf'],['fas','نمونه.pdf'],['pus','بېلګه.pdf']]){
  const result=await extract(fixture,name,language);
  assert.equal(result.method,'local_pdf_text_or_ocr');
  assert.match(result.text,/Degree: bachelor/);assert.match(result.text,/GPA: 3.4\/4/);
  console.log('PASS local text PDF '+language);
 }
 assert.equal((await extract(textPdf(Array.from({length:6},()=>['Synthetic'])), 'pages.pdf','eng')).error,'pdfPageLimit');
 assert.equal((await extract(Buffer.from('not PDF'),'invalid.pdf','eng')).error,'invalidPdf');
 const overBudget = textPdf([Array.from({length:1400}, () => 'Repeated synthetic data ')], {compressed:true});
 assert.ok(overBudget.length < 4000);
 for(let i=0;i<3;i++){
  assert.equal((await extract(overBudget,'compressed.pdf','eng')).error,'extractedTextTooLarge');
  assert.equal((await extract(fixture,'retry.pdf','eng')).method,'local_pdf_text_or_ocr');
 }
 const oversized=await page.evaluate(async()=>{
  const {extractDocumentText}=await import('/src/document-extraction.js');
  const file=new File([new Uint8Array(5*1024*1024+1)],'large.pdf');
  file.arrayBuffer=()=>{throw Error('oversized input must not be read');};
  try{await extractDocumentText(file);}catch(error){return error.code;}
 });
 assert.equal(oversized,'fileTooLarge');
 console.log('PASS compressed PDF text budget, three successful retries, and oversized file preflight');
 assert.deepEqual(external,[]);
 console.log('PASS page/signature limits; zero external requests');
}finally{await browser?.close();await vite.close();}
