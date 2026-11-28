// Narrative visual gate: regenerates the document-fragment frames cited by
// docs/DEFECT-REGISTER.md (NARR-01, NARR-02) and checks the scene still behaves.
//
// The editorial scene claims a document's evidence connects to requirements, so
// the six fragments have to leave the highlighted line, ride both connector lanes
// and come to rest at the outcome cards — in all three languages, at desktop and
// phone width, and frozen at their resting distance under reduced motion. A
// screenshot alone would happily capture a scene whose animation had silently
// stopped, so each frame is paired with the measurements that make it meaningful.
//
// Usage: npm run build && node verification/narrative-visual.mjs
// Output: verification/artifacts/narrative/story-<lang>-<width>[-reduced].png
//         verification/artifacts/narrative/report.json
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {preview} from 'vite';

const OUT=new URL('../verification/artifacts/narrative/',import.meta.url);
mkdirSync(OUT,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:0,strictPort:false}});
const base=`http://127.0.0.1:${server.httpServer.address().port}/`;
const report=[];
let failures=0;

// Where the scene sits and what its fragments are doing, at any scroll position.
const sample=page=>page.evaluate(()=>{
 const particles=[...document.querySelectorAll('.by-story-particle')];
 const route=document.querySelector('.by-story-route');
 const visual=document.querySelector('.by-story-visual');
 const first=particles[0]?getComputedStyle(particles[0]):null;
 return {
  fragments:particles.length,
  offsetPath:first?first.offsetPath:null,
  offsetDistances:particles.map(p=>getComputedStyle(p).offsetDistance),
  restingDistances:particles.map(p=>getComputedStyle(p).getPropertyValue('--d').trim()),
  opacity:particles.map(p=>getComputedStyle(p).opacity),
  animationName:first?first.animationName:null,
  timelines:particles.map(p=>getComputedStyle(p).animationTimeline),
  routeTransform:route?getComputedStyle(route).transform:null,
  visualWidth:visual?Math.round(visual.getBoundingClientRect().width):null,
  docOverflow:document.documentElement.scrollWidth-innerWidth,
 };
});

// Park the scene so its view() timelines are mid-flight, or just entering.
const pose=async(page,position)=>{
 await page.evaluate(where=>{
  const el=document.querySelector('#top>.by-story-scene');
  const rect=el.getBoundingClientRect();
  const top=rect.top+scrollY;
  const target=where==='centred'
   ? top+rect.height/2-innerHeight/2
   : top-innerHeight+120;
  window.scrollTo({top:Math.max(0,target),behavior:'instant'});
 },position);
 await page.waitForTimeout(220);
};

const browser=await chromium.launch({
 args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
 executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
try{
 for(const language of ['en','fa','ps']){
  const rtl=language!=='en';
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
   for(const reduced of [false,true]){
    const context=await browser.newContext({viewport,reducedMotion:reduced?'reduce':'no-preference'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error).slice(0,200)));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text().slice(0,200));});
    await page.addInitScript(lang=>localStorage.setItem('bursyar-language',lang),language);
    await page.goto(base,{waitUntil:'networkidle'});
    await page.waitForSelector('#top>.by-story-scene');

    await pose(page,'entering');
    const entering=await sample(page);
    await pose(page,'centred');
    const centred=await sample(page);
    const name=`story-${language}-${viewport.width}${reduced?'-reduced':''}`;
    await page.locator('#top>.by-story-scene').screenshot({path:`${OUT.pathname}${name}.png`});

    const problems=[];
    const expect=(ok,message)=>{if(!ok)problems.push(message);};
    expect(centred.fragments===6,`expected 6 fragments, found ${centred.fragments}`);
    expect(centred.offsetPath&&centred.offsetPath!=='none','fragments are not placed on a lane');
    expect(centred.docOverflow<=1,`horizontal overflow ${centred.docOverflow}px`);
    expect(errors.length===0,`console errors ${JSON.stringify(errors.slice(0,3))}`);
    // The connector has to point from the document to the cards in both directions.
    const mirrored=/^matrix\(-1,\s*0,\s*0,\s*1/.test(centred.routeTransform??'');
    expect(mirrored===rtl,`connector mirroring is ${mirrored} in ${language}`);

    if(reduced){
     // One static frame: no animation, every fragment at its authored resting spot.
     expect(centred.animationName==='none',`fragments still animate (${centred.animationName})`);
     expect(centred.opacity.every(value=>value==='1'),`fragments are not fully opaque (${centred.opacity.join(',')})`);
     for(const [index,distance] of centred.offsetDistances.entries()){
      const resting=centred.restingDistances[index];
      expect(distance===resting,`fragment ${index+1} rests at ${distance}, not ${resting}`);
     }
    }else{
     expect(centred.animationName==='by-story-particle-travel',`fragments lost their travel animation (${centred.animationName})`);
     expect(centred.timelines.every(timeline=>timeline==='view()'),`fragments lost their view() timelines (${centred.timelines.join(',')})`);
     // Scroll-linked, not a fixed offset: the same fragments must sit elsewhere
     // when the scene is only entering the viewport.
     const moved=centred.offsetDistances.some((distance,index)=>distance!==entering.offsetDistances[index]);
     expect(moved,`fragments did not move with scroll (${entering.offsetDistances.join(',')} -> ${centred.offsetDistances.join(',')})`);
    }

    const ok=problems.length===0;
    if(!ok)failures++;
    report.push({name,language,width:viewport.width,reduced,ok,problems,...centred,entering:{offsetDistances:entering.offsetDistances},shot:`verification/artifacts/narrative/${name}.png`});
    await context.close();
   }
  }
 }
}finally{
 await browser.close();
 await server.close();
}

writeFileSync(`${OUT.pathname}report.json`,JSON.stringify({passed:failures===0,cases:report},null,1));
for(const entry of report){
 console.log(`${entry.ok?'PASS':'FAIL'} ${entry.language} ${entry.width}${entry.reduced?' reduced':''} lane A=${entry.offsetDistances.slice(0,3).join('/')} lane B=${entry.offsetDistances.slice(3).join('/')} ${entry.ok?'':`— ${entry.problems.join('; ')}`}`);
}
console.log(failures?`\n${failures} failing cases — see ${OUT.pathname}report.json`:`\nAll ${report.length} narrative cases passed.`);
process.exit(failures?1:0);
