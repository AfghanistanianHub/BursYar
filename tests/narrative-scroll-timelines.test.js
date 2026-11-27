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

test('entrances for text-bearing cards rise instead of fading', () => {
 // A fade put visible copy at 2.3–4.1:1 contrast; only decorative artwork fades.
 for(const name of ['by-story-paper-arrive','by-story-guidance-arrive','by-discovery-marker-enter'])assert.doesNotMatch(keyframes(name),/opacity/);
 assert.match(keyframes('bursyar-story-artwork'),/opacity/);
});
