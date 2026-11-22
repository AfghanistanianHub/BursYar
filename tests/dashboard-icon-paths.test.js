import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dashboardRoutes} from '../src/dashboard-route.js';

const source = readFileSync(new URL('../src/student-dashboard.js', import.meta.url), 'utf8');
const pathsBlock = source.match(/const paths = \{([\s\S]*?)\n\};/)?.[1] ?? '';
const iconNames = [...pathsBlock.matchAll(/^\s*([a-zA-Z]+):\s*'/gm)].map(match => match[1]);

test('every dashboard icon path is defined', () => {
  assert.ok(iconNames.length >= 8, 'could not read the dashboard icon paths');
  for (const name of iconNames) assert.ok(pathsBlock.match(new RegExp(`^\\s*${name}:\\s*'[^']+'`, 'm')), `${name} path is empty`);
});

test('every dashboard route has its own icon path', () => {
  for (const key of Object.keys(dashboardRoutes)) assert.ok(iconNames.includes(key), `route ${key} has no icon path`);
});

test('no icon call names a path that does not exist (verifications regression)', () => {
  const calls = [...source.matchAll(/icon\(([^)]*)\)/g)].map(match => match[1]).filter(arg => !arg.startsWith('name'));
  for (const arg of calls) {
    for (const literal of [...arg.matchAll(/'([a-zA-Z]+)'/g)].map(match => match[1])) {
      assert.ok(iconNames.includes(literal), `icon('${literal}') has no matching path`);
    }
  }
  // The nav must render the route's own icon, never a renamed alias.
  assert.match(source, /dashboard-nav-link[^`]*\$\{icon\(key\)\}/);
  assert.doesNotMatch(source, /icon\(key ===/);
});
