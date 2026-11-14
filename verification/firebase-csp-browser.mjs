// VITE_FIREBASE_API_KEY=synthetic-key VITE_FIREBASE_PROJECT_ID=synthetic-bursyar \
// VITE_FIREBASE_AUTH_DOMAIN=synthetic-bursyar.firebaseapp.com npm run build -- --outDir dist-firebase-csp
// node verification/firebase-csp-browser.mjs
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {chromium, expect} from '@playwright/test';

const root=new URL('../dist-firebase-csp/',import.meta.url);
const {headers}=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
const policy=headers.find(entry=>entry.source==='/(.*)').headers.find(header=>header.key==='Content-Security-Policy').value;
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  const file=new URL('.'+(path==='/'?'/index.html':path),root);
  const body=await readFile(file);
  res.writeHead(200,{'Content-Type':types[path.slice(path.lastIndexOf('.'))]??(path==='/'?'text/html':'application/octet-stream'),'Content-Security-Policy':policy});
  res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch();
 const context=await browser.newContext();
 const blocked=[];
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin===origin)return route.continue();
  if(url.origin==='https://apis.google.com'&&url.pathname==='/js/api.js'){
   const callback=JSON.stringify(url.searchParams.get('onload'));
   return route.fulfill({contentType:'text/javascript',body:`
    window.gapi={load(name,options){options.callback()},iframes:{
     getContext(){return {open(options,ready){
      const frame=document.createElement('iframe');
      frame.src=options.url;
      return new Promise((resolve,reject)=>{
       frame.addEventListener('load',()=>ready({
        restyle:async()=>{},ping:async()=>{},register(){},send(){}
       }).then(resolve,reject));
       document.body.append(frame);
      });
     }}}
    }};
    window[${callback}]();
   `});
  }
  if(url.origin==='https://synthetic-bursyar.firebaseapp.com'&&url.pathname==='/__/auth/iframe'){
   return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic Firebase iframe</title>'});
  }
  if(url.origin==='https://synthetic-bursyar.firebaseapp.com'&&url.pathname==='/__/auth/handler'){
   return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic OAuth popup</title>'});
  }
  if(url.origin==='https://identitytoolkit.googleapis.com'&&url.pathname==='/v1/projects'){
   return route.fulfill({json:{authorizedDomains:['127.0.0.1']},headers:{'access-control-allow-origin':origin}});
  }
  blocked.push(url.origin+url.pathname);
  return route.abort();
 });
 const page=await context.newPage();
 await page.addInitScript(()=>{
  window.syntheticCspViolations=[];
  document.addEventListener('securitypolicyviolation',event=>window.syntheticCspViolations.push(event.effectiveDirective));
 });
 await page.goto(origin);
 const iframe=page.waitForResponse(response=>response.url().includes('/__/auth/iframe')&&response.ok());
 const popup=page.waitForEvent('popup');
 const authProject=page.waitForResponse(response=>response.url().startsWith('https://identitytoolkit.googleapis.com/v1/projects')&&response.ok());
 await page.locator('details:has(#account-controls) > summary').last().click({timeout:3000});
 await page.getByRole('button',{name:'Sign in with Google (approved demo accounts)'}).click();
 await iframe;
 const signIn=await popup;
 await expect(signIn).toHaveTitle('Synthetic OAuth popup');
 await authProject;
 assert.deepEqual(await page.evaluate(()=>window.syntheticCspViolations),[]);
 assert.deepEqual(blocked,[]);
 console.log('PASS Firebase SDK loads the sign-in script, helper iframe, project endpoint and popup under CSP with synthetic responses.');
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
