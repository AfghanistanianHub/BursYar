import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
const theme = readFileSync(new URL('../src/workspace-theme.css', import.meta.url), 'utf8');
const srcFiles = readdirSync(new URL('../src', import.meta.url)).filter((f) => f.endsWith('.js'));
const src = srcFiles.map((f) => readFileSync(new URL('../src/' + f, import.meta.url), 'utf8')).join('\n');

test('M15 workflow band uses 2 columns on tablet, 4 on desktop', () => {
  assert.match(theme, /@media\(min-width:700px\) and \(max-width:1023px\)\{\.how-it-works ol\{grid-template-columns:repeat\(2,1fr\)\}\}/);
  assert.match(theme, /@media\(min-width:1024px\)\{\.how-it-works ol\{grid-template-columns:repeat\(4,1fr\)\}\}/);
  assert.match(theme, /@media\(min-width:1024px\)\{\.how-it-works ol::before\{/);
});

test('M15 product name is consistently بورس‌یار across source', () => {
  assert.doesNotMatch(src, /بورسیار/);
  assert.match(src, /بورس‌یار/);
});

test('M15 corrected fa/ps terminology is present, errors gone', () => {
  assert.doesNotMatch(src, /جزیات/);
  assert.doesNotMatch(src, /وړتیا/);
  assert.doesNotMatch(src, /شرایط من/);
  assert.doesNotMatch(src, /«نشد»/);
  assert.match(src, /صلاحیت من/);
  assert.match(src, /وړتوب/);
  assert.match(src, /جزئیات/);
});
