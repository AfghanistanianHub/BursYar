// Runs verification/browser.mjs once per language, in parallel, and merges the
// reports. Each child keeps the full width matrix and its own Vite server, API
// server and temporary document database, so no state is shared and no assertion
// is skipped: the only thing that changes is how long the suite takes.
//
// BROWSER_PARALLEL=1 falls back to the serial suite.
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';

const started=Date.now();
const languages=['en','fa','ps'];
const parallel=process.env.BROWSER_PARALLEL!=='1';
const reportPath='verification/artifacts/browser-report.json';
const partPath=language=>`verification/artifacts/browser-report-${language}.json`;

if(!parallel){
 const child=spawn(process.execPath,['verification/browser.mjs'],{stdio:'inherit'});
 child.on('exit',code=>process.exit(code??1));
}else{
 for(const language of languages)if(existsSync(partPath(language)))rmSync(partPath(language));

 // Two at a time: the reference machine has two cores, and three Chromium
 // instances plus their Vite servers pushed it into swap.
 const queue=[...languages];
 const workers=Math.max(1,Math.min(Number(process.env.BROWSER_PARALLEL_N??2),languages.length));
 const runLanguage=language=>new Promise(resolve=>{
  const child=spawn(process.execPath,['verification/browser.mjs'],{
   stdio:['ignore','inherit','inherit'],
   env:{...process.env,BROWSER_LANGUAGE:language,BROWSER_REPORT:partPath(language)}
  });
  child.on('exit',code=>resolve({language,code:code??1}));
 });
 const results=await Promise.all(Array.from({length:workers},async()=>{
  const finished=[];
  for(let language=queue.shift();language;language=queue.shift())finished.push(await runLanguage(language));
  return finished;
 })).then(groups=>groups.flat());
 const failed=results.filter(result=>result.code!==0);

 const reports=languages.map(language=>{
  if(!existsSync(partPath(language)))return null;
  try{return JSON.parse(readFileSync(partPath(language),'utf8'));}catch{return null;}
 }).filter(Boolean);
 const merged={
  mode:'BROWSER_WITH_MOCK_AUTH_AND_API',
  liveMetaVerified:false,
  liveGoogleSignInVerified:false,
  parallel:true,
  cases:reports.flatMap(report=>report.cases??[]),
  caseTimings:reports.flatMap(report=>report.caseTimings??[]),
  localCases:reports.reduce((total,report)=>total+(report.localCases??0),0)
 };
 merged.wallMs=Date.now()-started;
 writeFileSync(reportPath,JSON.stringify(merged,null,2));

 if(failed.length){
  console.error(JSON.stringify({event:'browser_parallel',passed:false,failed},null,2));
  process.exit(1);
 }
 if(merged.cases.length!==15){
  console.error(JSON.stringify({event:'browser_parallel',passed:false,reason:`expected 15 cases, merged ${merged.cases.length}`},null,2));
  process.exit(1);
 }
 const slowest=[...merged.caseTimings].sort((a,b)=>b.ms-a.ms).slice(0,3);
 console.log(JSON.stringify({event:'browser_parallel',passed:true,cases:merged.cases.length,wallSeconds:Math.round(merged.wallMs/1000),slowest}));
}
