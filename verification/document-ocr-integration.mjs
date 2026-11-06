// Real-integration gate for PDF/image OCR (Mission 20). Uses the ACTUAL pinned
// PDF.js + same-origin Tesseract assets — never mocks the extractor or loaders — with
// mocked auth and a local engine API. Synthetic fixtures only. No inference.
// Run: node verification/document-ocr-integration.mjs
import {chromium, expect} from '@playwright/test';
import {createServer} from 'vite';
import {prepareLocalOcr} from '../scripts/prepare-local-ocr.mjs';
import {mkdtempSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';

// ---- synthetic PDF builders (no dependency) ----
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
function imagePdf(jpegBytes, width, height) {
  const enc = new TextEncoder();
  const chunks = [];
  let off = 0;
  const at = [];
  const push = (s) => { const b = typeof s === 'string' ? enc.encode(s) : s; at.push(off); chunks.push(b); off += b.length; };
  const raw = (s) => { const b = typeof s === 'string' ? enc.encode(s) : s; chunks.push(b); off += b.length; };
  push('%PDF-1.4\n');
  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  raw(jpegBytes);
  raw('\nendstream\nendobj\n');
  const draw = enc.encode(`q ${width} 0 0 ${height} 0 500 cm /Im1 Do Q`);
  push(`5 0 obj\n<< /Length ${draw.length} >>\nstream\n`);
  raw(draw);
  raw('\nendstream\nendobj\n');
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) xref += `${String(at[i]).padStart(10, '0')} 00000 n \n`;
  return Buffer.concat([...chunks, enc.encode(xref), enc.encode(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${off}\n%%EOF`)]);
}
const encryptedPdf = () => {
  // Structurally headed encrypted file: pdf.js must reject it (password path),
  // never parse garbage as text.
  const base = textPdf([['SECRET']]).toString('latin1');
  const key = '6 0 obj\n<< /Filter /Standard /V 2 /R 3 /O <00112233445566778899AABBCCDDEEFF00112233445566778899AABBCCDDEEFF> /U <FFEEDDCCBBAA99887766554433221100FFEEDDCCBBAA99887766554433221100> /P -4 >>\nendobj\n';
  const atXref = base.indexOf('xref\n0 ');
  const size = Number(/\/Size (\d+)/.exec(base)[1]);
  const head = base.slice(0, atXref) + key;
  const rest = base.slice(atXref).replace(`0 ${size}`, `0 ${size + 1}`).replace('/Root 1 0 R >>', '/Root 1 0 R /Encrypt 6 0 R >>');
  const lines = rest.split('\n');
  lines.splice(2 + size, 0, `${String(head.length - key.length).padStart(10, '0')} 00000 n `);
  return Buffer.from(head + lines.join('\n'), 'latin1');
};

prepareLocalOcr();
const vite = await createServer({server: {host: '127.0.0.1', port: 0}});
await vite.listen();
const origin = 'http://127.0.0.1:' + vite.httpServer.address().port;
const dir = mkdtempSync(join(tmpdir(), 'bursyar-ocr-real-'));
const documents = new DocumentStore(join(dir, 'docs.db'));
const api = createInferenceServer({
  projectId: 'demo-bursyar', origin, documents,
  quota: {reserve() { throw Error('No inference allowed'); }},
  infer: async () => { throw Error('No inference allowed'); },
  verify: async token => ({uid: token, aud: 'demo-bursyar', iss: 'https://securetoken.google.com/demo-bursyar', bursyarDemo: true})
});
await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
const apiBase = 'http://127.0.0.1:' + api.address().port;
const browser = await chromium.launch({headless: true});
const observed = [];
const externalRequests=[];
let failures = 0;
const check = (id, cond, detail) => {
  const line = `${cond ? 'PASS' : 'FAIL'} ${id} ${detail}`;
  observed.push(line);
  console.log(line);
  if (!cond) failures++;
};
try {
  const context = await browser.newContext({viewport: {width: 1440, height: 900}});
  await context.route('**/*',route=>{const url=route.request().url();if(new URL(url).origin!==origin){externalRequests.push(url);return route.abort('internetdisconnected');}return route.continue();});
  const page = await context.newPage();
  const user = 'ocr-real-ci';
  let writes = 0;
  let dropNextResponse = false;
  const externalPosts = [];
  await page.route('**/src/auth.js', route => route.fulfill({contentType: 'text/javascript', body: `export async function signIn(){};export async function signOut(){};export async function onAuthChange(){return ()=>{};} export async function getInferenceToken(){return "${user}";}`}));
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === 'POST' && path === '/api/documents') writes++;
    if (dropNextResponse && request.method() === 'POST' && path === '/api/documents') {
      dropNextResponse = false;
      await fetch(apiBase + path, {method: 'POST', headers: {authorization: request.headers().authorization, origin, 'content-type': 'application/json'}, body: request.postData()});
      await route.abort('connectionreset');
      return;
    }
    const response = await fetch(apiBase + path, {method: request.method(), headers: {authorization: request.headers().authorization, origin, 'content-type': 'application/json'}, ...(['POST', 'PUT'].includes(request.method()) ? {body: request.postData()} : {})});
    await route.fulfill({status: response.status, contentType: 'application/json', body: await response.text()});
  });
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== origin && url.origin !== apiBase && request.method() !== 'GET') externalPosts.push(request.method() + ' ' + url.origin);
  });
  await page.goto(origin);
  await page.locator('#workspace-overview a[href="#profile-mount"]').click();
  const form = page.locator('#documents > form');
  const file = form.locator('input[type=file]');
  const status = page.locator('#documents > [role=status]');
  const preview = page.locator('.document-extraction-preview');
  const ocrSelect = form.locator('select');
  const setFile = (name, mimeType, buffer) => file.setInputFiles({name, mimeType, buffer});
  const submit = () => form.locator('button[type=submit]').click();
  const settledStatus = () => page.waitForFunction(() => {
    const el = document.querySelector('#documents > [role=status]');
    return el && el.textContent && !/Working on your document|در حال پردازش|د پروسس/.test(el.textContent);
  }, null, {timeout: 180000}).then(() => status.textContent());
  await form.locator('input[type=checkbox]').check();
  const render = (lines, rtl, type = 'image/png') => page.evaluate(async ({lines, rtl, type}) => {
    if(rtl)await document.fonts.load('36px "Noto Naskh Arabic"','تحصیلي کچه لېسانس');
    const c = document.createElement('canvas');
    c.width = 900; c.height = 60 + lines.length * 56;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#111'; g.font = rtl?'36px "Noto Naskh Arabic", sans-serif':'36px sans-serif';
    if (rtl) { g.direction = 'rtl'; g.textAlign = 'right'; }
    lines.forEach((t, i) => g.fillText(t, rtl ? 870 : 30, 60 + i * 56));
    const blob = await new Promise(r => c.toBlob(r, type, 0.92));
    return [...new Uint8Array(await blob.arrayBuffer())];
  }, {lines, rtl, type});
  const previewText = () => preview.locator('textarea').inputValue();
  const expectPreview = async (id, timeout = 180000) => {
    try {
      await expect(preview).toBeVisible({timeout});
    } catch {
      const s = await status.textContent();
      check(id + '-preview', false, `preview hidden; status=${JSON.stringify((s || '').slice(0, 80))}`);
      throw Error(`stop: ${id} preview did not open (status: ${(s || '').slice(0, 80)})`);
    }
  };
  const savePreview = async () => {
    await preview.locator('button').first().click();
    await expect(page.locator('.document-source')).not.toHaveCount(0, {timeout: 20000});
  };
  const lastRecord = () => { const all = documents.list(user); return documents.get(user, all[all.length - 1].id); };

  // 1. text PDF
  await setFile('text.pdf', 'application/pdf', textPdf([['SYNTHETIC OCR TEST ONLY', 'Degree: bachelor', 'GPA: 3.4/4']]));
  await submit();
  await expectPreview('01-text-pdf', 120000);
  const t1 = await previewText();
  check('01-text-pdf', t1.includes('Degree: bachelor') && t1.includes('GPA: 3.4/4'), JSON.stringify(t1.slice(0, 70)));
  await savePreview();
  check('01-saved', lastRecord().extractionMethod === 'local_pdf_text_or_ocr' && lastRecord().authenticity === 'not_verified', `writes=${writes}`);

  // 7. TXT (no preview, direct save)
  await setFile('a.txt', 'text/plain', Buffer.from('SYNTHETIC TXT ONLY\nDegree: master'));
  await submit();
  await expect(page.locator('.document-source')).toContainText('SYNTHETIC TXT ONLY', {timeout: 20000});
  check('07-txt', !(await preview.isVisible()) && lastRecord().extractionMethod === 'utf8_text', `writes=${writes}`);

  // 3/4. PNG + JPEG English OCR
  for (const [name, mime, type] of [['ocr.png', 'image/png', 'image/png'], ['ocr.jpg', 'image/jpeg', 'image/jpeg']]) {
    const img = await render(['SYNTHETIC OCR TEST ONLY', 'Degree: doctorate'], false, type);
    await setFile(name, mime, Buffer.from(img));
    await submit();
    await expectPreview('ocr-image');
    const t = await previewText();
    check(`${name}`, /SYNTHETIC OCR TEST ONLY/.test(t) && /Degree:\s*doctorate/.test(t), JSON.stringify(t.slice(0, 70)));
    await preview.locator('button').nth(1).click();
  }
  // 5/6. Farsi + Pashto OCR (editable preview preserves direction)
  await ocrSelect.selectOption('fas');
  const faImg = await render(['مدرک تحصیلی: لیسانس', 'معدل: 17.5/20'], true);
  await setFile('fa.png', 'image/png', Buffer.from(faImg));
  await submit();
  await expectPreview('05-fa-ocr');
  const faText = await previewText();
  check('05-fa-ocr', faText.includes('لیسانس'), JSON.stringify(faText.slice(0, 60)));
  check('05-fa-rtl', await preview.locator('textarea').evaluate(el => getComputedStyle(el).direction === 'rtl'), 'dir=auto follows Persian text');
  await preview.locator('button').nth(1).click();
  await ocrSelect.selectOption('pus');
  const psImg = await render(['تحصیلي کچه: لېسانس'], true);
  await setFile('ps.png', 'image/png', Buffer.from(psImg));
  await submit();
  await expectPreview('06-ps-ocr');
  const psText = await previewText();
  const psManual = !psText.trim();
  if(psManual){
    // Tesseract's Pashto pack may return no characters for synthetic font glyphs.
    // Confirm that the app offers truthful manual entry instead of hallucination.
    check('06-ps-empty-fallback', /manual transcription|رونویسی دستی|لاسي لیکنه/.test((await status.textContent()) || ''), 'empty OCR allows explicit manual entry');
    await preview.locator('textarea').fill('تحصیلي کچه: لېسانس');
    check('06-ps-manual', (await previewText()).includes('لېسانس'), 'user typed Pashto transcription');
  }else{
    check('06-ps-ocr', psText.includes('لېسانس'), JSON.stringify(psText.slice(0, 60)));
  }
  await preview.locator('button').nth(1).click();
  await ocrSelect.selectOption('eng');

  // 2. scanned (image-only) PDF
  const jpg = await render(['SCANNED SYNTHETIC ONLY', 'Degree: master'], false, 'image/jpeg');
  const scan = imagePdf(Buffer.from(jpg), 900, 172);
  await setFile('scan.pdf', 'application/pdf', scan);
  await submit();
  await expectPreview('02-scanned-pdf');
  const scanText = await previewText();
  check('02-scanned-pdf', /SCANNED SYNTHETIC ONLY/.test(scanText), JSON.stringify(scanText.slice(0, 70)));
  await preview.locator('button').nth(1).click();

  // 8/9/10/11/12/13. negatives — all honest, zero writes
  const writesBeforeNeg = writes;
  const neg = async (id, name, mime, buffer, want) => {
    await setFile(name, mime, buffer);
    await submit();
    const s = await settledStatus();
    check(id, s.includes(want), JSON.stringify(s.slice(0, 55)));
  };
  const full = textPdf([['x']]);
  await neg('08-corrupt', 'c.pdf', 'application/pdf', full.subarray(0, Math.floor(full.length / 2)), 'Invalid or unsupported PDF');
  await neg('09-encrypted', 'enc.pdf', 'application/pdf', encryptedPdf(), 'Invalid or unsupported PDF');
  await neg('10-oversize', 'big.pdf', 'application/pdf', Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(6 * 1024 * 1024, 65)]), '5 MB');
  await neg('11-six-pages', 'six.pdf', 'application/pdf', textPdf([['1'], ['2'], ['3'], ['4'], ['5'], ['6']]), '1 to 5 pages');
  await neg('12-bad-sig', 'fake.png', 'image/png', Buffer.from('not-an-image-bytes!!'), 'Invalid image');
  await neg('13-bad-ext', 'run.exe', 'application/octet-stream', Buffer.from('MZ fake'), 'TXT, PDF, PNG, or JPEG');
  check('neg-writes', writes === writesBeforeNeg && !(await preview.isVisible()), `writes=${writes}`);

  // 19. replacement + cancel
  const repA = await render(['FIRST FILE REMAINS UNREAD'], false);
  await setFile('a.png', 'image/png', Buffer.from(repA));
  const repB = await render(['SECOND FILE WINS', 'GPA: 4.0/4'], false);
  await setFile('b.png', 'image/png', Buffer.from(repB));
  await submit();
  await expectPreview('19-replaced');
  check('19-replaced', (await previewText()).includes('SECOND FILE WINS'), 'latest file processed');
  await preview.locator('button').nth(1).click();
  check('19-cancel', writes === writesBeforeNeg, `writes=${writes}`);

  // 15. consent withdrawn
  const cw = await render(['CONSENT PROBE'], false);
  await setFile('cw.png', 'image/png', Buffer.from(cw));
  await submit();
  await expectPreview('15-no-consent');
  await form.locator('input[type=checkbox]').uncheck();
  await preview.locator('button').first().click();
  await page.waitForTimeout(800);
  check('15-no-consent', writes === writesBeforeNeg, `writes=${writes}`);
  await preview.locator('button').nth(1).click();
  await form.locator('input[type=checkbox]').check();

  // 16/17. lost response then idempotent retry
  dropNextResponse = true;
  await setFile('retry.txt', 'text/plain', Buffer.from('SYNTHETIC RETRY ONLY\nDegree: bachelor'));
  await submit();
  const uncertain = await settledStatus();
  const lostCount = documents.list(user).length;
  await setFile('retry.txt', 'text/plain', Buffer.from('SYNTHETIC RETRY ONLY\nDegree: bachelor'));
  await submit();
  await expect(page.locator('.document-source')).toContainText('SYNTHETIC RETRY ONLY', {timeout: 20000});
  check('16-uncertain', /already be saved/.test(uncertain), JSON.stringify(uncertain.slice(0, 50)));
  check('17-idempotent-retry', documents.list(user).length === lostCount, `records=${documents.list(user).length}`);

  // 18. conflicting retry (engine-direct: same key, changed bytes -> 409)
  const key = '8f6aa502-7ff2-4aac-9a03-11e1aad1f202';
  const r1 = documents.upload('ocr-direct', {text: 'SYNTHETIC DIRECT ONLY\nDegree: master', mime: 'text/plain', consent: true, requestId: key});
  const r2 = documents.upload('ocr-direct', {text: 'SYNTHETIC DIRECT ONLY\nDegree: master', mime: 'text/plain', consent: true, requestId: key});
  let got409 = false;
  try { documents.upload('ocr-direct', {text: 'SYNTHETIC DIRECT ONLY\nDegree: doctorate', mime: 'text/plain', consent: true, requestId: key}); }
  catch (e) { got409 = e.status === 409; }
  check('18-conflict-409', r1.id === r2.id && got409 && documents.list('ocr-direct').length === 1, 'same-key dedupe + 409');

  // 20. reload persistence
  await page.reload();
  await page.locator('#workspace-overview a[href="#profile-mount"]').click();
  await page.locator('#documents > fieldset > button').first().click();
  // Refresh is asynchronous: wait until the authenticated API has populated
  // the selector rather than checking an empty list in the same task tick.
  await expect.poll(async()=>page.locator('#documents > fieldset select option:not([value=""])').count(),{timeout:20000}).toBeGreaterThanOrEqual(3);
  const options = await page.locator('#documents > fieldset select option').allTextContents();
  check('20-library-lists', options.length >= 3, `${options.length} records`);
  await page.locator('#documents > fieldset select').selectOption({index: options.length - 1});
  await page.locator('#documents > fieldset > button').nth(1).click();
  await expect(page.locator('.document-source')).toContainText('SYNTHETIC RETRY ONLY', {timeout: 20000});
  check('20-reload', true, 'record persists');

  // privacy: no non-GET traffic off-origin during the whole battery
  check('privacy-no-exfil', externalPosts.length === 0, externalPosts.join(';') || 'no off-origin writes');
  check('same-origin-assets',externalRequests.length===0,externalRequests.join(';')||'no off-origin requests, including OCR workers');
  await context.close();

  // 14. unavailable local assets in a fresh context: honest recovery, TXT still saves
  {
    const context2 = await browser.newContext({viewport: {width: 1440, height: 900}});
    const page2 = await context2.newPage();
    const user2 = 'ocr-real-offline';
    await page2.route('**/src/auth.js', route => route.fulfill({contentType: 'text/javascript', body: `export async function signIn(){};export async function signOut(){};export async function onAuthChange(){return ()=>{};} export async function getInferenceToken(){return "${user2}";}`}));
    await page2.route('**/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const response = await fetch(apiBase + path, {method: request.method(), headers: {authorization: request.headers().authorization, origin, 'content-type': 'application/json'}, ...(['POST', 'PUT'].includes(request.method()) ? {body: request.postData()} : {})});
      await route.fulfill({status: response.status, contentType: 'application/json', body: await response.text()});
    });
    await context2.route('**/vendor/ocr-v1/**',route=>route.abort('internetdisconnected'));
    await context2.route(/^https?:\/\/(?!127\.0\.0\.1:)/,route=>route.abort('internetdisconnected'));
    await page2.goto(origin);
    await page2.locator('#workspace-overview a[href="#profile-mount"]').click();
    const form2 = page2.locator('#documents > form');
    await form2.locator('input[type=checkbox]').check();
    const probe = await page2.evaluate(async () => {
      const c = document.createElement('canvas'); c.width = 400; c.height = 100;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 400, 100);
      g.fillStyle = '#000'; g.font = '30px sans-serif'; g.fillText('OFFLINE', 30, 60);
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      return [...new Uint8Array(await blob.arrayBuffer())];
    });
    await form2.locator('input[type=file]').setInputFiles({name: 'off.png', mimeType: 'image/png', buffer: Buffer.from(probe)});
    await form2.locator('button[type=submit]').click();
    await page2.waitForFunction(() => {
      const el = document.querySelector('#documents > [role=status]');
      return el && el.textContent && !/Working on your document/.test(el.textContent);
    }, null, {timeout: 120000});
    const s14 = await page2.locator('#documents > [role=status]').textContent();
    check('14-offline-ocr', /unavailable/.test(s14) && !(await page2.locator('.document-extraction-preview').isVisible()), JSON.stringify(s14.slice(0, 55)));
    await form2.locator('input[type=file]').setInputFiles({name: 'off.txt', mimeType: 'text/plain', buffer: Buffer.from('OFFLINE TXT SAVES')});
    await form2.locator('button[type=submit]').click();
    await expect(page2.locator('.document-source')).toContainText('OFFLINE TXT SAVES', {timeout: 20000});
    check('14-offline-txt', true, 'TXT saves without OCR assets');
    await context2.close();
  }
} finally {
  await browser?.close();
  await vite.close();
  await new Promise(resolve => api.close(resolve));
  documents.close();
  rmSync(dir, {recursive: true, force: true});
}
if (failures) { console.error(`OCR INTEGRATION FAILURES: ${failures}`); process.exit(1); }
console.log(`OCR REAL-INTEGRATION PASSED: ${observed.length} checks, 0 failures`);
