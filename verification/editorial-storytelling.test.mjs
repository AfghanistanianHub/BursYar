import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/homepage-flow.css',import.meta.url),'utf8');

test('editorial scenes appear once and preserve the approved hero',()=>{
 for(const id of ['by-story-heading','by-discovery-heading']){
  assert.equal(main.split('id="'+id+'"').length-1,1,id);
 }
 assert.match(main,/mountReferenceHero\(app,state\.language/);
 assert.ok(main.indexOf('by-story-scene')<main.indexOf('editorial-selected'));
 assert.ok(main.indexOf('editorial-selected')<main.indexOf('by-discovery-scene'));
 assert.ok(main.indexOf('by-discovery-scene')<main.indexOf('how-it-works'));
});

test('story scenes provide three languages and meaningful routes',()=>{
 for(const phrase of ['از مدرک تا فرصت','له سند څخه تر فرصت','FROM EVIDENCE TO OPPORTUNITY','کشف فرصت‌ها','فرصتونه ومومئ','DISCOVER POSSIBILITIES']){
  assert.ok(main.includes(phrase),phrase);
 }
 assert.match(main,/class="by-story-link" href="#guided-demo" data-open="#guided-demo"/);
 assert.match(main,/class="by-story-link" href="#research-explorer-mount" data-open="\.resources"/);
 assert.match(main,/Concept illustration/);
});

test('story motion has static fallback and responsive layouts',()=>{
 assert.match(css,/@supports\s*\(animation-timeline:\s*view\(\)\)/);
 assert.match(css, /prefers-reduced-motion:\s*reduce/);
 assert.match(css, /max-width:\s*390px/);
 assert.match(css, /by-discovery-scene/);
 assert.match(css, /by-story-scene/);
});


test('workspace shortcuts point to mounted destinations and hash routing waits for lazy content',()=>{
 const overview=readFileSync(new URL('../src/workspace-overview.js',import.meta.url),'utf8');
 for(const target of ["'assistant'","'research-explorer-mount'","'local-workflow-mount'","'profile-mount'"]){
  assert.ok(overview.includes(target),target);
 }
 assert.ok(!overview.includes("'source-url'"));
 assert.ok(!overview.includes("'local-assessment'"));
 assert.match(main,/const lazyShortcut=\{/);
 assert.match(main,/ensureMount\(lazyShortcut\)\.then/);
 assert.match(main,/target\.scrollIntoView/);
 assert.match(main,/location\.hash!=='#'\+id/);
});

test('all discovery CTAs resolve to the actual research explorer mount',()=>{
 const anchors=[...main.matchAll(/href="#research-explorer[^"]*" data-open="\.resources"/g)];
 assert.ok(anchors.length>0,'at least one research CTA is present');
 assert.ok(anchors.every(([anchor])=>anchor.includes('#research-explorer-mount')),'no CTA uses the missing research-explorer id');
 assert.match(main,/id="research-explorer-mount"/);
});


test('empty lazy mount shells remain observable for progressive loading',()=>{
 assert.match(main,/\['#workspace-overview','overview'\]/);
 assert.match(main,/\['#local-workflow-mount','offline'\]/);
 assert.match(main,/\['#eligibility-mount','eligibility'\]/);
 const emptyRules=css.slice(css.indexOf('Keep observed lazy mounts in layout:'));
 assert.ok(emptyRules.includes('display:block!important'),'observer targets must stay in layout');
 assert.ok(!emptyRules.includes('display:none!important'),'do not hide observer targets');
 assert.match(emptyRules,/min-height:1px!important/);
});
