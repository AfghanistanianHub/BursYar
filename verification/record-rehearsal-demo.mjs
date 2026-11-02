// Records illustrative authenticated flows against a LOCAL mocked stack for the
// Mission 09 demo video. Identity, provider and documents are fixtures; the UI
// is the real application. Every frame carries a REHEARSAL banner and the final
// cut must label these scenes as simulated services. No live Meta, no uploads
// beyond the local temp database, no real credentials.
// Run: node verification/record-rehearsal-demo.mjs
// Output: verification/artifacts/m09/06-analysis.webm, 07-documents.webm
import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {mkdirSync, renameSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';
import {createScholarshipCatalog} from '../engine/deterministic.js';
import {createSourceFetcher} from '../engine/source-fetch.js';
import {normalizeEvidence} from '../engine/evidence.js';
const OUT = 'verification/artifacts/m09';
mkdirSync(OUT, {recursive: true});
const vite = await createServer({root: process.cwd(), server: {host: '127.0.0.1', port: 0}});
await vite.listen();
const baseUrl = `http://127.0.0.1:${vite.httpServer.address().port}`;
const documentDir = mkdtempSync(join(tmpdir(), 'bursyar-rehearsal-docs-'));
const documents = new DocumentStore(join(documentDir, 'docs.db'));
const sources = createSourceFetcher({resolve: async () => [{address: '93.184.216.34', family: 4}], transport: async () => ({body: '<main><h1>REHEARSAL SOURCE FIXTURE</h1><p>Applicants must provide academic transcripts.</p><p>Tuition fees are covered.</p></main>'})});
const api = createInferenceServer({catalog: createScholarshipCatalog([]), sources, projectId: 'demo-bursyar', origin: baseUrl, documents, quota: {reserve() {}}, infer: async () => { throw Error('rehearsal uses the mocked route, never the adapter'); }, verify: async token => ({uid: token, aud: 'demo-bursyar', iss: 'https://securetoken.google.com/demo-bursyar', bursyarDemo: true})});
await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
const apiUrl = `http://127.0.0.1:${api.address().port}`;
const evidence = normalizeEvidence(JSON.stringify({criteria: [{kind: 'transcripts', required: true, excerpt: 'Applicants must provide academic transcripts.', en: 'Provide transcripts.', fa: 'REHEARSAL-DRAFT: اسناد تحصیلی ارائه کنید.', ps: 'REHEARSAL-DRAFT: تحصیلي اسناد وړاندې کړئ.'}, {kind: 'language_test', required: true, excerpt: 'Tuition fees are covered.', en: 'Confirm funding coverage.', fa: 'REHEARSAL-DRAFT: پوشش مالی را تأیید کنید.', ps: 'REHEARSAL-DRAFT: مالي پوښښ تایید کړئ.'}], funding: ['Tuition fees are covered.'], deadline: null}), {text: 'Applicants must provide academic transcripts. Tuition fees are covered.', sourceUrl: 'https://university.example/award'});
const browser = await chromium.launch({headless: true, args: ['--no-sandbox']});
async function scene(name, fn) {
  console.log('scene:', name);
  const context = await browser.newContext({viewport: {width: 1920, height: 1080}, recordVideo: {dir: OUT, size: {width: 1920, height: 1080}}});
  const page = await context.newPage();
  await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
    const note = document.createElement('p');
    note.textContent = 'REHEARSAL — SIMULATED SERVICES · mocked identity and Meta; synthetic data only';
    note.setAttribute('role', 'note');
    note.style.cssText = 'padding:12px;background:#fff;color:#111;border:2px solid #111;position:sticky;top:0;z-index:60';
    document.body.prepend(note);
  }, {once: true}));
  const token = 'rehearsal-token';
  await page.route('**/src/auth.js', route => route.fulfill({contentType: 'text/javascript', body: `export async function signIn(){};export async function signOut(){};export async function onAuthChange(){return ()=>{};} export async function getInferenceToken(){return "${token}";}`}));
  await page.route(/\/api\/(documents|profile|source|scholarships|evaluate|family)/, async route => {
    const request = route.request();
    const response = await fetch(apiUrl + new URL(request.url()).pathname, {method: request.method(), headers: {authorization: request.headers().authorization, origin: baseUrl, 'content-type': 'application/json'}, ...(['POST', 'PUT'].includes(request.method()) ? {body: request.postData()} : {})});
    await route.fulfill({status: response.status, contentType: 'application/json', body: await response.text()});
  });
  await page.route('**/api/analyze', async route => {
    const body = route.request().postDataJSON();
    await new Promise(resolve => setTimeout(resolve, 1200));
    const clean = evidence.criteria.map(({kind, required, excerpt, en, fa, ps}) => ({kind, required, excerpt, en, fa, ps}));
    await route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({...normalizeEvidence(JSON.stringify({criteria: clean, deadline: evidence.deadline, funding: evidence.funding}), {text: body.text, sourceUrl: body.sourceUrl}), sourceProvenance: body.receipt ?? {kind: 'user_pasted_text'}})});
  });
  await page.goto(baseUrl);
  await page.locator('#workspace-overview').waitFor({timeout: 30000});
  await fn(page);
  await page.waitForTimeout(1200);
  const path = await page.video().path();
  await context.close();
  renameSync(path, `${OUT}/${name}.webm`);
}
await scene('06-analysis', async page => {
  await page.locator('#assistant').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.locator('#source-url').fill('https://university.example/award');
  await page.waitForTimeout(800);
  await page.locator('#manual-source').click();
  await page.locator('#requirements').fill('Applicants must provide academic transcripts. Tuition fees are covered.');
  await page.waitForTimeout(1200);
  await page.locator('#source-approved').check();
  await page.waitForTimeout(800);
  await page.locator('#analyze-form button[type=submit]').click();
  await page.locator('.criterion').first().waitFor({timeout: 15000});
  await page.locator('#requirements-step').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  await page.locator('[name=transcripts]').selectOption('unavailable');
  await page.locator('#barrier-guidance').scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);
});
await scene('07-documents', async page => {
  await page.locator('.workspace').evaluate(el => { el.open = true; });
  await page.locator('#documents-mount').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.locator('.document-paste summary').click();
  await page.locator('#documents textarea').fill('SYNTHETIC DEMONSTRATION ONLY - NOT A REAL CERTIFICATE\nDegree: bachelor\nGPA: 3.4/4');
  await page.locator('#documents form input[type=checkbox]').first().check();
  await page.waitForTimeout(800);
  await page.locator('#documents > form button').click();
  await page.locator('.document-claim').first().waitFor({timeout: 15000});
  await page.waitForTimeout(3000);
  const choices = page.locator('.document-claim select');
  await choices.nth(0).selectOption('reject');
  if (await choices.count() > 1) await choices.nth(1).selectOption('accept');
  await page.waitForTimeout(1500);
  await page.locator('#documents > div > form button').click();
  await page.waitForTimeout(2500);
});
await scene('08-source', async page => {
  await page.locator('#assistant').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.locator('#source-url').fill('https://university.example/award');
  await page.waitForTimeout(800);
  await page.locator('#fetch-source').click();
  await page.locator('#source-approved').waitFor({timeout: 15000});
  await page.locator('#source-entry').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  await page.locator('#source-approved').check();
  await page.waitForTimeout(2500);
});
await browser.close();
await vite.close();
await new Promise(resolve => api.close(resolve));
documents.close();
rmSync(documentDir, {recursive: true, force: true});
console.log('saved to', OUT);
