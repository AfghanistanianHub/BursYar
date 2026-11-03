// M18 Phase-2 product audit probe. Read-only: checks live-site DOM plus local
// engine behavior; prints PRESENT/MISSING per filmable workflow element.
// Run: REPO=/path/to/BursYar node edit/audit-probe.mjs
import {chromium} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
const REPO = process.env.REPO ?? '/Users/sayadalimousaviazad/Documents/BursYar-recovery-91';
const out = [];
const check = (id, cond, detail = '') => { out.push(`${cond ? 'PRESENT' : 'MISSING'} ${id} ${detail}`.trim()); console.log(out[out.length - 1]); };
const browser = await chromium.launch({headless: true});
try {
  const page = await (await browser.newContext({viewport: {width: 1920, height: 1080}})).newPage();
  await page.goto('https://bursyar.vercel.app/', {waitUntil: 'networkidle', timeout: 60000});
  const has = async sel => (await page.locator(sel).count()) > 0;
  check('live.landing.hero', await has('.hero'), 'landing hero');
  check('live.landing.journey', await has('.journey-nav'), 'journey nav');
  check('live.landing.workspace', await has('#workspace-overview'), 'workspace overview');
  check('live.landing.assistant', await has('#assistant'), 'assistant section');
  await page.locator('.resources').evaluate(el => { el.open = true; });
  check('live.research.explorer', await has('#research-explorer-mount, #research-explorer'), 'explorer mount');
  check('live.research.search', await has('#research-search, #search'), 'search input');
  check('live.research.country', await has('#research-country, #country'), 'country filter');
  check('live.research.cards', await has('.scholarship'), 'scholarship cards');
  check('live.source.url', await has('#source-url'), 'source URL input');
  check('live.source.fetch', await has('#fetch-source'), 'fetch button');
  check('live.source.manual', await has('#manual-source'), 'manual entry');
  check('live.eligibility.demo', await has('#eligibility-demo, #eligibility-example'), 'eligibility demo');
  check('live.language.select', await has('#language'), 'language switcher');
  await page.locator('.workspace').evaluate(el => { el.open = true; });
  check('live.documents.mount', await has('#documents-mount'), 'documents mount');
  check('live.account', await has('.account'), 'account controls');
  await page.context().close();
} finally { await browser.close(); }
try {
  const det = await import(pathToFileURL(join(REPO, 'engine/deterministic.js')).href);
  const names = Object.keys(det).join(',');
  check('engine.deterministic.exports', /evaluate|assess|verdict/i.test(names), names.slice(0, 120));
  const ev = await import(pathToFileURL(join(REPO, 'engine/evidence.js')).href);
  check('engine.evidence.normalize', typeof ev.normalizeEvidence === 'function', 'normalizeEvidence');
} catch (e) { check('engine.import', false, String(e).slice(0, 120)); }
const missing = out.filter(l => l.startsWith('MISSING')).length;
console.log(`AUDIT DONE missing=${missing}`);
