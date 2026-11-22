import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const main=read('src/main.js');
const sliceAfter=(needle,length=500)=>{const i=main.indexOf(needle);assert.ok(i>=0,`missing ${needle}`);return main.slice(i,i+length);};

test('keystrokes update only their own panel, never the app shell (BY-14)',()=>{
 // The listing filter handler may update the list; it must not re-run the app render.
 const search=sliceAfter("document.querySelector('#search').addEventListener('input'");
 assert.match(search,/updateSampleResults\(\)/);
 assert.doesNotMatch(search,/render\(\)/);
 // The shell render is only reachable from the boot path and the language switch.
 const calls=[...main.matchAll(/(?<!function )(?<![.\w])render\(\)/g)].map(match=>match.index);
 assert.equal(calls.length,2,`unexpected render() call sites: ${calls.length}`);
 assert.ok(main.slice(main.indexOf('function render()'),main.indexOf('function render()')+40));
});

test('switching language keeps the reader in place and does not steal focus by scrolling (BY-14)',()=>{
 const handler=sliceAfter("document.querySelector('#language').addEventListener('change'",700);
 assert.match(handler,/const y=window\.scrollY/);
 assert.match(handler,/state\.language=e\.target\.value/);
 assert.match(handler,/window\.scrollTo\(\{top:y,behavior:'instant'\}\)/);
 assert.match(handler,/focus\(\{preventScroll:true\}\)/);
 assert.ok(handler.indexOf('render()')<handler.indexOf('window.scrollTo'),'scroll must be restored after the render');
});

test('one scroll-offset mechanism for anchored sections (BY-15)',()=>{
 const style=read('src/style.css');
 assert.match(style,/html\{scroll-padding-top:112px\}/);
 assert.match(style,/scroll-padding-top:92px/);
 for(const file of ['src/editorial-repair.css','src/homepage-flow.css','src/workspace-theme.css','src/guided-entry.css','src/analysis-workspace.css']){
  assert.doesNotMatch(read(file),/scroll-margin-top/,`${file} must not stack a second scroll offset`);
 }
});
