// Accessibility gate for the scroll-driven narrative.
//
// The landing page animates whole sections with native view timelines. A static
// axe run only ever sees one scroll position, which is how a 0.55 entrance fade
// shipped twice: the text was readable after the animation finished and unreadable
// while it was still entering. This gate sweeps the page in viewport steps and
// measures contrast at every position, in all three languages, at phone and
// desktop width, and proves the narrative animations still run.
//
// Usage: npm run build && node verification/animation-accessibility.mjs
import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import {preview} from 'vite';

const require=createRequire(import.meta.url);
const axePath=require.resolve('axe-core/axe.min.js');
const server=await preview({preview:{host:'127.0.0.1',port:0,strictPort:false}});
const base=`http://127.0.0.1:${server.httpServer.address().port}`;
const failures=[];
const check=(ok,message)=>{if(!ok)failures.push(message);return ok;};

const browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
try{
 for(const language of ['en','fa','ps']){
  for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
   const context=await browser.newContext({viewport});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
   await page.addInitScript(lang=>localStorage.setItem('bursyar-language',lang),language);
   await page.goto(base+'/',{waitUntil:'networkidle'});
   await page.addScriptTag({path:axePath});
   const label=`${language} ${viewport.width}px`;

   // The narrative sections must still animate: a contrast fix that silently
   // removed the motion would pass every axe run and lose the design.
   const narrative=await page.evaluate(()=>{
    // The animated nodes are the cards and markers inside the scenes, not the
    // scenes themselves.
    const paper=document.querySelector('.by-story-paper');
    const marker=document.querySelector('.by-discovery-marker');
    const particle=document.querySelector('.by-story-particle');
    const route=document.querySelector('.by-story-route');
    const read=el=>el?{timeline:getComputedStyle(el).animationTimeline,name:getComputedStyle(el).animationName}:null;
    return {paper:read(paper),marker:read(marker),particle:read(particle),
     onLane:particle?getComputedStyle(particle).offsetPath!=='none':false,
     routeTransform:route?getComputedStyle(route).transform:null};
   });
   check(narrative.paper?.timeline==='view()',`${label}: story paper lost its view timeline (${JSON.stringify(narrative.paper)})`);
   check(narrative.marker?.timeline==='view()',`${label}: discovery marker lost its view timeline (${JSON.stringify(narrative.marker)})`);
   // Document-specific particle transition: the fragments must ride the evidence
   // lanes and be driven by the scroll, not by a fixed position or a timer.
   check(narrative.particle?.timeline==='view()',`${label}: document particles lost their view timeline (${JSON.stringify(narrative.particle)})`);
   check(narrative.onLane,`${label}: document particles are not placed on an evidence lane`);
   // The connector has to point from the document to the outcome cards. In RTL the
   // paper and cards swap sides while the SVG geometry does not, so it must mirror.
   const mirrored=/^matrix\(-1,\s*0,\s*0,\s*1/.test(narrative.routeTransform??'');
   check(language==='en'?!mirrored:mirrored,`${label}: story connector is not mirrored for the reading direction (${narrative.routeTransform})`);

   const height=await page.evaluate(()=>document.documentElement.scrollHeight);
   const step=Math.max(200,Math.round(viewport.height*0.75));
   const positions=[];
   for(let y=0;y<height;y+=step)positions.push(y);
   positions.push(Math.max(0,height-viewport.height));
   const seen=new Set();
   for(const y of positions){
    await page.evaluate(top=>window.scrollTo({top,behavior:'instant'}),y);
    await page.waitForTimeout(120);
    const result=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'rule',values:['color-contrast']}}));
    for(const violation of result.violations){
     for(const node of violation.nodes){
      const key=node.target.join(' ');
      if(seen.has(key))continue;
      seen.add(key);
      failures.push(`${label} @${y}px ${key}: ${(node.failureSummary??'').split('\n').slice(1,2).join(' ').trim()}`);
     }
    }
   }
   // The motion itself must be scroll-linked: a fixed translate would mean the
   // view timeline stopped driving the scene.
   const motion=await page.evaluate(async()=>{
    const paper=document.querySelector('.by-story-paper');
    const particle=document.querySelector('.by-story-particle');
    if(!paper)return null;
    const top=paper.getBoundingClientRect().top+scrollY;
    const settle=async y=>{window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));};
    const sample=async y=>{await settle(y);return {paper:getComputedStyle(paper).translate,particle:particle?getComputedStyle(particle).offsetDistance:null};};
    const entering=await sample(Math.max(0,top-innerHeight+60));
    const centred=await sample(Math.max(0,top-innerHeight/2));
    return {entering,centred};
   });
   check(motion&&motion.entering.paper!==motion.centred.paper,`${label}: the story paper no longer moves with scroll (${JSON.stringify(motion)})`);
   check(motion&&motion.entering.particle!==motion.centred.particle,`${label}: the document particles do not travel with scroll (${JSON.stringify(motion)})`);

   // Reduced motion must show the same content with no animation at all.
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   await page.waitForTimeout(100);
   const reduced=await page.evaluate(()=>{
    const animated=[...document.querySelectorAll('#top *')].filter(el=>getComputedStyle(el).animationName!=='none');
    const paper=document.querySelector('.by-story-paper');
    return {animated:animated.length,opacity:paper?getComputedStyle(paper).opacity:null};
   });
   check(reduced.animated===0,`${label}: ${reduced.animated} elements still animate under prefers-reduced-motion`);
   check(reduced.opacity==='1',`${label}: reduced-motion story paper is not fully opaque (${reduced.opacity})`);

   check(errors.length===0,`${label}: console errors ${JSON.stringify(errors.slice(0,3))}`);
   await context.close();
  }
 }
}finally{
 await browser.close();
 await server.close();
}

if(failures.length){
 console.error(JSON.stringify({event:'animation_accessibility',passed:false,failures:failures.slice(0,20)},null,2));
 process.exit(1);
}
console.log(JSON.stringify({event:'animation_accessibility',passed:true,cases:6}));
