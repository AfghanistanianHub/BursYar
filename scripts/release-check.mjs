#!/usr/bin/env node
// Release pre-flight (BY-04, BY-08). One command, in the order RELEASE.md and
// docs/OWNER-UNBLOCK-PACKET.md prescribe, stopping the release before any
// deploy rather than after a red check is found by hand:
//
//   1. working tree is clean                 (nothing uncommitted is being promoted)
//   2. RELEASE.md rows parse and agree        (both SHAs exist; the recorded
//                                             frontend commit is on the recorded branch)
//   3. hostnames agree                        (offline: vercel.json, render.yaml,
//                                             RELEASE.md and release-smoke.mjs
//                                             must name one frontend and one backend)
//   4. research freshness gate                (scripts/check-research.mjs)
//   5. build, stamped with HEAD               (`npm run build`, then compare the
//                                             <meta name="bursyar-build"> value)
//   6. the release rehearsal                  (`npm run rehearsal:smoke`)
//
// On success it prints the two RELEASE.md rows to paste after the promotion:
//
//   npm run release:check
//   npm run release:check -- --backend=<sha read from /health>   # after a smoke run
//
// --frontend=<sha> overrides the candidate value (the build stamp) if the
// promoted commit is not HEAD. It never writes RELEASE.md: updating the rows is
// a deliberate bookkeeping commit, and this tool only reports what the evidence
// would be. No network is used except by the freshness and rehearsal steps,
// which touch only the local server they start.
import {execFileSync, spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const failures=[];
const labels=[];
const git=(...args)=>execFileSync('git',['-c','safe.directory=*',...args],{cwd:root,encoding:'utf8'}).trim();

const pass=(label,detail)=>console.log(`PASS ${label}${detail?` — ${detail}`:''}`);
const fail=(label,detail)=>{failures.push(label);console.log(`FAIL ${label}${detail?` — ${detail}`:''}`);};
const info=detail=>console.log(`INFO ${detail}`);
const step=(name,run)=>{
 labels.push(name);
 console.log(`\n## ${name}`);
 try{run();}catch(error){fail(name,error.message);}
};

function readRows(text){
 const row=text.match(/Production frontend branch and commit[^\n]*/i)?.[0]??'';
 const branch=row.match(/`([^`]+)`/)?.[1]??'';
 const frontend=text.match(/Production frontend branch and commit[^\n]*?`([0-9a-f]{7,40})`/i)?.[1]??'';
 const backend=text.match(/Backend production SHA[^\n]*?`([0-9a-f]{7,40})`/i)?.[1]??'';
 const backendOn=text.match(/Backend production SHA[^\n]*?on\s+(\d{4}-\d{2}-\d{2})/i)?.[1]??'';
 return {branch,frontend,backend,backendOn};
}

export function renderServiceVars(renderYaml){
 const vars={};
 let current='';
 for(const line of renderYaml.split('\n')){
  const key=line.match(/^\s*-\s*key:\s*([A-Z0-9_]+)\s*$/);
  if(key){current=key[1];continue;}
  const value=line.match(/^\s+value:\s*(.*?)\s*$/);
  if(value&&current){vars[current]=value[1].replace(/^['"]|['"]$/g,'');current='';}
 }
 return vars;
}

export function releaseSmokeBase(source){
 return source.match(/^const DEFAULT_BASE='([^']+)'/m)?.[1]??'';
}

export function manifestSmokeTarget(releaseMd){
 const line=releaseMd.split('\n').find(row=>row.includes('scripts/release-smoke.mjs')&&/https?:\/\//.test(row));
 return line?.match(/https?:\/\/[^\s`)'"<>,]+/)?.[0]??'';
}

const urlOf=value=>{try{return new URL(value);}catch{return null;}};

