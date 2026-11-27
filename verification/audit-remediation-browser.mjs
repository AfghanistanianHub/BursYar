// Browser gate for the audit remediation batches (BY-06, BY-13, BY-16, BY-22).
// It measures the rendered application, not the source: touch targets, headings,
// navigation destinations, the signed-out document panel, RTL and noscript.
// Usage: BASE_URL=http://127.0.0.1:3006 node verification/audit-remediation-browser.mjs
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {preview as previewServer} from 'vite';

const BASE=process.env.BASE_URL??'http://127.0.0.1:3006';
const require=createRequire(import.meta.url);
const axePath=require.resolve('axe-core/axe.min.js');
const artifacts=new URL('./artifacts/',import.meta.url).pathname;
mkdirSync(artifacts,{recursive:true});

const failures=[];
const check=(ok,message)=>{if(!ok)failures.push(message);return ok;};

async function measure(page,label){
 return page.evaluate(label=>{
  const interactive=[...document.querySelectorAll('a[href],button,select,summary,input:not([type=hidden]),textarea,[tabindex]:not([tabindex="-1"])')]
   .filter(el=>{const rect=el.getBoundingClientRect();const style=getComputedStyle(el);return rect.width>0&&rect.height>0&&style.visibility!=='hidden'&&style.display!=='none';});
  const small=interactive.filter(el=>{const r=el.getBoundingClientRect();return r.width<24||r.height<24;})
   .slice(0,25).map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName.toLowerCase(),text:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,40),w:Math.round(r.width),h:Math.round(r.height)};});
  const headings=[...document.querySelectorAll('h1')].map(h=>({text:h.textContent.trim().slice(0,60),hidden:!h.getClientRects().length}));
  const dupes={};
  for(const a of document.querySelectorAll('header nav a[href]'))dupes[a.getAttribute('href')]=(dupes[a.getAttribute('href')]??0)+1;
  return {
   label,
   interactive:interactive.length,
   targetsUnder24:small.length,
   small,
   h1:headings,
   duplicateNavTargets:Object.entries(dupes).filter(([,n])=>n>1),
   overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   height:document.documentElement.scrollHeight,
   dir:document.documentElement.dir,
   lang:document.documentElement.lang
  };
 },label);
}

// This gate measures the built application. Without an explicit BASE_URL it serves
// dist/ itself, so it runs from the release checklist and CI instead of needing a
// manually started server on port 3006.
let server;
if(!process.env.BASE_URL){
 try{server=await previewServer({preview:{host:'127.0.0.1',port:3006,strictPort:true}});}
 catch(error){throw Error('audit-remediation-browser needs a production build; run `npm run build` first ('+error.message+')');}
}
const browser=await chromium.launch();
try{
 // ---------- English, mobile and desktop ----------
 for(const [viewport,name] of [[{width:390,height:844},'mobile'],[{width:1440,height:900},'desktop']]){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto(BASE+'/',{waitUntil:'networkidle'});
  await page.evaluate(()=>{for(const details of document.querySelectorAll('details'))details.open=true;});
  await page.waitForTimeout(300);
  const result=await measure(page,`en-${name}`);
  await page.screenshot({path:`${artifacts}remediation-${name}.png`,fullPage:false});
  check(result.targetsUnder24===0,`${name}: ${result.targetsUnder24} targets under 24px ${JSON.stringify(result.small.slice(0,8))}`);
  check(result.duplicateNavTargets.length===0,`${name}: duplicate nav destinations ${JSON.stringify(result.duplicateNavTargets)}`);
  // One visible h1 per page: the dashboard's own h1 lives in a hidden route view
  // and is correctly absent from the accessibility tree until that route opens.
  const visibleH1=result.h1.filter(heading=>!heading.hidden);
  check(visibleH1.length===1,`${name}: expected one visible h1, found ${JSON.stringify(result.h1)}`);
  check(result.overflow<=0,`${name}: horizontal overflow ${result.overflow}px`);
  check(errors.length===0,`${name}: console errors ${JSON.stringify(errors.slice(0,3))}`);

  // Accessible-name and ARIA scan on the expanded page.
  await page.addScriptTag({path:axePath});
  const axe=await page.evaluate(async()=>await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
  const serious=axe.violations.filter(v=>['serious','critical'].includes(v.impact));
  check(serious.length===0,`${name}: axe serious/critical ${JSON.stringify(serious.map(v=>v.id))}`);

  // Signed-out document panel must offer a sign-in action before any upload.
  await page.goto(BASE+'/#documents-mount',{waitUntil:'networkidle'});
  await page.waitForTimeout(600);
  const panel=await page.evaluate(()=>{
   const root=document.querySelector('#documents-mount');
   const action=root?.querySelector('.sign-in-action');
   const upload=[...(root?.querySelectorAll('button[type=submit]')??[])][0];
   const file=root?.querySelector('input[type=file]');
   return {hasAction:!!action,actionText:action?.textContent.trim().slice(0,80)??'',uploadDisabled:upload?upload.disabled:null,fileDisabled:file?file.disabled:null};
  });
  check(panel.hasAction,`${name}: signed-out documents panel has no sign-in action`);
  check(panel.uploadDisabled===true,`${name}: signed-out upload is not disabled (${JSON.stringify(panel)})`);
  await page.screenshot({path:`${artifacts}remediation-documents-${name}.png`});
  await context.close();
 }

 // ---------- Farsi RTL ----------
 {
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.goto(BASE+'/',{waitUntil:'networkidle'});
  await page.selectOption('select#language, select[name=language], header select',{index:1}).catch(()=>{});
  await page.evaluate(()=>{localStorage.setItem('bursyar-language','fa');});
  await page.reload({waitUntil:'networkidle'});
  await page.evaluate(()=>{for(const details of document.querySelectorAll('details'))details.open=true;});
  await page.waitForTimeout(300);
  const result=await measure(page,'fa-mobile');
  await page.screenshot({path:`${artifacts}remediation-fa-mobile.png`});
  check(result.dir==='rtl',`fa: dir is ${result.dir}`);
  check(result.targetsUnder24===0,`fa: ${result.targetsUnder24} targets under 24px`);
  check(result.overflow<=0,`fa: horizontal overflow ${result.overflow}px`);
  await context.close();
 }

 // ---------- JavaScript disabled ----------
 {
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  const text=await page.evaluate(()=>document.body.innerText.replace(/\s+/g,' ').trim());
  check(/needs JavaScript/i.test(text),`noscript: no visible fallback (${text.slice(0,80)})`);
  await page.screenshot({path:`${artifacts}remediation-noscript.png`});
  await context.close();
 }
}finally{await browser.close();await server?.close();}

if(failures.length){
 console.error(JSON.stringify({event:'audit_remediation_browser',passed:false,failures},null,2));
 process.exit(1);
}
console.log(JSON.stringify({event:'audit_remediation_browser',passed:true,base:BASE}));
