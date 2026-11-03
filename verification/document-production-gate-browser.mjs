// Issue #88: prove the PRODUCTION bundle (PROD=true) accepts TXT only and never
// imports unvetted PDF/OCR code. Serves dist/ (run `npm run build` first) with
// the real local engine API; identity is stubbed at the bundle boundary (the
// local build has no Firebase config, so the SDK branch is tree-shaken away),
// never live Meta.
// Run: npm run build && node verification/document-production-gate-browser.mjs
import {chromium, expect} from '@playwright/test';
import {createServer as createHttpServer} from 'node:http';
import {readFileSync, existsSync, mkdtempSync, rmSync} from 'node:fs';
import {extname} from 'node:path';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';

const dist = new URL('../dist/index.html', import.meta.url);
if (!existsSync(dist)) {
  console.error('FAIL PROD-DIST missing: run `npm run build` first');
  process.exit(1);
}
// Serve the same global response headers the deployment declares, so a
// future CSP is exercised here instead of breaking production untested.
const deployConfig = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const globalHeaders = Object.fromEntries(
  (deployConfig.headers ?? []).filter(h => h.source === '/(.*)').flatMap(h => h.headers ?? []).map(h => [h.key.toLowerCase(), h.value])
);
const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml'};
const root = new URL('../dist/', import.meta.url);
const staticServer = createHttpServer((req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    const file = new URL('.' + (path === '/' ? '/index.html' : path), root);
    const body = readFileSync(file);
    res.writeHead(200, {'content-type': types[extname(file.pathname)] ?? 'application/octet-stream', ...globalHeaders});
    res.end(body);
  } catch {
    res.writeHead(200, {'content-type': 'text/html'});
    res.end(readFileSync(dist));
  }
});
await new Promise(resolve => staticServer.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${staticServer.address().port}`;
const dir = mkdtempSync(join(tmpdir(), 'bursyar-prod-gate-'));
const documents = new DocumentStore(join(dir, 'docs.db'));
const api = createInferenceServer({
  projectId: 'demo-bursyar', origin, documents,
  quota: {reserve() { throw Error('Inference quota forbidden'); }},
  infer: async () => { throw Error('Inference forbidden'); },
  verify: async token => ({uid: token, aud: 'demo-bursyar', iss: 'https://securetoken.google.com/demo-bursyar', bursyarDemo: true})
});
await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
const apiBase = `http://127.0.0.1:${api.address().port}`;
const browser = await chromium.launch({headless: true});
const observed = [];
let failures = 0;
const check = (id, cond, detail) => {
  const line = `${cond ? 'PASS' : 'FAIL'} ${id} ${detail}`;
  observed.push(line);
  console.log(line);
  if (!cond) failures++;
};
try {
  const user = 'production-gate';
  const page = await (await browser.newContext({viewport: {width: 1280, height: 900}})).newPage();
  let writes = 0;
  const cdnRequests = [];
  const cspViolations = [];
  let tokenStubbed = false;
  await page.route('**/assets/*.js', async route => {
    const response = await route.fetch();
    let body = await response.text();
    // The local build has no Firebase config, so Vite tree-shook the SDK init
    // to an unconditional throw. Stub the session boundary with a synthetic
    // identity; fail loudly if the bundle shape changes instead of testing
    // an unstubbed (always-signed-out) app.
    const needle = 'throw Error("Firebase sign-in is not configured")';
    if (body.includes(needle)) {
      body = body.replace(needle, 'return{auth:{currentUser:{getIdToken:async()=>"production-gate"}},sdk:{}}');
      tokenStubbed = true;
    }
    await route.fulfill({status: response.status(), contentType: 'text/javascript', body});
  });
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/analyze') throw Error('Inference forbidden in production gate test');
    if (request.method() === 'POST' && path === '/api/documents') writes++;
    const response = await fetch(apiBase + path, {
      method: request.method(),
      headers: {authorization: request.headers().authorization, origin, 'content-type': 'application/json'},
      ...(['POST', 'PUT'].includes(request.method()) ? {body: request.postData()} : {})
    });
    await route.fulfill({status: response.status, contentType: 'application/json', body: await response.text()});
  });
  page.on('request', request => {
    const url = new URL(request.url());
    if (['cdn.jsdelivr.net', 'unpkg.com'].includes(url.hostname)) cdnRequests.push(request.method() + ' ' + url.pathname);
  });
  page.on('console', msg => {
    if (msg.type() === 'error' && /content security policy/i.test(msg.text())) cspViolations.push(msg.text());
  });
  await page.goto(origin);
  check('PROD-IDENTITY-STUBBED', tokenStubbed, 'synthetic identity installed at bundle boundary');
  await page.locator('#workspace-overview a[href="#profile-mount"]').click();
  const form = page.locator('#documents > form');
  const status = page.locator('#documents > [role=status]');
  check('PROD-NOTICE', await form.getByText('Production currently accepts TXT only').isVisible(), 'TXT-only notice shown');
  check('PROD-ACCEPT', (await form.locator('input[type=file]').getAttribute('accept')) === '.txt,text/plain', 'file picker limited to TXT');
  await form.locator('input[type=checkbox]').check();
  await form.locator('input[type=file]').setInputFiles({name: 'x.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 fake')});
  await form.locator('button[type=submit]').click();
  await expect(status).not.toBeEmpty({timeout: 20000});
  check('PROD-PDF-REJECTED', writes === 0 && (await page.locator('.document-source').count()) === 0, `writes=${writes}`);
  await form.locator('input[type=file]').setInputFiles({name: 'x.png', mimeType: 'image/png', buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0])});
  await form.locator('button[type=submit]').click();
  await expect(status).not.toBeEmpty({timeout: 20000});
  check('PROD-IMAGE-REJECTED', writes === 0 && (await page.locator('.document-source').count()) === 0, `writes=${writes}`);
  check('PROD-NO-CDN', cdnRequests.length === 0, cdnRequests.join(';') || 'zero vendor-code requests');
  await form.locator('input[type=file]').setInputFiles({name: 'ok.txt', mimeType: 'text/plain', buffer: Buffer.from('SYNTHETIC PROD TXT ONLY\nDegree: bachelor')});
  await form.locator('button[type=submit]').click();
  await expect(page.locator('.document-source')).toContainText('SYNTHETIC PROD TXT ONLY', {timeout: 20000});
  check('PROD-TXT-OK', writes === 1 && documents.list(user).length === 1, `writes=${writes}`);
  check('PROD-NO-CDN-AFTER-TXT', cdnRequests.length === 0, cdnRequests.join(';') || 'TXT path loads no vendor code');
  check('PROD-CSP-CLEAN', cspViolations.length === 0, cspViolations.join(';').slice(0, 200) || 'no boot CSP violations');
  await page.context().close();
} finally {
  await browser?.close().catch(() => {});
  await new Promise(resolve => staticServer.close(resolve));
  await new Promise(resolve => api.close(resolve));
  documents.close();
  rmSync(dir, {recursive: true, force: true});
}
if (failures) { console.error(`PRODUCTION GATE FAILURES: ${failures}`); process.exit(1); }
console.log('PRODUCTION GATE PASSED');
