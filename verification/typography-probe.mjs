// Typography probe: verifies locally hosted fonts load (no external font CDN),
// per-language font stacks apply, and Pashto-specific glyphs are covered.
// Run: node verification/typography-probe.mjs
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';

const vite = await createServer({ root: process.cwd(), server: { host: '127.0.0.1', port: 0 } });
await vite.listen();
const baseUrl = `http://127.0.0.1:${vite.httpServer.address().port}`;
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
mkdirSync('verification/artifacts/typography', { recursive: true });
const PASHTO = ['ټ', 'ځ', 'څ', 'ډ', 'ړ', 'ږ', 'ښ', 'ګ', 'ڼ', 'ې', 'ی', 'ئ'];
const report = { baseUrl, cases: [], externalFontRequests: [] };
try {
  for (const language of ['en', 'fa', 'ps']) {
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const fontHosts = [];
      page.on('request', (r) => {
        const u = new URL(r.url());
        if (/\.(woff2?|ttf|otf)$/.test(u.pathname)) fontHosts.push(`${u.host}${u.pathname}`);
      });
      await page.goto(baseUrl);
      await page.locator('#language').selectOption(language);
      await page.waitForTimeout(800);
      const fonts = await page.evaluate(async () => {
        await document.fonts.ready;
        const body = getComputedStyle(document.body).fontFamily;
        const h1 = getComputedStyle(document.querySelector('.hero h1')).fontFamily;
        // Force the on-demand Pashto fallback (U+06B1 is covered by Noto, not Vazirmatn).
        let naskhFallback = false;
        try {
          const loaded = await document.fonts.load('16px "Noto Naskh Arabic"', '\u06B1');
          naskhFallback = loaded.length > 0 && document.fonts.check('16px "Noto Naskh Arabic"', '\u06B1');
        } catch { naskhFallback = false; }
        return {
          body, h1,
          inter: document.fonts.check('16px "Inter"'),
          vazirmatn: document.fonts.check('16px "Vazirmatn"'),
          naskh: document.fonts.check('16px "Noto Naskh Arabic"'),
          naskhFallback,
        };
      });
      const pashtoCoverage = await page.evaluate((chars) => {
        const out = {};
        for (const ch of chars) {
          out[ch] = {
            vazirmatn: document.fonts.check(`16px "Vazirmatn"`, ch),
            naskh: document.fonts.check(`16px "Noto Naskh Arabic"`, ch),
          };
        }
        return out;
      }, PASHTO);
      const external = fontHosts.filter((h) => !h.startsWith('127.0.0.1'));
      report.externalFontRequests.push(...external);
      const expected = language === 'en' ? 'Inter' : 'Vazirmatn';
      const stackOk = fonts.body.includes(expected);
      const arabicSubset = fontHosts.some((h) => h.includes('vazirmatn-arabic-400'));
      report.cases.push({ language, width, ...fonts, stackOk, arabicSubset: language === 'en' ? true : arabicSubset, externalFontRequests: fontHosts, pashtoCoverage });
      await page.screenshot({ path: `verification/artifacts/typography/after-${language}-${width}.png`, fullPage: false });
      // "Before" proxy: force the old generic system stack to show the visual delta.
      await page.addStyleTag({ content: 'body,.hero h1,h2,h3,button,input,select,textarea{font-family:system-ui,-apple-system,"Segoe UI",sans-serif !important;letter-spacing:normal !important}' });
      await page.waitForTimeout(300);
      await page.locator('.hero').screenshot({ path: `verification/artifacts/typography/before-hero-${language}-${width}.png` });
      await context.close();
    }
  }
  report.passed = report.cases.every((c) => c.stackOk && c.inter && c.vazirmatn && c.arabicSubset && c.naskhFallback)
    && report.externalFontRequests.length === 0;
  // Naskh must cover every Pashto letter (Vazirmatn covers all but U+06B1 per fontTools audit).
  report.pashtoFallbackOk = report.cases.every((c) => PASHTO.every((ch) => c.pashtoCoverage[ch].naskh));
  console.log(JSON.stringify({ passed: report.passed && report.pashtoFallbackOk, cases: report.cases.length, externalFontRequests: report.externalFontRequests }, null, 2));
} finally {
  writeFileSync('verification/artifacts/typography/typography-report.json', JSON.stringify(report, null, 2));
  await browser.close();
  await vite.close();
}
