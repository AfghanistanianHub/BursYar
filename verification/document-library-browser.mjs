// Regression for Issue #91: the private document library must populate on page
// load and survive reload without a manual refresh click. Hermetic and fast:
// TXT-only uploads through the real local engine API; identity is mocked,
// never live Meta. No inference, no CDN, no OCR.
// Run: node verification/document-library-browser.mjs
import {chromium, expect} from '@playwright/test';
import {createServer} from 'vite';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';

const vite = await createServer({server: {host: '127.0.0.1', port: 0}});
await vite.listen();
const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
const dir = mkdtempSync(join(tmpdir(), 'bursyar-doc-library-'));
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
const mockIdentity = (page, uid) => page.route('**/src/auth.js', route => route.fulfill({
  contentType: 'text/javascript',
  body: `export async function signIn(){};export async function signOut(){};export async function onAuthChange(){return ()=>{};} export async function getInferenceToken(){return "${uid}";}`
}));
const proxyApi = page => page.route('**/api/**', async route => {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  if (path === '/api/analyze') throw Error('Inference forbidden in library test');
  const response = await fetch(apiBase + path, {
    method: request.method(),
    headers: {authorization: request.headers().authorization, origin, 'content-type': 'application/json'},
    ...(['POST', 'PUT'].includes(request.method()) ? {body: request.postData()} : {})
  });
  await route.fulfill({status: response.status, contentType: 'application/json', body: await response.text()});
});
try {
  const userA = 'library-user-a';
  const context = await browser.newContext({viewport: {width: 1280, height: 900}});
  const page = await context.newPage();
  const externalPosts = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== origin && url.origin !== apiBase && request.method() !== 'GET') externalPosts.push(request.method() + ' ' + url.origin);
  });
  await mockIdentity(page, userA);
  await proxyApi(page);
  await page.goto(origin);
  await page.locator('#workspace-overview a[href="#profile-mount"]').click();
  const form = page.locator('#documents > form');
  const librarySelect = page.locator('#documents > fieldset select');
  const refreshButton = page.locator('#documents > fieldset > button').first();
  const openButton = page.locator('#documents > fieldset > button').nth(1);
  await form.locator('input[type=checkbox]').check();

  // Two saved records through the real upload path (TXT saves directly).
  await form.locator('input[type=file]').setInputFiles({name: 'one.txt', mimeType: 'text/plain', buffer: Buffer.from('SYNTHETIC LIBRARY DOC ONE\nDegree: bachelor')});
  await form.locator('button[type=submit]').click();
  await expect(page.locator('.document-source')).toContainText('SYNTHETIC LIBRARY DOC ONE', {timeout: 20000});
  await form.locator('input[type=file]').setInputFiles({name: 'two.txt', mimeType: 'text/plain', buffer: Buffer.from('SYNTHETIC LIBRARY DOC TWO\nGPA: 3.4/4')});
  await form.locator('button[type=submit]').click();
  await expect(page.locator('.document-source')).toContainText('SYNTHETIC LIBRARY DOC TWO', {timeout: 20000});
  check('LIB-SAVED', documents.list(userA).length === 2, `records=${documents.list(userA).length}`);
  const [firstId, secondId] = documents.list(userA).map(r => r.id);

  // Reload: the library must populate on mount with NO manual refresh click.
  await page.reload();
  await page.locator('#workspace-overview a[href="#profile-mount"]').click();
  let autoloaded = false;
  try {
    await expect.poll(async () => librarySelect.locator('option').count(), {timeout: 20000}).toBe(2);
    autoloaded = true;
  } catch {
    autoloaded = false;
  }
  const autoCount = await librarySelect.locator('option').count();
  check('LIB-RELOAD-AUTOLOAD', autoloaded && autoCount === 2, `${autoCount} options without manual refresh`);
  const values = await librarySelect.locator('option').evaluateAll(els => els.map(el => el.value));
  check('LIB-LIST-POPULATION', values.length === 2 && values.every(v => /^[a-f0-9-]{36}$/.test(v)), values.join(',') || 'no options');
  check('LIB-OPEN-ENABLED', await openButton.isEnabled(), 'open enabled with records');

  // Record selection: open each record by its listed id and read it back.
  // Guarded so an empty library reports FAIL lines (and a nonzero exit)
  // instead of aborting the remaining checks with an uncaught TimeoutError.
  const selectable = values.length === 2 && values.every(v => /^[a-f0-9-]{36}$/.test(v));
  if (selectable) {
    await librarySelect.selectOption(firstId);
    await openButton.click();
    await expect(page.locator('.document-source')).toContainText('SYNTHETIC LIBRARY DOC ONE', {timeout: 20000});
    check('LIB-SELECT-FIRST', true, 'first record opens by id');
    await librarySelect.selectOption(secondId);
    await openButton.click();
    await expect(page.locator('.document-source')).toContainText('SYNTHETIC LIBRARY DOC TWO', {timeout: 20000});
    check('LIB-SELECT-SECOND', true, 'second record opens by id');
  } else {
    check('LIB-SELECT-FIRST', false, 'library empty after reload');
    check('LIB-SELECT-SECOND', false, 'library empty after reload');
  }

  // Manual refresh still works and keeps both records (deterministic wait).
  await refreshButton.click();
  await expect.poll(async () => librarySelect.locator('option').count(), {timeout: 20000}).toBe(2);
  check('LIB-MANUAL-REFRESH', (await librarySelect.locator('option').count()) === 2, 'refresh keeps 2 records');

  // Owner isolation: a second user sees an empty library and cannot read A's ids.
  const contextB = await browser.newContext({viewport: {width: 1280, height: 900}});
  const pageB = await contextB.newPage();
  const userB = 'library-user-b';
  await mockIdentity(pageB, userB);
  await proxyApi(pageB);
  await pageB.goto(origin);
  await pageB.locator('#workspace-overview a[href="#profile-mount"]').click();
  const libraryB = pageB.locator('#documents > fieldset select');
  let bLoaded = false;
  try {
    await expect.poll(async () => libraryB.locator('option').count(), {timeout: 20000}).toBe(1);
    bLoaded = true;
  } catch {
    bLoaded = false;
  }
  check('LIB-ISOLATION-LOADED', bLoaded, bLoaded ? 'second user library settled' : 'second user library never populated');
  const bValues = await libraryB.locator('option').evaluateAll(els => els.map(el => el.value));
  const bText = await libraryB.locator('option').allTextContents();
  check('LIB-ISOLATION-EMPTY', bValues.length === 1 && bValues[0] === '', JSON.stringify(bText[0] ?? ''));
  check('LIB-ISOLATION-OPEN-DISABLED', await pageB.locator('#documents > fieldset > button').nth(1).isDisabled(), 'open disabled when empty');
  const directStatus = await pageB.evaluate(async id => {
    const res = await fetch('/api/documents/' + id, {headers: {authorization: 'Bearer library-user-b'}});
    return res.status;
  }, firstId);
  check('LIB-ISOLATION-DIRECT-GET', directStatus === 404, `status=${directStatus}`);
  check('LIB-ISOLATION-ENGINE', documents.list(userB).length === 0 && documents.list(userA).length === 2, 'engine lists stay per-owner');
  await contextB.close();

  // Deletion: review one record, then delete it; library, engine and profile agree.
  await librarySelect.selectOption(firstId);
  await openButton.click();
  // Both records render exactly one claim, so a bare count cannot tell stale
  // content from the freshly opened record: pin the record identity first.
  await expect(page.locator('.document-source')).toContainText('SYNTHETIC LIBRARY DOC ONE', {timeout: 20000});
  await expect(page.locator('.document-claim')).toHaveCount(1, {timeout: 20000});
  await page.locator('.document-claim select').selectOption('accept');
  await expect(page.locator('.document-claim select')).toHaveValue('accept');
  await page.locator('#documents > div > form button').click();
  await expect(page.locator('.document-claim')).toHaveCount(0, {timeout: 20000});
  check('LIB-REVIEWED-PROFILE', documents.profile(userA).degree?.value === 'bachelor', 'profile holds reviewed fact');
  await page.locator('#documents > div > button').click();
  await expect(page.locator('.document-source')).toHaveCount(0, {timeout: 20000});
  await expect.poll(async () => librarySelect.locator('option').count(), {timeout: 20000}).toBe(1);
  const remaining = await librarySelect.locator('option').evaluateAll(els => els.map(el => el.value));
  check('LIB-DELETE-LIBRARY', remaining.length === 1 && remaining[0] === secondId, remaining.join(',') || 'empty');
  check('LIB-DELETE-ENGINE', documents.list(userA).length === 1 && documents.profile(userA).degree === undefined, 'engine list and profile cleared');
  let getDeletedStatus = null;
  try { documents.get(userA, firstId); } catch (e) { getDeletedStatus = e.status; }
  check('LIB-DELETE-GONE', getDeletedStatus === 404, `status=${getDeletedStatus}`);

  check('LIB-PRIVACY-NO-EXFIL', externalPosts.length === 0, externalPosts.join(';') || 'no off-origin writes');
  await context.close();
} finally {
  await browser?.close();
  await vite.close();
  await new Promise(resolve => api.close(resolve));
  documents.close();
  rmSync(dir, {recursive: true, force: true});
}
if (failures) { console.error(`LIBRARY REGRESSION FAILURES: ${failures}`); process.exit(1); }
console.log('LIBRARY REGRESSION PASSED');
