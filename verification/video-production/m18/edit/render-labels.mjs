// M18: render lower-third label chips + end card via Chromium (perfect shaping).
// Run: node edit/render-labels.mjs  -> labels/*.png (transparent RGBA)
import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
mkdirSync(new URL('../labels/', import.meta.url).pathname, {recursive: true});
const OUT = p => new URL('../labels/' + p, import.meta.url).pathname;
const browser = await chromium.launch({headless: true});
const page = await (await browser.newContext({viewport: {width: 1920, height: 1080}})).newPage();
await page.setContent(`<body style="margin:0;background:transparent;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif">
<div id="live" style="display:inline-block;background:rgba(8,18,32,.88);color:#fff;font-size:38px;font-weight:600;padding:14px 30px;border-radius:14px;">LIVE · bursyar.vercel.app</div>
<div id="rehearsal" style="display:inline-block;background:rgba(120,20,20,.88);color:#fff;font-size:38px;font-weight:600;padding:14px 30px;border-radius:14px;">REHEARSAL · simulated services — synthetic data</div>
<div id="fixture" style="display:inline-block;background:rgba(8,18,32,.88);color:#ffd978;font-size:34px;font-weight:600;padding:12px 26px;border-radius:14px;">Synthetic fixture — not a real student</div>
<div id="runs" style="display:inline-block;background:rgba(8,18,32,.88);color:#fff;font-size:32px;padding:16px 30px;border-radius:14px;line-height:1.5;">Muse Spark run · local 2026-10-28 · d1bb0e0f… · 4 criteria + 2 funding validated<br>Muse Spark run · hosted 2026-11-01 · 5a58bff8… · 1 + 1 validated</div>
<div id="endcard" style="width:1920px;text-align:center;padding:40px 0;text-shadow:0 3px 18px rgba(0,0,0,.9);"><div style="color:#fff;font-size:120px;font-weight:800;letter-spacing:2px;">BursYar</div><div style="color:#e8eef5;font-size:52px;font-weight:500;margin-top:10px;">Opportunity should not be lost in translation.</div></div>
</body>`);
for (const [id, file] of [['live', 'chip-live.png'], ['rehearsal', 'chip-rehearsal.png'], ['fixture', 'chip-fixture.png'], ['runs', 'chip-runs.png'], ['endcard', 'endcard.png']]) {
  await page.locator('#' + id).screenshot({path: OUT(file), omitBackground: true});
  console.log('label:', file);
}
await browser.close();
