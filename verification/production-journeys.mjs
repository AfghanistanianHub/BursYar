// Mission 19: real production user journeys (A–G) against the live deployment.
// No mocks, no inference fabrication. Authenticated steps are attempted only
// as far as possible without test credentials; the rest is recorded UNTESTED
// with the exact blocker. Run: node verification/production-journeys.mjs
import {mkdirSync, writeFileSync} from 'node:fs';
import {chromium, expect} from '@playwright/test';

const BASE = 'https://bursyar.vercel.app/';
const OUT = 'verification/artifacts/journeys';
mkdirSync(OUT, {recursive: true});
const results = [];
function record(journey, step, ok, detail = '') {
  results.push({journey, step, ok, detail});
  console.log(`${ok ? 'PASS' : 'FAIL'} [${journey}] ${step}${detail ? ' — ' + detail : ''}`);
}
async function shot(page, name) {
  await page.screenshot({path: `${OUT}/${name}.png`});
}

const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1280, height: 900}});

// ---------- Journey A — new visitor (en) ----------
await page.goto(BASE, {waitUntil: 'networkidle', timeout: 60000});
await page.locator('#top').waitFor({timeout: 30000});
record('A', 'landing loads', true, await page.title());
await expect(page.locator('.editorial-nav a')).toHaveCount(4);
record('A', 'editorial nav has 4 links', true);
await page.locator('.resources').evaluate(el => { el.open = true; });
await page.locator('#search').fill('germany');
record('A', 'search filters', (await page.locator('.scholarship').count()) >= 1);
await page.locator('.scholarship .detail-button').first().click();
await expect(page.locator('#detail .detail')).toBeVisible();
const detailText = await page.locator('#detail .detail').innerText();
record('A', 'detail opens with honest demo labels',
  /sample|نمونه|بېلگ/i.test(detailText) || /not active|نمونه|بېلګې/i.test(detailText), detailText.slice(0, 80));
await shot(page, 'A-discovery');

// ---------- Journey C — offline eligibility (en) ----------
await page.locator('#eligibility-example > summary').click();
await page.locator('#eligibility-form [name=degree]').selectOption('bachelor');
await page.locator('#eligibility-form [name=hasTest]').check();
await expect(page.locator('#eligibility-result')).toHaveAttribute('data-status', 'not_met');
record('C', 'NOT_MET verdict renders', true);
await page.locator('.scenarios summary').click();
await page.locator('#eligibility-simulate').click();
await expect(page.locator('#eligibility-future')).toHaveAttribute('data-status', 'met');
record('C', 'hypothetical MET renders, never a guarantee', true);
await page.locator('#eligibility-form [name=degree]').selectOption('');
const stillNotMet = await page.locator('#eligibility-result').getAttribute('data-status');
record('C', 'definite IELTS failure not masked by missing degree', stillNotMet === 'not_met', `status=${stillNotMet}`);
await page.locator('#eligibility-form [name=hasTest]').uncheck();
const unknownStatus = await page.locator('#eligibility-result').getAttribute('data-status');
const unknownText = await page.locator('#eligibility-result').innerText();
record('C', 'missing facts stay UNKNOWN, never a guarantee', unknownStatus === 'unknown' && !/guarantee|verified$/i.test(unknownText), `status=${unknownStatus}`);
await page.locator('#eligibility-form [name=degree]').selectOption('bachelor');
const mixedStatus = await page.locator('#eligibility-result').getAttribute('data-status');
record('C', 'mixed met+unknown stays UNKNOWN (no partial promise)', mixedStatus === 'unknown', `status=${mixedStatus}`);
await shot(page, 'C-eligibility');

// ---------- Journey B — document-first onboarding (synthetic, unauthenticated) ----------
await page.locator('.workspace').evaluate(el => { el.open = true; });
const upload = page.locator('#documents form').first();
await upload.locator('input[type=file]').setInputFiles({name: 'synthetic-education.txt', mimeType: 'text/plain',
  buffer: Buffer.from('SYNTHETIC TEST ONLY\nDegree: bachelor\nIELTS Academic: overall=7; listening=7; reading=7; writing=6; speaking=7')});
