// Synthetic browser fixture: actual PDF.js, no auth, API, models or external network.
import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
function textPdf(linesPerPage) {
  const offsets = [];
  let body = '%PDF-1.4\n';
  const push = (s) => { offsets.push(body.length); body += s; };
  const n = linesPerPage.length;
  const fontId = 3 + n * 2;
  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  push('2 0 obj\n<< /Type /Pages /Kids [' + linesPerPage.map((_, i) => `${3 + i * 2} 0 R`).join(' ') + `] /Count ${n} >>\nendobj\n`);
  const esc = s => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  for (let i = 0; i < n; i++) {
    const content = linesPerPage[i].map((t, j) => `BT /F1 14 Tf 72 ${720 - j * 24} Td (${esc(t)}) Tj ET`).join('\n');
    push(`${3 + i * 2} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${4 + i * 2} 0 R >>\nendobj\n`);
    push(`${4 + i * 2} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
  }
  push(`${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  const xref = body.length;
  body += `xref\n0 ${fontId + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= fontId; i++) body += `${String(offsets[i - 1]).padStart(10, '0')} 00000 n \n`;
  body += `trailer\n<< /Size ${fontId + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body, 'latin1');
}

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
 assert.deepEqual(external,[]);
 console.log('PASS page/signature limits; zero external requests');
}finally{await browser?.close();await vite.close();}
