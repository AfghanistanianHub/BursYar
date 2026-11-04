// M18 capture: live public flows from production (read-only; no sign-in,
// no uploads, no analysis requests, no inference). Output: footage/*.webm.
import {chromium} from '@playwright/test';
import {mkdirSync, renameSync} from 'node:fs';
const OUT = new URL('../footage/', import.meta.url).pathname;
mkdirSync(OUT, {recursive: true});
const browser = await chromium.launch({headless: true});
async function scene(name, fn) {
  console.log('scene:', name);
  const context = await browser.newContext({viewport: {width: 1920, height: 1080}, recordVideo: {dir: OUT, size: {width: 1920, height: 1080}}});
  const page = await context.newPage();
  await page.goto('https://bursyar.vercel.app/', {waitUntil: 'networkidle', timeout: 60000});
  await page.locator('#workspace-overview').waitFor({timeout: 30000});
  await fn(page);
  await page.waitForTimeout(1500);
  const path = await page.video().path();
  await context.close();
  renameSync(path, `${OUT}/${name}.webm`);
}
await scene('01-landing', async page => {
  await page.waitForTimeout(3000);
  await page.locator('.journey-nav').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  await page.locator('#assistant').scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);
});
await scene('02-discovery', async page => {
  await page.locator('.resources').evaluate(el => { el.open = true; });
  await page.locator('#research-explorer-mount').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  await page.locator('#research-search').fill('Gates');
  await page.waitForTimeout(2500);
  await page.locator('#research-search').fill('');
  await page.locator('#research-country').selectOption('Canada');
  await page.waitForTimeout(2500);
  await page.locator('#research-country').selectOption('all');
  await page.waitForTimeout(2000);
});
await scene('03-source-gate', async page => {
  await page.locator('#assistant').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.locator('#source-url').fill('https://www.bristol.ac.uk/students/support/finances/scholarships/think-big-scholarships/');
  await page.waitForTimeout(1500);
  await page.locator('#fetch-source').click();
  await page.waitForTimeout(6000);
});
await scene('04-eligibility', async page => {
  await page.locator('#eligibility-example > summary').click();
  await page.locator('#eligibility-demo').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  await page.locator('#eligibility-form select[name=degree]').selectOption('bachelor');
  await page.waitForTimeout(2000);
  await page.locator('#eligibility-form input[name=hasTest]').check();
  await page.waitForTimeout(2000);
  await page.locator('.scenarios > summary').click();
  await page.waitForTimeout(1200);
  await page.locator('#eligibility-simulate').click();
  await page.locator('#eligibility-future').scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);
});
await scene('05-languages', async page => {
  await page.locator('#workspace-overview').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.locator('#language').selectOption('fa');
  await page.waitForTimeout(3000);
  await page.locator('#language').selectOption('ps');
  await page.waitForTimeout(3000);
  await page.locator('#language').selectOption('en');
  await page.waitForTimeout(2000);
});
await browser.close();
console.log('saved to', OUT);
