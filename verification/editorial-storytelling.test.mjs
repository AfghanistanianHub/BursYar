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
 assert.ok(main.indexOf('by-discovery-scene')<main.indexOf('journey-more'));
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

test('landing narrative does not repeat the navigation or explanatory card grids',()=>{
 assert.ok(!main.includes('<nav class="story-index"'));
 assert.ok(!main.includes('<section class="how-it-works"'));
 assert.ok(!main.includes('<section class="editorial-pillars"'));
 assert.ok(!main.includes('<section class="editorial-study-band"'));
 assert.match(main,/class="guided-entry"/);
 assert.match(main,/class="pathfinder-dashboard"/);
 assert.match(main,/class="journey-more"/);
});


test('PathFinder links to real research destinations and uses a connected editorial layout',()=>{
 assert.match(main,/\['#research-explorer-mount','#documents-mount','#eligibility-mount','#research-explorer-mount','#next-steps'\]/);
 assert.ok(!main.includes("['#research-explorer','#documents-mount'"));
 assert.match(css,/Mission 51 — PathFinder/);
 assert.match(css,/pathfinder-timeline li::before/);
 assert.match(css,/pathfinder-live/);
 assert.match(css,/max-width:390px/);
});


test('profile and documents deep links mount the workspace inside its disclosure',()=>{
 for(const target of ["'profile-mount':'workspace'","'documents-mount':'workspace'","'academic-evidence-mount':'workspace'"]){
  assert.ok(main.includes(target),target);
 }
 assert.match(main,/const disclosure=target\.closest\('details'\)/);
 assert.match(main,/if\(disclosure\)disclosure\.open=true/);
});

test('PathFinder uses logical indentation in both text directions',()=>{
 const pathfinderCss=css.slice(css.indexOf('Mission 51 — PathFinder'));
 assert.match(pathfinderCss,/padding-inline:clamp\(20px,2\.3vw,32px\) 0/);
 assert.match(pathfinderCss,/html\[dir=rtl\]/);
 assert.match(pathfinderCss,/padding-inline:20px 0/);
});


test('language rerenders restore active lazy deep links',()=>{
 assert.match(main,/Language changes replace the entire DOM without changing location\.hash/);
 assert.match(main,/queueMicrotask\(\(\)=>\{/);
 assert.match(main,/location\.hash&&!location\.hash\.startsWith\('#\/'\)\)revealHashTarget\(\)/);
});


test('final PathFinder rules reset earlier physical offsets and transforms',()=>{
 const pathfinderCss=css.slice(css.indexOf('Mission 51 — PathFinder'));
 assert.match(pathfinderCss,/margin-inline:0/);
 assert.match(pathfinderCss,/top:auto/);
 assert.match(pathfinderCss,/transform:none/);
 assert.match(pathfinderCss,/inset-block-start:clamp/);
});


test('obsolete PathFinder timeline offsets are removed rather than overwritten',()=>{
 assert.ok(!css.includes('margin-inline-start:22px;padding-inline-start:25px'));
 assert.ok(!css.includes('margin-inline-start:14px;padding-inline-start:18px'));
 assert.ok(!css.includes('inset-inline-start:-31px;top:50%'));
 assert.match(css,/Mission 51 — PathFinder/);
});


test('removed landing sections do not retain dead homepage CSS',()=>{
 for(const dead of ['#top>.how-it-works','#top>.editorial-pillars','.editorial-study-band']){
  assert.ok(!css.includes(dead),'obsolete CSS target: '+dead);
 }
 assert.match(css,/#top>\.pathfinder-dashboard/);
 assert.match(css,/#top>\.by-story-scene/);
 assert.match(css,/#top>\.by-discovery-scene/);
});


test('responsive Hero contains localized copy and keeps CTAs reachable',()=>{
 const heroCss=css.slice(css.indexOf('Mission 52 — responsive Hero'));
 assert.ok(heroCss.length>100,'responsive Hero styles exist');
 assert.match(heroCss,/max-width:1023px/);
 assert.match(heroCss,/max-width:390px/);
 assert.match(heroCss,/html\[lang=fa\]/);
 assert.match(heroCss,/html\[lang=ps\]/);
 assert.match(heroCss,/flex-wrap:wrap/);
 assert.match(heroCss,/min-height:44px/);
 assert.match(main,/class="hero hero-with-cables"/);
});


test('ordinary deep links scroll after opening their disclosure',()=>{
 assert.match(main,/const opened=holders\.some\(details=>details&&!details\.open\)/);
 assert.match(main,/if\(opened\|\|id==='eligibility-mount'\)/);
 assert.match(main,/if\(location\.hash!=='#'\+id\|\|!target\.isConnected\)return/);
 assert.match(main,/destination\.scrollIntoView\(\{behavior:'instant',block:'start'\}\)/);
});


test('language rerenders preserve live document and assessment progress',()=>{
 assert.match(main,/let dashboard, signedIn=false, signedInUid, documentStatus, hasLocalAssessment=false/);
 assert.ok(!main.includes('mountJourney(document.querySelector(\'#journey-nav-mount\'),state.language);\nhasLocalAssessment=false;'));
 assert.ok(!main.includes('mountJourney(document.querySelector(\'#journey-nav-mount\'),state.language);\nhasLocalAssessment=false;\ndocumentStatus=undefined;'));
 assert.match(main,/document\.addEventListener\('bursyar:document-status'/);
 assert.match(main,/document\.addEventListener\('bursyar:local-next'/);
});


test('local next-step guidance survives a language shell rebuild without false translation',()=>{
 assert.match(main,/let lastLocalNextAction=null/);
 assert.match(main,/lastLocalNextAction=hasLocalAssessment\?\{text:event\.detail,language:state\.language\}:null/);
 assert.match(main,/p\.textContent=lastLocalNextAction\.text;p\.lang=lastLocalNextAction\.language/);
 assert.match(main,/if\(!active\)\{lastLocalNextAction=null;paintNextEmpty\(\);\}/);
});


test('new eligibility compilations invalidate stale next-step guidance and async callbacks',()=>{
 assert.match(main,/let nextActionsRevision=0/);
 assert.match(main,/nextActionsRevision\+\+/);
 assert.match(main,/const revision=\+\+nextActionsRevision/);
 assert.match(main,/const generation=mountGeneration/);
 assert.match(main,/lastLocalNextAction=null;\n document\.querySelector\('#next-actions'\)\?\.replaceChildren\(\)/);
 assert.match(main,/revision!==nextActionsRevision\|\|generation!==mountGeneration/);
 assert.match(main,/if\(!active\)hasLocalAssessment=false/);
});


test('cleared eligibility results cannot be restored from stale analyzer DOM',()=>{
 assert.match(main,/mountEligibility\(document\.querySelector\('#eligibility-mount'\),state\.language,latestCompilation\)/);
 assert.ok(!main.includes("latestCompilation??document.querySelector('#analyze-form')?.analysis?.data?.compilation"));
 assert.match(main,/analyzerInput\.analysis=null/);
 assert.match(main,/if\(form\)form\.analysis=null/);
});


test('eligibility never substitutes fictional rules for malformed live compilations',()=>{
 const eligibility=readFileSync(new URL('../src/eligibility-demo.js',import.meta.url),'utf8');
 assert.match(eligibility,/compilation==null\?fixture:\(Array\.isArray\(compilation\.rules\)\?compilation\.rules:\[\]\)/);
 assert.match(eligibility,/document\.addEventListener\('bursyar:compilation',\(\)=>\{lastScenario=false;lastExclusion=null;\}\)/);
});
