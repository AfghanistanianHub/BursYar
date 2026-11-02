// Renders the Mission 09/10 title cards (repo-local HTML) to 1920x1080 PNGs.
// Run: node verification/video-production/render-cards.mjs [out-dir]
// Default output: verification/artifacts/m09/cards/
import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const dest = process.argv[2] ?? join(here, '..', 'artifacts', 'm09', 'cards');
mkdirSync(dest, {recursive: true});
const browser = await chromium.launch({headless: true});
for (const c of ['card-problem', 'card-meta', 'card-impact']) {
  const page = await (await browser.newContext({viewport: {width: 1920, height: 1080}})).newPage();
  await page.goto('file://' + join(here, 'cards', c + '.html'));
  await page.screenshot({path: join(dest, c + '.png')});
  console.log('rendered', c);
}
await browser.close();