// Everything here is offline: it only compares what the checked-in files claim.
export function hostnameAgreement({vercelJson,renderYaml,releaseMd,smokeSource}){
 const failures=[];
 const checks=[];
 const add=(ok,label)=>{checks.push({ok,label});if(!ok)failures.push(label);};

 let rewrites=[];
 try{
  rewrites=JSON.parse(vercelJson).rewrites??[];
 }catch(error){
  add(false,`vercel.json parses (${error.message})`);
  return {checks,failures};
 }
 const healthRewrite=rewrites.find(row=>row.source==='/health');
 const apiRewrite=rewrites.find(row=>row.source==='/api/:path*');
 const health=urlOf(healthRewrite?.destination??'');
 const api=urlOf(apiRewrite?.destination??'');
 add(Boolean(api),`vercel.json rewrites /api/:path* to an absolute URL (${apiRewrite?.destination??'missing'})`);
 add(Boolean(health),`vercel.json rewrites /health to an absolute URL (${healthRewrite?.destination??'missing'})`);
 add(health?.pathname==='/health',`the /health rewrite keeps the path (${health?.pathname??'none'})`);
 add(Boolean(api?.pathname?.startsWith('/api')),`the /api rewrite keeps the /api prefix (${api?.pathname??'none'})`);
 add(Boolean(health&&api&&health.host===api.host),
  `both rewrites target one backend host (${health?.host??'?'} / ${api?.host??'?'})`);

 const vars=renderServiceVars(renderYaml);
 const origin=urlOf(vars.BURSYAR_ORIGIN??'');
 add(Boolean(origin),`render.yaml sets BURSYAR_ORIGIN to an absolute URL (${vars.BURSYAR_ORIGIN??'missing'})`);
 add(/^\s*healthCheckPath:\s*\/health\s*$/m.test(renderYaml),'render.yaml healthCheckPath is /health');

 const manifestTarget=urlOf(manifestSmokeTarget(releaseMd));
 add(Boolean(manifestTarget),`RELEASE.md documents a release-smoke URL (${manifestSmokeTarget(releaseMd)||'missing'})`);
 const smokeBase=urlOf(releaseSmokeBase(smokeSource));
 add(Boolean(smokeBase),`release-smoke.mjs declares DEFAULT_BASE (${releaseSmokeBase(smokeSource)||'missing'})`);
 add(Boolean(manifestTarget&&smokeBase&&manifestTarget.host===smokeBase.host),
  `RELEASE.md's smoke target and DEFAULT_BASE name one frontend host (${manifestTarget?.host??'?'} / ${smokeBase?.host??'?'})`);
 add(Boolean(origin&&manifestTarget&&origin.host===manifestTarget.host),
  `render.yaml's CORS origin is the frontend host (${origin?.host??'?'} / ${manifestTarget?.host??'?'})`);

 const connect=/connect-src([^;]*)/.exec(vercelJson)?.[1]??'';
 add(Boolean(health&&connect.includes(`https://${health.host}`)),
  `the CSP connect-src allows the backend host (${health?.host??'?'})`);

 return {checks,failures};
}

