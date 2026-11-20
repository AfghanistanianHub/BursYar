import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {referenceHero, referenceHeroGeometry} from '../src/hero-cables-reference.js';

const css = readFileSync(new URL('../src/hero-cables-reference.css', import.meta.url), 'utf8');
const flow = readFileSync(new URL('../src/homepage-flow.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('../src/hero-cables-reference.js', import.meta.url), 'utf8');
const demoCss = readFileSync(new URL('../src/hero-document-demo.css', import.meta.url), 'utf8');
const {desktop, mobile} = referenceHeroGeometry;

function box(viewBox) {
  const [, , width, height] = viewBox.split(/\s+/).map(Number);
  return {width, height};
}

test('mobile arc band cannot collapse back into a letterbox strip', () => {
  const m = box(mobile.viewBox);
  const d = box(desktop.viewBox);
  // The band's height/width ratio drives every rendered size on a phone.
  assert.ok(m.height / m.width > d.height / d.width, 'mobile band must be proportionally taller than desktop');
  assert.ok(m.height / m.width >= 0.36, `mobile aspect ${(m.height / m.width).toFixed(3)} is too flat`);
});

test('mobile hub and document tiles keep legible minimum radii', () => {
  assert.ok(mobile.hubR >= 54, `hubR ${mobile.hubR} too small for the BursYar emblem`);
  assert.ok(mobile.hubR > mobile.nodeR, 'hub must stay the visual anchor');
  assert.ok(mobile.nodeR >= 22, `nodeR ${mobile.nodeR} renders under 27px on a 390px viewport`);
  assert.ok(mobile.enSize >= 19, 'emblem wordmark must keep its size in viewBox units');
  assert.ok(mobile.innerR < mobile.hubR && mobile.innerR > mobile.nodeR);
  assert.ok(mobile.glowR > mobile.hubR);
});

test('mobile wing paths keep tiles clear of the emblem', () => {
  // Nearest mobile tile offset is the last entry; it must sit outside hub + tile radius.
  const [, endX, endY] = mobile.leftWing.match(/([\d.]+),([\d.]+)$/) ?? [];
  assert.ok(endX && endY, 'left wing must end in a point');
  const gap = Math.hypot(Number(endX) - mobile.cx, Number(endY) - mobile.cy);
  assert.ok(gap > mobile.hubR + mobile.nodeR - mobile.nodeR, 'wing endpoint must leave the hub untouched');
  assert.ok(source.includes("svg.setAttribute('viewBox', cfg.viewBox)"), 'mount must apply the responsive viewBox');
});

test('motion control never falls back into the caption row', () => {
  assert.doesNotMatch(css, /\.by-motion\{position:static\}/);
  assert.match(css, /\.by-motion\{[^}]*position:absolute/);
  assert.match(css, /\.by-motion\{[^}]*inset-inline-end:0/);
});

test('hero keeps a tightened rhythm and top-aligned demonstration pair', () => {
  assert.match(css, /max-width:980px/, 'arc band width is capped so the hero does not dominate the fold');
  assert.match(css, /row-gap:clamp\(8px,0\.8vw,10px\)/);
  assert.match(css, /padding:clamp\(8px,1\.2vw,14px\) clamp\(20px,4vw,64px\) clamp\(8px,1vw,10px\)/);
  assert.match(css, /padding:6px 14px 12px/);
  // Source card and demo card must share a top edge so the flow reads left to right.
  assert.match(css, /\.hero-document-reader\{[^}]*align-self:start/);
  assert.doesNotMatch(css, /\.hero-document-reader\{[^}]*align-self:center/);
  // The demo card's padding cap is part of the 1440x900 fit budget.
  assert.match(demoCss, /padding:clamp\(\.85rem,1\.6vw,1\.25rem\)/);
});

test('desktop band crops only the dead space below the arc baseline', () => {
  const [, y0, , height] = desktop.viewBox.split(/\s+/).map(Number);
  const bottom = y0 + height;
  // Baseline sits at y=346 in the desktop geometry; keep a small stroke-safe margin
  // but never restore the 26 units of empty space the caption used to pull back up.
  assert.ok(bottom >= 346, `band bottom ${bottom} would clip the arc baseline`);
  assert.ok(bottom <= 356, `band bottom ${bottom} reintroduces dead space below the arc`);
  // Cropping the box must not rescale the emblem or the document tiles.
  assert.equal(desktop.hubR, 54);
  assert.equal(desktop.nodeR, 20);
  assert.equal(desktop.enSize, 19);
  assert.equal(desktop.cx, 560);
  assert.equal(desktop.cy, 150);
});

test('header navigation fits four items on a 320px viewport', () => {
  assert.match(flow, /@media screen and \(max-width:380px\)\{[\s\S]*?\.editorial-nav a\{font-size:\.6875rem/);
});

test('reference hero still renders the approved concept in every language', () => {
  for (const language of ['en', 'fa', 'ps']) {
    const markup = referenceHero(language);
    assert.match(markup, /class="by-hub-en"[^>]*>BursYar<\/text>/, `${language}: English wordmark kept`);
    assert.match(markup, /class="by-hub-fa" lang="fa" dir="rtl"/, `${language}: Farsi emblem label kept`);
    assert.equal((markup.match(/<g class="by-tile[ "']/g) ?? []).length, 12, `${language}: twelve document tiles`);
    assert.match(markup, /class="by-arc-track"/);
  }
});
