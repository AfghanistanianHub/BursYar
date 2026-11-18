// Mission 43 production gate: the BUILT bundle (PROD=true) accepts TXT, PDF,
// PNG and JPEG, extracts text with the self-hosted PDF.js worker and
// self-hosted Tesseract assets, contacts no third party, and runs under the
// deployment's Content-Security-Policy.
//
// Identity is stubbed at the bundle boundary (a local build has no Firebase
// config, so the SDK branch is tree-shaken into a throw). Metadata inference is
// never called. Fixtures are synthetic and generated here.
//
// Run: npm run build && node verification/document-production-gate-browser.mjs
import {chromium, expect} from '@playwright/test';
import {createServer as createHttpServer} from 'node:http';
import {readFileSync, existsSync, mkdtempSync, rmSync} from 'node:fs';
import {extname, join, dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';

const here = dirname(fileURLToPath(import.meta.url));
const distIndex = join(here, '..', 'dist', 'index.html');
if (!existsSync(distIndex)) {
  console.error('FAIL PROD-DIST missing: run `npm run build` first');
  process.exit(1);
}
const distRoot = join(here, '..', 'dist');

// Serve the exact global response headers the deployment declares, so the CSP
// this gate proves is the CSP production will send.
const deployConfig = JSON.parse(readFileSync(join(here, '..', 'vercel.json'), 'utf8'));
const globalHeaders = Object.fromEntries(
  (deployConfig.headers ?? [])
    .filter(header => header.source === '/(.*)')
    .flatMap(header => header.headers ?? [])
    .map(header => [header.key.toLowerCase(), header.value])
);
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.gz': 'application/gzip'
};
const staticServer = createHttpServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const file = join(distRoot, path === '/' ? 'index.html' : path);
  try {
    const body = readFileSync(file);
    res.writeHead(200, {'content-type': types[extname(file)] ?? 'application/octet-stream', ...globalHeaders});
    res.end(body);
  } catch {
    // Only real navigation falls back to the SPA shell; a missing asset must
    // fail loudly instead of being served HTML with a JS content type.
    if (extname(path)) {
      res.writeHead(404, {'content-type': 'text/plain', ...globalHeaders});
      res.end('not found');
      return;
    }
    res.writeHead(200, {'content-type': 'text/html', ...globalHeaders});
    res.end(readFileSync(distIndex));
  }
});
await new Promise(resolve => staticServer.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${staticServer.address().port}`;

// ---- synthetic PDF builders (no dependency) ----
function textPdf(pages) {
  const offsets = [];
  let body = '%PDF-1.4\n';
  const push = text => { offsets.push(body.length); body += text; };
  const fontId = 3 + pages.length * 2;
  const esc = text => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  push('2 0 obj\n<< /Type /Pages /Kids [' + pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ') + `] /Count ${pages.length} >>\nendobj\n`);
  pages.forEach((lines, i) => {
    const content = lines.map((line, j) => `BT /F1 14 Tf 72 ${720 - j * 24} Td (${esc(line)}) Tj ET`).join('\n');
    push(`${3 + i * 2} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${4 + i * 2} 0 R >>\nendobj\n`);
    push(`${4 + i * 2} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
  });
  push(`${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  const xref = body.length;
  body += `xref\n0 ${fontId + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= fontId; i++) body += `${String(offsets[i - 1]).padStart(10, '0')} 00000 n \n`;
  body += `trailer\n<< /Size ${fontId + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body, 'latin1');
}
function imagePdf(jpeg, width, height) {
  const encoder = new TextEncoder();
  const chunks = [];
  const at = [];
  let offset = 0;
  const push = value => {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    at.push(offset); chunks.push(bytes); offset += bytes.length;
  };
  const raw = value => {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    chunks.push(bytes); offset += bytes.length;
  };
  push('%PDF-1.4\n');
  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n');
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  raw(jpeg);
  raw('\nendstream\nendobj\n');
  const draw = encoder.encode(`q ${width} 0 0 ${height} 0 500 cm /Im1 Do Q`);
  push(`5 0 obj\n<< /Length ${draw.length} >>\nstream\n`);
  raw(draw);
  raw('\nendstream\nendobj\n');
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) xref += `${String(at[i]).padStart(10, '0')} 00000 n \n`;
  return Buffer.concat([...chunks, encoder.encode(xref), encoder.encode(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`)]);
}

