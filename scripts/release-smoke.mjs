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
// agreement only, because RELEASE.md describes production.
//
// No secret is printed. Exit code 0 only when every check passes.
import {readFileSync} from 'node:fs';

const DEFAULT_BASE='https://bursyar.vercel.app';
const base=(process.argv[2]??process.env.BURSYAR_RELEASE_URL??DEFAULT_BASE).replace(/\/$/,'');
const isProduction=base===DEFAULT_BASE;
const bypass=process.env.BURSYAR_BYPASS_TOKEN;
const headers=bypass?{'x-vercel-protection-bypass':bypass}:{};
const failures=[];
const record=(ok,message)=>{console.log(`${ok?'PASS':'FAIL'} ${message}`);if(!ok)failures.push(message);};
const sameCommit=(a,b)=>Boolean(a&&b)&&(a.startsWith(b)||b.startsWith(a));

function readManifest(){
 try{
  const text=readFileSync(new URL('../RELEASE.md',import.meta.url),'utf8');
  const frontend=text.match(/Production frontend branch and commit[^\n]*?`([0-9a-f]{7,40})`/i)?.[1]??'';
  const backend=text.match(/Backend production SHA[^\n]*?`([0-9a-f]{7,40})`/i)?.[1]??'';
  return {frontend,backend};
 }catch(error){
  return {frontend:'',backend:'',error:error.message};
 }
}

async function get(path){
 const response=await fetch(base+path,{redirect:'manual',headers});
 return {status:response.status,location:response.headers.get('location')??'',type:response.headers.get('content-type')??'',text:path==='/'?await response.text():''};
}

try{
 const home=await get('/');
 record(home.status===200,`GET / → ${home.status}`);
 record(!home.location.includes('sso-api'),`no Vercel SSO redirect (location: ${home.location||'none'})`);
 record(home.type.includes('text/html'),`/ serves HTML (${home.type||'no content-type'})`);
 if(home.text)record(/id="app"|BursYar/i.test(home.text),'the app shell is present in the HTML');

 const asset=home.text.match(/\/assets\/[A-Za-z0-9._-]+\.(?:js|css)/)?.[0];
 if(asset){
  const res=await fetch(base+asset,{headers});
  record(res.status===200,`${asset} → ${res.status}`);
 }else record(false,'no hashed asset referenced by the shell');

 const frontendCommit=home.text.match(/<meta name="bursyar-build" content="([0-9a-f]{7,40})"/i)?.[1]??'';
 record(Boolean(frontendCommit),`frontend reports its build commit (${frontendCommit||'missing stamp, rebuild with the current vite config'})`);

 let backendCommit='';
 const health=await get('/health');
 record(health.status===200,`GET /health → ${health.status}`);
 if(health.status===200){
  const body=await fetch(base+'/health',{headers}).then(r=>r.json()).catch(()=>null);
  backendCommit=body?.capabilities?.build?.commit??body?.commit??'';
  record(typeof backendCommit==='string'&&Boolean(backendCommit),`backend reports a build commit (${backendCommit||'none'})`);
  if(backendCommit)console.log(`INFO backend commit ${backendCommit}`);
 }else{
  console.log('INFO /health is not reachable: the first request may be a cold start; retry once before failing a release.');
 }

 if(frontendCommit&&backendCommit){
  record(sameCommit(frontendCommit,backendCommit),`frontend ${frontendCommit} and backend ${backendCommit} report the same commit`);
 }

 if(isProduction){
  const manifest=readManifest();
  record(Boolean(manifest.frontend&&manifest.backend),
   `RELEASE.md records both commits (frontend ${manifest.frontend||'missing'}, backend ${manifest.backend||'missing'}${manifest.error?`, ${manifest.error}`:''})`);
  record(sameCommit(frontendCommit,manifest.frontend),`frontend ${frontendCommit||'missing'} matches RELEASE.md (${manifest.frontend||'missing'})`);
  record(sameCommit(backendCommit,manifest.backend),`backend ${backendCommit||'missing'} matches RELEASE.md (${manifest.backend||'missing'})`);
 }else{
  console.log(`INFO RELEASE.md parity is enforced against ${DEFAULT_BASE}; this run checks internal agreement only.`);
 }
}catch(error){
 record(false,`request failed: ${error.message}`);
}

if(failures.length){
 console.error(JSON.stringify({event:'release_smoke',passed:false,failures},null,2));
 process.exit(1);
}
console.log(JSON.stringify({event:'release_smoke',passed:true,base}));
