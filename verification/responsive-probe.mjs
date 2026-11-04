// Responsive probe: 5 widths x 3 locales against the production build.
// Serves dist/ locally, opens each locale, expands workspace/resources panels,
// and reports horizontal overflow + console errors. No network inference.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {join,extname} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'verification', 'artifacts', 'responsive');
mkdirSync(OUT, {recursive:true});

const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'};

function serve(){
  return new Promise(resolve => {
    const server = createServer(async (req,res) => {
      try {
        const path = new URL(req.url, 'http://x').pathname;
        const file = join(DIST, path === '/' ? 'index.html' : path.slice(1));
        const data = await readFile(file);
        res.writeHead(200, {'content-type': MIME[extname(file)] ?? 'application/octet-stream'});
        res.end(data);
      } catch { res.writeHead(404); res.end('no'); }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const WIDTHS = [320, 390, 768, 1024, 1440];
const LOCALES = ['en', 'fa', 'ps'];

const {chromium} = await import('@playwright/test');
const server = await serve();
const port = server.address().port;
const base = `http://127.0.0.1:${port}/`;
const report = [];
let failures = 0;

const browser = await chromium.launch();
try {
  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({viewport: {width, height: 900}});
      const errors = [];
      page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 200)));
      page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
      await page.addInitScript(l => localStorage.setItem('bursyar-language', l), locale);
      await page.goto(base, {waitUntil: 'networkidle'});
      await page.waitForSelector('#top');
      // Expand panels so explorer + documents layouts are measured too.
      await page.evaluate(() => {
        document.querySelector('.workspace')?.setAttribute('open', '');
        document.querySelector('.resources')?.setAttribute('open', '');
      });
      await page.waitForTimeout(250);
      const m = await page.evaluate(() => {
        const de = document.documentElement;
        const over = [];
        for (const el of document.querySelectorAll('header, main, footer, .listing, .filters, #research-explorer')) {
          if (el.scrollWidth > el.clientWidth + 1) over.push(el.tagName.toLowerCase() + '.' + (el.className?.baseVal ?? el.className ?? '').toString().split(' ')[0] + ':' + el.scrollWidth + '>' + el.clientWidth);
        }
        return {lang: de.lang, dir: de.dir, docOver: de.scrollWidth - de.clientWidth,
          bodyOver: document.body.scrollWidth - document.body.clientWidth, over};
      });
      const shot = `${OUT}/${locale}-${width}.png`;
      await page.screenshot({path: shot, fullPage: false});
      const bad = m.docOver > 1 || m.bodyOver > 1 || m.over.length > 0 || errors.length > 0;
      if (bad) failures++;
      report.push({locale, width, ...m, errors, shot, ok: !bad});
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 1));
for (const r of report) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.locale} ${r.width}px lang=${r.lang} dir=${r.dir} docOver=${r.docOver} bodyOver=${r.bodyOver} extras=${r.over.join(';') || 'none'} errors=${r.errors.length ? r.errors.join(' | ') : 'none'}`);
console.log(failures ? `\n${failures} failing combos — see ${OUT}/report.json` : '\nAll 15 combos clean.');
process.exit(failures ? 1 : 0);
