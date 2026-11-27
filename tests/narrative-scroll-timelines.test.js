import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../src/homepage-flow.css',import.meta.url),'utf8');
const block=selector=>{
 const start=css.indexOf(selector);
 assert.ok(start>=0,`missing ${selector}`);
 return css.slice(start,css.indexOf('}',start)+1);
};

test('scene clipping does not turn the scene into a scroll container', () => {
 // overflow:hidden makes the scene the nearest scrollport for its children, so
 // every view() timeline inside it freezes at one progress value: the paper and
 // the markers never moved as the reader scrolled.
 for(const selector of ['#top>.by-story-scene{','#top>.by-discovery-scene{']){
  const rule=block(selector);
  assert.match(rule,/overflow:clip/);
  assert.doesNotMatch(rule,/overflow:hidden/);
 }
});

const keyframes=name=>{
 const start=css.indexOf(`@keyframes ${name}`);
 assert.ok(start>=0,`missing @keyframes ${name}`);
 let depth=0;
 for(let i=css.indexOf('{',start);i<css.length;i++){
  if(css[i]==='{')depth++;
  else if(css[i]==='}'&&--depth===0)return css.slice(start,i+1);
 }
 assert.fail(`unterminated @keyframes ${name}`);
};

test('the document particle transition rides the evidence lanes', () => {
 // The approved narrative shows fragments leaving the document for the outcome
 // cards. Without an offset-path they would all stack at the SVG origin.
 const particles=css.slice(css.indexOf('.by-story-particles{'));
 assert.match(particles,/offset-path:path\("M196 170/);
 assert.match(particles,/offset-path:path\("M280 170/);
 assert.match(css,/@keyframes by-story-particle-travel\{[\s\S]*?offset-distance/);
 const travel=keyframes('by-story-particle-travel');
 assert.match(travel,/offset-distance:var\(--d/);
 // Reduced motion keeps the fragments where extraction left them.
 assert.match(css,/@media \(prefers-reduced-motion:reduce\)\{[\s\S]*?by-story-particle\{offset-distance:var\(--d/);
 // The connector has to point at the cards in RTL too.
 assert.match(css,/html\[dir=rtl\] \.by-story-route\{transform:scaleX\(-1\)\}/);
});

test('the story markup carries a reader shell and both outcome lanes', () => {
 const markup=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(markup,/by-story-paper-chrome/);
 assert.match(markup,/by-story-paper-caret/);
 for(const lane of ['by-story-lane-a','by-story-lane-b'])assert.match(markup,new RegExp(lane));
 // Six fragments, each with its own resting distance along a lane.
 const fragments=markup.match(/by-story-particle by-story-particle-[ab]" r="[\d.]+" style="--d:\d+%"/g)??[];
 assert.equal(fragments.length,6);
});

test('entrances for text-bearing cards rise instead of fading', () => {
 // A fade put visible copy at 2.3–4.1:1 contrast; only decorative artwork fades.
 for(const name of ['by-story-paper-arrive','by-story-guidance-arrive','by-discovery-marker-enter'])assert.doesNotMatch(keyframes(name),/opacity/);
 assert.match(keyframes('bursyar-story-artwork'),/opacity/);
});
