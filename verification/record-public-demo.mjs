// Records public, read-only production flows for submission video scenes.
// No sign-in, no uploads, no analysis requests, no inference.
// Run: node verification/record-public-demo.mjs  (output: verification/artifacts/demo-public-flows.webm)
import {chromium} from '@playwright/test';
const OUT = 'verification/artifacts/demo-public-flows.webm';
const rm = await import('node:fs').then(fs => { try { fs.rmSync(OUT); } catch {} });
const browser = await chromium.launch({headless: true});
const context = await browser.newContext({viewport: {width: 1280, height: 720}, recordVideo: {dir: 'verification/artifacts', size: {width: 1280, height: 720}}});
const page = await context.newPage();
const step = async (name, fn) => { console.log('scene:', name); await fn(); await page.waitForTimeout(1200); };
await step('load + workspace overview', async () => {
  await page.goto('https://bursyar.vercel.app/', {waitUntil: 'networkidle', timeout: 60000});
  await page.locator('#workspace-overview').waitFor({timeout: 30000});
});
await step('journey + assistant', async () => {
  await page.locator('.journey-nav').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator('#assistant').scrollIntoViewIfNeeded();
});
await step('open resources + research explorer', async () => {
  await page.locator('.resources').evaluate(el => { el.open = true; });
  await page.locator('#research-explorer').scrollIntoViewIfNeeded();
});
await step('research search Gates', async () => {
  await page.locator('#research-search').fill('Gates');
  await page.waitForTimeout(800);
});
await step('research filters', async () => {
  await page.locator('#research-search').fill('');
  await page.locator('#research-country').selectOption('Canada');
  await page.waitForTimeout(800);
  await page.locator('#research-country').selectOption('all');
});
await step('empty state', async () => {
  await page.locator('#search').fill('zzzznoresults');
  await page.waitForTimeout(800);
  await page.locator('#search').fill('');
});
await step('switch to Farsi (RTL)', async () => {
  await page.locator('#language').selectOption('fa');
  await page.locator('#workspace-overview').scrollIntoViewIfNeeded();
});
await step('switch to Pashto (RTL)', async () => {
  await page.locator('#language').selectOption('ps');
  await page.waitForTimeout(800);
});
await step('back to English', async () => {
  await page.locator('#language').selectOption('en');
  await page.locator('#top').scrollIntoViewIfNeeded();
});
await page.screenshot({path: 'verification/artifacts/demo-public-flows-cover.png'});
await context.close();
await browser.close();
// Playwright names the file per-page; move it to the stable name.
const fs = await import('node:fs');
const files = fs.readdirSync('verification/artifacts').filter(f => f.endsWith('.webm') && f !== 'demo-public-flows.webm');
if (files.length === 1) { fs.renameSync('verification/artifacts/' + files[0], OUT); }
const st = fs.statSync(OUT);
console.log('saved', OUT, Math.round(st.size / 1024) + 'KB');
