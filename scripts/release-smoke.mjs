#!/usr/bin/env node
// Release smoke check (BY-01, BY-04). Fails the release when the public hostname
// is not reachable without a Vercel session, when the backend cannot report a
// build, or when the deployed artefacts disagree about which commit is live.
//
//   node scripts/release-smoke.mjs https://bursyar.vercel.app
//   BURSYAR_BYPASS_TOKEN=... node scripts/release-smoke.mjs https://<preview>
//
// The frontend commit comes from the `<meta name="bursyar-build">` stamp written
// at build time, so no dashboard is trusted. Against the production hostname the
// recorded SHAs in RELEASE.md must also match what is actually deployed; after a
// release, update those rows and re-run (the recording commit is bookkeeping and
// does not change the built artefacts). A preview URL is checked for internal
// agreement only, because RELEASE.md describes production. A caller can hold
// another host to the same standard with BURSYAR_SMOKE_PRODUCTION_SCOPE=1 and
// compare against a different manifest with BURSYAR_SMOKE_MANIFEST=<path>; the
// rehearsal in verification/ uses both rather than editing this file.
//
// Parity is reported as *unmeasurable*, never as a mismatch, when the host hides
// the artefacts: an SSO redirect or an unreachable /health says nothing about
// whether the commits agree. The SSO redirect itself is still a failure (BY-01),
// so the exit code stays honest.
//
// The /health probe is bounded (BURSYAR_SMOKE_HEALTH_TIMEOUT_MS, default 45 s), so
// a sleeping free-plan instance fails the check instead of hanging it.
//
// No secret is printed. Exit code 0 only when every check passes.
import {readFileSync} from 'node:fs';

const DEFAULT_BASE='https://bursyar.vercel.app';
const base=(process.argv[2]??process.env.BURSYAR_RELEASE_URL??DEFAULT_BASE).replace(/\/$/,'');
const isProduction=base===DEFAULT_BASE||/^(?:1|true|yes)$/i.test((process.env.BURSYAR_SMOKE_PRODUCTION_SCOPE??'').trim());
const bypass=process.env.BURSYAR_BYPASS_TOKEN;
const headers=bypass?{'x-vercel-protection-bypass':bypass}:{};
const healthTimeoutMs=Number(process.env.BURSYAR_SMOKE_HEALTH_TIMEOUT_MS??45000);
const isTimeout=error=>error?.name==='TimeoutError'||/timed?\s?out|abort/i.test(error?.message??'');
const failures=[];
const unmeasurable=[];
const record=(ok,message)=>{console.log(`${ok?'PASS':'FAIL'} ${message}`);if(!ok)failures.push(message);};
const skip=(message)=>{console.log(`INFO ${message}`);unmeasurable.push(message);};
const sameCommit=(a,b)=>Boolean(a&&b)&&(a.startsWith(b)||b.startsWith(a));

function readManifest(){
 try{
  const text=readFileSync(process.env.BURSYAR_SMOKE_MANIFEST??new URL('../RELEASE.md',import.meta.url),'utf8');
  const frontend=text.match(/Production frontend branch and commit[^\n]*?`([0-9a-f]{7,40})`/i)?.[1]??'';
  const backend=text.match(/Backend production SHA[^\n]*?`([0-9a-f]{7,40})`/i)?.[1]??'';
  return {frontend,backend};
 }catch(error){
  return {frontend:'',backend:'',error:error.message};
 }
}

async function get(path,{timeoutMs}={}){
 const response=await fetch(base+path,{redirect:'manual',headers,...(timeoutMs?{signal:AbortSignal.timeout(timeoutMs)}:{})});
 return {status:response.status,location:response.headers.get('location')??'',type:response.headers.get('content-type')??'',text:path==='/'?await response.text():''};
}

try{
 const home=await get('/');
 const ssoBlocked=home.location.includes('sso-api');
 record(home.status===200,`GET / → ${home.status}`);
 record(!ssoBlocked,`no Vercel SSO redirect (location: ${home.location||'none'})`);
 record(home.type.includes('text/html'),`/ serves HTML (${home.type||'no content-type'})`);
 if(home.text)record(/id="app"|BursYar/i.test(home.text),'the app shell is present in the HTML');

 const asset=home.text.match(/\/assets\/[A-Za-z0-9._-]+\.(?:js|css)/)?.[0];
 if(asset){
  const res=await fetch(base+asset,{headers});
  record(res.status===200,`${asset} → ${res.status}`);
 }else if(!ssoBlocked)record(false,'no hashed asset referenced by the shell');

 let frontendCommit='';
 if(ssoBlocked||home.status!==200){
  skip('frontend build commit unmeasurable: the release host did not serve the app shell, so parity cannot be judged (see the BY-01 line above).');
 }else{
  frontendCommit=home.text.match(/<meta name="bursyar-build" content="([0-9a-f]{7,40})"/i)?.[1]??'';
  record(Boolean(frontendCommit),`frontend reports its build commit (${frontendCommit||'missing stamp, rebuild with the current vite config'})`);
 }

 let backendCommit='';
 let health=null;
 try{
  health=await get('/health',{timeoutMs:healthTimeoutMs});
 }catch(error){
  if(!isTimeout(error))throw error;
  record(false,`GET /health → no answer within ${healthTimeoutMs} ms`);
  skip(`/health unmeasurable: the probe timed out after ${healthTimeoutMs} ms, so the backend commit cannot be read. The free Render plan sleeps; warm the service and re-run before reading this as a commit mismatch.`);
 }
 if(health){
  record(health.status===200,`GET /health → ${health.status}`);
  if(health.status===200){
   const body=await fetch(base+'/health',{headers,signal:AbortSignal.timeout(healthTimeoutMs)}).then(r=>r.json()).catch(()=>null);
   backendCommit=body?.capabilities?.build?.commit??body?.commit??'';
   record(typeof backendCommit==='string'&&Boolean(backendCommit),`backend reports a build commit (${backendCommit||'none'})`);
   if(backendCommit)console.log(`INFO backend commit ${backendCommit}`);
  }else{
   skip('/health unmeasurable: the first request may be a cold start; retry once before failing a release.');
  }
 }

 if(frontendCommit&&backendCommit){
  record(sameCommit(frontendCommit,backendCommit),`frontend ${frontendCommit} and backend ${backendCommit} report the same commit`);
 }else{
  skip('commit parity unmeasurable: both artefacts must report a commit before they can be compared.');
 }

 if(!isProduction){
  skip(`RELEASE.md parity is enforced against ${DEFAULT_BASE}; this run checks internal agreement only.`);
 }else if(frontendCommit&&backendCommit){
  const manifest=readManifest();
  record(Boolean(manifest.frontend&&manifest.backend),
   `RELEASE.md records both commits (frontend ${manifest.frontend||'missing'}, backend ${manifest.backend||'missing'}${manifest.error?`, ${manifest.error}`:''})`);
  record(sameCommit(frontendCommit,manifest.frontend),`frontend ${frontendCommit} matches RELEASE.md (${manifest.frontend||'missing'})`);
  record(sameCommit(backendCommit,manifest.backend),`backend ${backendCommit} matches RELEASE.md (${manifest.backend||'missing'})`);
 }else{
  skip('RELEASE.md parity unmeasurable: the deployed commits are unknown, so they cannot be compared with the recorded ones.');
 }
}catch(error){
 record(false,`request failed: ${error.message}`);
}

if(failures.length){
 console.error(JSON.stringify({event:'release_smoke',passed:false,failures,unmeasurable},null,2));
 process.exit(1);
}
console.log(JSON.stringify({event:'release_smoke',passed:true,base,unmeasurable}));