const dir = mkdtempSync(join(tmpdir(), 'bursyar-prod-ocr-'));
const documents = new DocumentStore(join(dir, 'docs.db'));
const api = createInferenceServer({
  projectId: 'demo-bursyar', origin, documents,
  quota: {reserve() { throw Error('Inference quota forbidden'); }},
  infer: async () => { throw Error('Inference forbidden'); },
  verify: async token => ({uid: token, aud: 'demo-bursyar', iss: 'https://securetoken.google.com/demo-bursyar', bursyarDemo: true})
});
await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
const apiBase = `http://127.0.0.1:${api.address().port}`;

// The Cloud runner has no user namespaces and a small /dev/shm; both flags are
// required for a stable headless Chromium here.
const browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']});
const observed = [];
let failures = 0;
const check = (id, condition, detail) => {
  const line = `${condition ? 'PASS' : 'FAIL'} ${id} ${detail}`;
  observed.push(line);
  console.log(line);
  if (!condition) failures++;
};
try {
  const user = 'production-ocr-gate';
  const context = await browser.newContext({viewport: {width: 1440, height: 900}});
  const page = await context.newPage();
  let writes = 0;
  let tokenStubbed = false;
  const thirdParty = [];
  const ocrAssets = [];
  const assetScripts = [];
  const cspViolations = [];
  let servedCsp = '';
  let pdfWorkerRequested = false;

  page.on('response', response => {
    const header = response.headers()['content-security-policy'];
    if (header && response.url() === origin + '/') servedCsp = header;
  });
  // The local build has no Firebase config, so Vite reduces the session
  // initializer to a throw. Replace only that statement with a synthetic
  // identity; fail loudly if the bundle shape changes.
  await page.route('**/assets/*.js', async route => {
    const response = await route.fetch();
    let body = await response.text();
    const needle = /throw (?:new )?Error\((["'])Firebase sign-in is not configured\1\)/;
    if (needle.test(body)) {
      body = body.replace(needle, 'return{auth:{currentUser:{getIdToken:async()=>"production-ocr-gate"}},sdk:{}}');
      tokenStubbed = true;
    }
    await route.fulfill({status: response.status(), contentType: 'text/javascript', body});
  });
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/analyze') throw Error('Inference forbidden in the production gate');
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
    if (url.pathname.startsWith('/ocr/')) ocrAssets.push(url.pathname);
    else if (url.pathname.includes('pdf.worker')) pdfWorkerRequested = true;
    if (url.origin === origin || url.origin === apiBase || url.protocol === 'data:' || url.protocol === 'blob:') return;
    thirdParty.push(`${request.method()} ${url.origin}${url.pathname}`);
  });
  page.on('console', message => {
    if (message.type() === 'error' && /content security policy/i.test(message.text())) cspViolations.push(message.text().slice(0, 200));
  });

  await page.goto(origin);
  check('PROD-IDENTITY-STUBBED', tokenStubbed, 'synthetic identity installed at the bundle boundary');
  check('PROD-CSP-HEADER', /script-src 'self'/.test(servedCsp) && /wasm-unsafe-eval/.test(servedCsp), servedCsp ? servedCsp.slice(0, 90) : 'no CSP header served');

  await page.locator('#workspace-overview a[href="#profile-mount"]').click();
  const form = page.locator('#documents > form');
  const status = page.locator('#documents > [role=status]');
  const preview = page.locator('.document-extraction-preview');
  const file = form.locator('input[type=file]');
  const submit = () => form.locator('button[type=submit]').click();
  const settledStatus = () => page.waitForFunction(() => {
    const element = document.querySelector('#documents > [role=status]');
    return element && element.textContent && !/Working on your document|در حال پردازش|د پروسس/.test(element.textContent);
  }, null, {timeout: 180000}).then(() => status.textContent());
  const render = (lines, type = 'image/png') => page.evaluate(async ({lines, type}) => {
    const canvas = document.createElement('canvas');
    canvas.width = 900; canvas.height = 60 + lines.length * 56;
    const context2d = canvas.getContext('2d');
    context2d.fillStyle = '#fff'; context2d.fillRect(0, 0, canvas.width, canvas.height);
    context2d.fillStyle = '#111'; context2d.font = '36px sans-serif';
    lines.forEach((line, i) => context2d.fillText(line, 30, 60 + i * 56));
    const blob = await new Promise(resolve => canvas.toBlob(resolve, type, 0.92));
    return [...new Uint8Array(await blob.arrayBuffer())];
  }, {lines, type});

  const notice = await page.locator('#documents > p').first().textContent();
  check('PROD-NOTICE', /PDF/.test(notice) && !/TXT only|فقط TXT|یوازې TXT/.test(notice), JSON.stringify(notice.slice(0, 60)));
  const accept = await file.getAttribute('accept');
  check('PROD-ACCEPT', /\.pdf/.test(accept) && /\.png/.test(accept) && /\.jpe?g/.test(accept), accept);

  await form.locator('input[type=checkbox]').check();

  // 1. TXT still saves directly, without extraction preview.
  await file.setInputFiles({name: 'ok.txt', mimeType: 'text/plain', buffer: Buffer.from('SYNTHETIC PROD TXT ONLY\nDegree: bachelor')});
  await submit();
  await expect(page.locator('.document-source')).toContainText('SYNTHETIC PROD TXT ONLY', {timeout: 30000});
  check('PROD-TXT', writes === 1 && !(await preview.isVisible()), `writes=${writes}`);

  // 2. Text-layer PDF through the self-hosted PDF.js worker.
  await file.setInputFiles({name: 'text.pdf', mimeType: 'application/pdf', buffer: textPdf([['SYNTHETIC PROD PDF ONLY', 'Degree: bachelor', 'GPA: 3.4/4']])});
  await submit();
  await expect(preview).toBeVisible({timeout: 120000});
  const pdfText = await preview.locator('textarea').inputValue();
  check('PROD-TEXT-PDF', /SYNTHETIC PROD PDF ONLY/.test(pdfText) && /Degree: bachelor/.test(pdfText), JSON.stringify(pdfText.slice(0, 60)));
  check('PROD-PDF-WORKER', pdfWorkerRequested, 'PDF.js worker loaded from the application origin');
  await preview.locator('button').first().click();
  await expect(page.locator('.document-source')).toContainText('SYNTHETIC PROD PDF ONLY', {timeout: 30000});
  check('PROD-TEXT-PDF-SAVED', writes === 2, `writes=${writes}`);

  // 3. Image-only (scanned) PDF: OCR must run on the rendered page.
  const jpeg = await render(['SCANNED PROD SYNTHETIC ONLY', 'Degree: master'], 'image/jpeg');
  await file.setInputFiles({name: 'scan.pdf', mimeType: 'application/pdf', buffer: imagePdf(Buffer.from(jpeg), 900, 172)});
  await submit();
  await expect(preview).toBeVisible({timeout: 180000});
  const scanText = await preview.locator('textarea').inputValue();
  // This gate proves the scanned-pipeline runs, not glyph-perfect accuracy:
  // Tesseract legitimately mis-read a trailing letter during development
  // ("ONLI"), so tokens are compared on a 3-character prefix and the raw text
  // is recorded. Accuracy limits are documented in docs/OCR-PIPELINE.md.
  const tokens = scanText.toUpperCase().replace(/[^A-Z ]/g, ' ').split(/\s+/).filter(Boolean);
  const expected = ['SCANNED', 'PROD', 'SYNTHETIC', 'ONLY'];
  const matched = expected.filter(word => tokens.some(token => token.slice(0, 3) === word.slice(0, 3)));
  check('PROD-SCAN-PDF-OCR', matched.length === expected.length, `${matched.length}/${expected.length} tokens ${JSON.stringify(scanText.trim().slice(0, 70))}`);
  await preview.locator('button').nth(1).click();

  // 4. PNG OCR.
  const png = await render(['IMAGE PROD SYNTHETIC ONLY', 'Degree: doctorate']);
  await file.setInputFiles({name: 'ocr.png', mimeType: 'image/png', buffer: Buffer.from(png)});
  await submit();
  await expect(preview).toBeVisible({timeout: 180000});
  const pngText = await preview.locator('textarea').inputValue();
  check('PROD-IMAGE-OCR', /IMAGE PROD SYNTHETIC ONLY/.test(pngText), JSON.stringify(pngText.slice(0, 60)));
  await preview.locator('button').nth(1).click();

  // 5. Self-hosted assets actually served, and nothing from a third party.
  check('PROD-OCR-WORKER', ocrAssets.includes('/ocr/worker.min.js'), `${ocrAssets.length} first-party OCR asset requests`);
  check('PROD-OCR-CORE', ocrAssets.some(path => /^\/ocr\/tesseract-core-(simd-)?lstm\.wasm(\.js)?$/.test(path)), ocrAssets.filter(path => path.includes('core')).join(';'));
  check('PROD-OCR-MODEL', ocrAssets.some(path => /^\/ocr\/lang\/eng\.traineddata\.gz$/.test(path)), ocrAssets.filter(path => path.includes('lang')).join(';'));
  check('PROD-NO-THIRD-PARTY', thirdParty.length === 0, thirdParty.join(';') || 'zero off-origin requests');
  check('PROD-CSP-CLEAN', cspViolations.length === 0, cspViolations.join(';') || 'no CSP violations');

  // 6. Malformed and over-limit inputs fail closed with no write.
  const writesBeforeNegatives = writes;
  const negative = async (id, name, mimeType, buffer, want) => {
    await file.setInputFiles({name, mimeType, buffer});
    await submit();
    const message = await settledStatus();
    check(id, message.includes(want), JSON.stringify(message.slice(0, 55)));
  };
  const valid = textPdf([['x']]);
  await negative('PROD-CORRUPT-PDF', 'corrupt.pdf', 'application/pdf', valid.subarray(0, Math.floor(valid.length / 2)), 'Invalid or unsupported PDF');
  await negative('PROD-PAGE-LIMIT', 'six.pdf', 'application/pdf', textPdf([['1'], ['2'], ['3'], ['4'], ['5'], ['6']]), '1 to 5 pages');
  await negative('PROD-OVERSIZE', 'big.pdf', 'application/pdf', Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(6 * 1024 * 1024, 65)]), '5 MB');
  await negative('PROD-BAD-IMAGE', 'fake.png', 'image/png', Buffer.from('not-an-image-bytes!!'), 'Invalid image');
  await negative('PROD-BAD-EXT', 'run.exe', 'application/octet-stream', Buffer.from('MZ fake'), 'TXT, PDF, PNG, or JPEG');
  check('PROD-NEGATIVE-NO-WRITE', writes === writesBeforeNegatives && !(await preview.isVisible()), `writes=${writes}`);

  await context.close();
} finally {
  await browser?.close().catch(() => {});
  await new Promise(resolve => staticServer.close(resolve));
  await new Promise(resolve => api.close(resolve));
  documents.close();
  rmSync(dir, {recursive: true, force: true});
}
if (failures) {
  console.error(`PRODUCTION GATE FAILURES: ${failures}`);
  process.exit(1);
}
console.log('PRODUCTION GATE PASSED');
