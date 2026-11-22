#!/usr/bin/env node
// BY-04 rehearsal: prove the release smoke's behaviour on a local host before the
// owner promotes anything. It serves the built `dist/` with a controllable
// backend commit and runs the real `scripts/release-smoke.mjs` against it three
// ways, plus the post-promotion "update RELEASE.md and re-run" step:
//
//   1. matching backend                -> exit 0, one known unmeasurable line
//   2. divergent backend               -> exit 1, exactly the parity failure
//   3. production enforcement, stale manifest rows
//                                      -> exit 1, exactly the two RELEASE.md rows
//   4. production enforcement, rows already updated
//                                      -> exit 0, nothing unmeasurable
//
// Run `npm run build` first: the frontend commit is read from the
// `<meta name="bursyar-build">` stamp in `dist/index.html`, exactly as the real
// check reads it. Scenarios 3 and 4 run that same unmodified script with
// BURSYAR_SMOKE_PRODUCTION_SCOPE=1 and BURSYAR_SMOKE_MANIFEST pointing at a
// temporary manifest, so nothing is patched and the code rehearsed is the code
// that will run against Production. Scenario 3's manifest holds the recorded
// production pair, so the expected failure stays reproducible after the real
// RELEASE.md is updated; override it with REHEARSAL_STALE_FRONTEND and
// REHEARSAL_STALE_BACKEND.
//
// What this cannot rehearse, and what still belongs to the owner: Vercel
// Deployment Protection (BY-01), the Vercel `/health` rewrite to Render, the
// Render build's own commit, and the `VERCEL_GIT_COMMIT_SHA` the promoted build
// was stamped with. Those are measured only by running the smoke against the
// real hostname.
//
//   node verification/rehearsal-smoke.mjs
//   node verification/rehearsal-smoke.mjs --verbose
//
// Exit code 0 only when every scenario behaves as expected.
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {execFileSync} from 'node:child_process';
import {mkdtemp, readFile, rm, stat, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {extname, join, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=fileURLToPath(new URL('.',import.meta.url));
const root=resolve(here,'..');
const smokeScript=join(root,'scripts','release-smoke.mjs');
const dist=join(root,'dist');
const verbose=process.argv.includes('--verbose');
const DIVERGENT='deadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
const staleFrontend=process.env.REHEARSAL_STALE_FRONTEND??'2162be3e21962db23bdb022586bdf0e491ffaa96';
const staleBackend=process.env.REHEARSAL_STALE_BACKEND??'7dbd75f6889ea09e96c129831bec40c463b6e64e';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff','.txt':'text/plain; charset=utf-8','.pdf':'application/pdf','.map':'application/json'};

const failures=[];
const check=(ok,message)=>{console.log(`${ok?'ok  ':'FAIL'} ${message}`);if(!ok)failures.push(message);};
const note=message=>console.log(`     ${message}`);
const gitCommit=()=>{
 try{return execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim().toLowerCase();}
 catch{return '';}
};

// ---- the local release host ------------------------------------------------
let backendCommit='';
const server=createServer(async (req,res)=>{
 const path=new URL(req.url,'http://rehearsal').pathname;
 if(path==='/health'){
  res.writeHead(200,{'content-type':'application/json'});
  res.end(JSON.stringify({ok:true,service:'bursyar-api-rehearsal',capabilities:{build:{commit:backendCommit}},commit:backendCommit}));
  return;
 }
 let file=resolve(join(dist,decodeURIComponent(path)));
 if(file!==dist&&!file.startsWith(dist+sep)){res.writeHead(403,{'content-type':'text/plain'});res.end('forbidden');return;}
 try{ if(!(await stat(file)).isFile())throw new Error('directory'); }
 catch{ file=join(dist,'index.html'); }
 try{
  const body=await readFile(file);
  res.writeHead(200,{'content-type':types[extname(file)]??'application/octet-stream'});
  res.end(body);
 }catch{
  res.writeHead(404,{'content-type':'text/plain'});
  res.end('not found');
 }
});

function runSmoke(script,base,extraEnv={}){
 return new Promise(resolveRun=>{
  const child=spawn(process.execPath,[script,base],{cwd:root,env:{...process.env,BURSYAR_SMOKE_HEALTH_TIMEOUT_MS:process.env.BURSYAR_SMOKE_HEALTH_TIMEOUT_MS??'5000',...extraEnv}});
  let out='',err='';
  child.stdout.on('data',chunk=>{out+=chunk;});
  child.stderr.on('data',chunk=>{err+=chunk;});
  child.on('close',code=>resolveRun({code,out,err}));
 });
}

function report(run){
 // The smoke prints its JSON to stdout when it passes and to stderr when it fails.
 const text=run.code===0?run.out:run.err;
 const start=text.indexOf('{');
 try{return JSON.parse(text.slice(start));}catch{return {passed:run.code===0,failures:[],unmeasurable:[]};}
}

function show(run){
 if(verbose)console.log(`${run.out}${run.err}`.replace(/^/gm,'       '));
 else{
  const lines=`${run.out}${run.err}`.split('\n').filter(line=>/^(PASS|FAIL|INFO) /.test(line));
  for(const line of lines)console.log(`       ${line}`);
 }
}

function manifest(frontend,backend){
 return `# Rehearsal manifest\n\n| Production frontend branch and commit | \`main\` — \`${frontend}\` |\n| Backend production SHA | \`${backend}\` |\n`;
}

async function main(){
 let stamp='';
 try{
  stamp=(await readFile(join(dist,'index.html'),'utf8')).match(/<meta name="bursyar-build" content="([0-9a-f]{7,40})"/i)?.[1]??'';
 }catch{
  console.error('No dist/index.html. Run `npm run build` first.');
  process.exit(1);
 }
 if(!stamp){console.error('dist/index.html has no bursyar-build stamp. Run `npm run build` first.');process.exit(1);}
 const head=gitCommit();
 console.log(`Rehearsal host serving ${dist}`);
 note(`frontend stamp ${stamp}${head?`, branch HEAD ${head}`:''}`);
 if(head&&!stamp.startsWith(head.slice(0,7))&&!head.startsWith(stamp.slice(0,7)))note('NOTE: the build is stale — `npm run build` before rehearsing a promotion');

 await new Promise(resolveListen=>server.listen(0,'127.0.0.1',resolveListen));
 const {port}=server.address();
 const base=`http://127.0.0.1:${port}`;
 const temporary=await mkdtemp(join(tmpdir(),'bursyar-rehearsal-'));
 try{
  // 1. Everything agrees.
  backendCommit=stamp;
  let run=await runSmoke(smokeScript,base);
  let result=report(run);
  show(run);
  check(run.code===0,'matching frontend and backend pass the smoke');
  check(result.passed===true,'the matching run reports passed:true');
  check((result.unmeasurable??[]).length===1&&/RELEASE\.md parity is enforced/.test(result.unmeasurable[0]),'off-production, the only unmeasurable line is RELEASE.md parity');

  // 2. The backend reports another commit.
  backendCommit=DIVERGENT;
  run=await runSmoke(smokeScript,base);
  result=report(run);
  show(run);
  check(run.code===1,'a divergent backend fails the smoke');
  check((result.failures??[]).length===1&&/report the same commit/.test(result.failures[0]),'the failure is exactly the commit-parity mismatch');

  // 3. Production enforcement with the manifest still holding the old pair.
  backendCommit=stamp;
  const staleDir=await mkdtemp(join(temporary,'stale-'));
  const staleManifest=join(staleDir,'RELEASE.md');
  await writeFile(staleManifest,manifest(staleFrontend,staleBackend));
  run=await runSmoke(smokeScript,base,{BURSYAR_SMOKE_PRODUCTION_SCOPE:'1',BURSYAR_SMOKE_MANIFEST:staleManifest});
  result=report(run);
  show(run);
  const staleFailures=result.failures??[];
  check(run.code===1,'stale RELEASE.md rows fail a run that is otherwise consistent');
  check(staleFailures.length===2&&staleFailures.every(line=>/matches RELEASE\.md/.test(line)),'the two failures are exactly the frontend and backend RELEASE.md rows');
  check(/RELEASE\.md records both commits/.test(run.out),'the manifest itself is still readable, so the failure is a mismatch and not a missing row');

  // 4. The same run after the rows are updated to the promoted commits.
  const freshDir=await mkdtemp(join(temporary,'fresh-'));
  const freshManifest=join(freshDir,'RELEASE.md');
  await writeFile(freshManifest,manifest(stamp,stamp));
  run=await runSmoke(smokeScript,base,{BURSYAR_SMOKE_PRODUCTION_SCOPE:'1',BURSYAR_SMOKE_MANIFEST:freshManifest});
  result=report(run);
  show(run);
  check(run.code===0,'updated RELEASE.md rows pass with nothing unmeasurable');
  check((result.unmeasurable??[]).length===0,'the green run reports unmeasurable:[]');
 }finally{
  await new Promise(resolveClose=>server.close(resolveClose));
  await rm(temporary,{recursive:true,force:true});
 }

 console.log(JSON.stringify({event:'rehearsal_smoke',passed:failures.length===0,base,stamp,failures},null,2));
 process.exit(failures.length?1:0);
}

main().catch(error=>{
 console.error(`rehearsal failed: ${error.stack??error.message}`);
 process.exit(1);
});