function main(){
 const args=new Map(process.argv.slice(2).filter(arg=>arg.startsWith('--')).map(arg=>{
  const [key,...rest]=arg.slice(2).split('=');
  return [key,rest.join('=')];
 }));

 step('1/6 working tree',()=>{
  const dirty=git('status','--porcelain');
  if(!dirty)return pass('the tree is clean, so the commit under test is the commit recorded in git');
  const paths=dirty.split('\n');
  fail(`the tree has ${paths.length} uncommitted path${paths.length===1?'':'s'}`,
   `${paths.slice(0,5).join(', ')}${paths.length>5?', …':''} — commit or stash them before promoting`);
 });

 let rows={};
 step('2/6 RELEASE.md rows',()=>{
  rows=readRows(readFileSync(resolve(root,'RELEASE.md'),'utf8'));
  const full=/^[0-9a-f]{40}$/;
  if(!full.test(rows.frontend))fail('the frontend row is a full 40-character SHA',rows.frontend?`found ${rows.frontend}`:'row missing');
  else pass('the frontend row is a full SHA',rows.frontend);
  if(!full.test(rows.backend))fail('the backend row is a full 40-character SHA',rows.backend?`found ${rows.backend}`:'row missing');
  else pass('the backend row is a full SHA',rows.backend);
  if(!rows.branch)fail('the frontend row names its branch','no branch in the row');

  for(const [name,sha] of [['frontend',rows.frontend],['backend',rows.backend]]){
   if(!full.test(sha))continue;
   try{git('cat-file','-e',`${sha}^{commit}`);pass(`the ${name} commit exists in this clone`);}
   catch{fail(`the ${name} commit exists in this clone`,`${sha} not found — fetch the full history (git fetch origin --unshallow) before releasing`);}
  }

  if(full.test(rows.frontend)&&rows.branch){
   const candidates=[`origin/${rows.branch}`,`refs/heads/${rows.branch}`];
   const ref=candidates.find(candidate=>{try{git('rev-parse','--verify','--quiet',candidate);return true;}catch{return false;}});
   if(!ref){
    fail(`the recorded branch ${rows.branch} is available to compare against`,
     `no ${candidates.join(' or ')} — run git fetch origin ${rows.branch}`);
   }else{
    try{
     git('merge-base','--is-ancestor',rows.frontend,ref);
     pass(`the recorded frontend commit is on ${rows.branch}`,ref);
    }catch{
     fail(`the recorded frontend commit is on ${rows.branch}`,`${rows.frontend} is not an ancestor of ${ref}`);
    }
   }
  }

  try{
   const head=git('rev-parse','--abbrev-ref','HEAD');
   const upstream=git('rev-parse','--abbrev-ref','--symbolic-full-name','@{u}');
   const [ahead,behind]=git('rev-list','--left-right','--count',`HEAD...${upstream}`).split(/\s+/);
   info(`${head} is ${ahead} ahead, ${behind} behind ${upstream}`);
  }catch{info('no upstream configured for this branch; ahead/behind not reported');}
 });

 step('3/6 hostname agreement (offline)',()=>{
  const files={
   vercelJson:readFileSync(resolve(root,'vercel.json'),'utf8'),
   renderYaml:readFileSync(resolve(root,'render.yaml'),'utf8'),
   releaseMd:readFileSync(resolve(root,'RELEASE.md'),'utf8'),
   smokeSource:readFileSync(resolve(root,'scripts','release-smoke.mjs'),'utf8')
  };
  const verdict=hostnameAgreement(files);
  for(const check of verdict.checks)(check.ok?pass:fail)(check.label);
 });

 step('4/6 research freshness',()=>{
  const run=spawnSync(process.execPath,[resolve(root,'scripts','check-research.mjs')],{cwd:root,stdio:'inherit'});
  if(run.status!==0)fail('every shipped research row is inside its recheck window','see the gate report above; re-read the sources and record docs/RESEARCH-RECHECK-<date>.md');
  else pass('every shipped research row is inside its recheck window');
 });

 let stamp='';
 step('5/6 build stamped with HEAD',()=>{
  const build=spawnSync('npm',['run','build'],{cwd:root,encoding:'utf8'});
  if(build.status!==0){
   const tail=(build.stderr||build.stdout||'').trim().split('\n').slice(-8).join('\n');
   fail('npm run build succeeds',tail||`exit ${build.status}`);
   return;
  }
  const head=git('rev-parse','HEAD');
  const html=readFileSync(resolve(root,'dist','index.html'),'utf8');
  stamp=html.match(/<meta name="bursyar-build" content="([0-9a-f]{7,40})"/i)?.[1]??'';
  if(!stamp)return fail('dist/index.html carries a build stamp','missing <meta name="bursyar-build">; check vite.config.js');
  const same=head.startsWith(stamp)||stamp.startsWith(head);
  (same?pass:fail)(`the stamp is HEAD (${stamp} / ${head})`,same?'':`rebuild at ${head} before promoting`);
 });

 step('6/6 release rehearsal',()=>{
  if(!stamp){
   fail('the rehearsal runs on a build of this commit','skipped: step 5 produced no stamp, so the rehearsal would test a stale dist/');
   return;
  }
  const run=spawnSync('npm',['run','rehearsal:smoke'],{cwd:root,stdio:'inherit'});
  if(run.status!==0)fail('the rehearsal passes all four scenarios','see the failing assertions above');
  else pass('the rehearsal passes all four scenarios');
 });

 const head=git('rev-parse','HEAD');
 const frontend=args.get('frontend')||stamp||head;
 const backend=args.get('backend')||'';
 const today=new Date().toISOString().slice(0,10);
 const branch=rows.branch||'main';

 console.log('');
 if(failures.length){
  console.log(`${failures.length} pre-flight check${failures.length===1?'':'s'} failed; no rows to paste until they pass:`);
  for(const label of failures)console.log(`  - ${label}`);
  console.log('');
  console.error(JSON.stringify({event:'release_check',passed:false,head,failures},null,2));
  process.exit(1);
 }

 console.log('Rows to paste into RELEASE.md after the promotion confirms these values:');
 console.log('');
 console.log(`| Production frontend branch and commit | \`${branch}\` — \`${frontend}\` |`);
 console.log(`| Backend production SHA | ${backend?`\`${backend}\``:'`<the commit /health reports>`'} — read from \`/health\` \`capabilities.build.commit\` on ${today} |`);
 console.log('');
 if(!backend)console.log('INFO no --backend given: run node scripts/release-smoke.mjs https://bursyar.vercel.app and pass the SHAs it reports.');
 if(!stamp)console.log('INFO no build stamp was produced, so the frontend row uses HEAD.');
 console.log('INFO parity is only proven by the smoke against the real hostname; these rows are bookkeeping, not evidence.');
 console.log(JSON.stringify({event:'release_check',passed:true,head,rows:{frontend,backend:backend||null,branch}}));
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
