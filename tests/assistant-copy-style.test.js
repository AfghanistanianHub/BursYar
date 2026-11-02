import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const style = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

test('assistant helper copy hook is styled as muted panel intro', () => {
  assert.match(main, /assistant-copy/);
  assert.match(style, /\.assistant-copy\{[^}]*font-size:var\(--fs-small\)/);
  assert.match(style, /\.assistant-copy\{[^}]*color:var\(--muted\)/);
});
