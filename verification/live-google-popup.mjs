// Exercise the real OAuth start without signing in or touching account data.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from '@playwright/test';
import {preview} from 'vite';

const live = 'https://bursyar.vercel.app';
const projectId = 'afghanistanian-scholarships';
const authDomain = projectId + '.firebaseapp.com';
async function readPublicAsset(url) {
 const response = await fetch(url, {signal: AbortSignal.timeout(15000)});
 assert.ok(response.ok, 'Public frontend asset could not be loaded');
 return response.text();
}
const html = await readPublicAsset(live);
const entry = html.match(/<script\b[^>]*\bsrc="(\/assets\/[^"]+\.js)"/)?.[1];
assert.ok(entry, 'Public frontend entry not found');
const bundle = await readPublicAsset(live + entry);
const apiKey = bundle.match(/AIza[\w-]{35}/)?.[0];
assert.ok(apiKey && bundle.includes(authDomain), 'Public Firebase web configuration not found');

const outDir = mkdtempSync(join(tmpdir(), 'bursyar-live-google-'));
let site, browser;
try {
 execFileSync('npm',['run','build','--','--outDir',outDir],{
  env:{...process.env,VITE_FIREBASE_API_KEY:apiKey,VITE_FIREBASE_PROJECT_ID:projectId,VITE_FIREBASE_AUTH_DOMAIN:authDomain},
  stdio:['ignore','ignore','ignore']
 });
 const routes = JSON.parse(readFileSync('vercel.json','utf8')).headers;
 const csp = routes.flatMap(route=>route.headers).find(header=>header.key==='Content-Security-Policy').value;
 site = await preview({
  configFile:false,build:{outDir},
  preview:{host:'localhost',port:0,headers:{'Content-Security-Policy':csp}}
 });
 browser = await chromium.launch();
 const page = await browser.newPage();
 await page.goto('http://localhost:'+site.httpServer.address().port);
 await page.locator('.site .account summary').click({timeout:10000});
 const [popup] = await Promise.all([
  page.waitForEvent('popup',{timeout:25000}),
  page.getByRole('button',{name:/Sign in with Google/}).click({timeout:10000})
 ]);
 await popup.waitForURL(url=>url.hostname==='accounts.google.com',{timeout:25000}).catch(()=>{
  throw Error('Google sign-in popup did not reach accounts.google.com');
 });
 console.log('PASS: the built candidate opened Google sign-in. No account authenticated.');
} finally {
 await browser?.close();
 if(site) await new Promise(resolve=>site.httpServer.close(resolve));
 rmSync(outDir,{recursive:true,force:true});
}