await upload.locator('input[type=checkbox]').check();
await upload.locator('button[type=submit]').click();
await page.waitForTimeout(2500);
const docState = await page.locator('#documents').innerText();
const claims = await page.locator('#documents .document-claim').count();
record('B', 'synthetic upload handled honestly', claims > 0 || /sign|401|approve|ورود|ننوتل/i.test(docState),
  `claims=${claims} text=${docState.slice(0, 100)}`);
await shot(page, 'B-documents');

// ---------- Journey D — PathFinder alternatives (offline local workflow) ----------
await page.locator('.journey-offline').click();
await expect(page.locator('.local-workflow')).toHaveAttribute('open', '');
await expect(page.locator('#local-assessment')).toBeVisible();
const assessText = await page.locator('#local-assessment').innerText();
record('D', 'local assessment renders offline', assessText.length > 20, assessText.slice(0, 100));
await page.locator('#local-assessment').getByRole('button', {name: /Load reviewed|بارگذاری|راوړئ/}).click();
await page.waitForTimeout(2500);
const localStatus = await page.locator('#local-status').innerText();
record('D', 'unauthenticated catalog refresh denied honestly', /unavailable|sign in|ورود|ننوتل/i.test(localStatus), localStatus.slice(0, 100));
await shot(page, 'D-pathfinder');

// ---------- Journey G — AI failure fallback (blocked API) ----------
await page.context().route('**/api/**', route => route.abort('failed'));
await page.locator('#manual-source').click();
await page.locator('#requirements').fill('Applicants must provide academic transcripts. Tuition fees are covered.');
await page.locator('[name=sourceUrl]').fill('https://university.example/award');
await page.locator('#source-approved').check();
await page.locator('#analyze-form button[type=submit]').click();
await page.waitForTimeout(3000);
const fallbackVisible = await page.locator('#deterministic-fallback').isVisible().catch(() => false);
const criterionCount = await page.locator('.criterion').count();
const busyStuck = await page.locator('#analyze-form').getAttribute('aria-busy');
record('G', 'provider failure shows fallback, renders nothing fake',
  fallbackVisible && criterionCount === 0 && busyStuck !== 'true',
  `fallback=${fallbackVisible} criteria=${criterionCount} busy=${busyStuck}`);
if (fallbackVisible) {
  await page.locator('#deterministic-fallback').click();
  record('G', 'fallback opens local workflow', await page.locator('.local-workflow').getAttribute('open') !== null);
}
await shot(page, 'G-failure');
await page.context().unroute('**/api/**');

// ---------- Journey E — Google auth (presence only, no test identity) ----------
await page.locator('.account > summary').click();
const accountText = await page.locator('#account-controls').innerText();
record('E', 'account controls present Google sign-in (completion UNTESTED)',
  /google|sign/i.test(accountText), accountText.slice(0, 100));
await shot(page, 'E-account');
results.push({journey: 'E', step: 'sign-in completion, persistence, logout, protected routes', ok: null,
  detail: 'UNTESTED: no legitimate test identity available; will not enter credentials'});

// ---------- Journey F — fa/ps core + RTL ----------
for (const lang of ['fa', 'ps']) {
  await page.locator('#language').selectOption(lang);
  await expect(page.locator('html')).toHaveAttribute('lang', lang);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  record('F', `${lang} switches lang+dir`, true);
  await page.locator('.resources').evaluate(el => { el.open = true; });
  const n = await page.locator('.scholarship').count();
  record('F', `${lang} discovery renders`, n >= 1, `cards=${n}`);
  const over = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  record('F', `${lang} no horizontal overflow at 1280`, !over);
  await shot(page, `F-${lang}`);
}
await page.locator('#language').selectOption('en');

writeFileSync(`${OUT}/report.json`, JSON.stringify(results, null, 1));
const failed = results.filter(r => r.ok === false);
const untested = results.filter(r => r.ok === null);
console.log(`\n${results.length - failed.length - untested.length} passed, ${failed.length} failed, ${untested.length} untested.`);
await browser.close();
process.exit(failed.length ? 1 : 0);
