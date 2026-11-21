#!/usr/bin/env node
// Release smoke check (BY-01). Fails the release when the public hostname is not
// reachable without a Vercel session, or when the backend cannot report a build.
//
//   node scripts/release-smoke.mjs https://bursyar.vercel.app
//   BURSYAR_BYPASS_TOKEN=... node scripts/release-smoke.mjs https://<preview>
//
// No secret is printed. Exit code 0 only when every check passes.
const base=(process.argv[2]??process.env.BURSYAR_RELEASE_URL??'https://bursyar.vercel.app').replace(/\/$/,'');
const bypass=process.env.BURSYAR_BYPASS_TOKEN;
const headers=bypass?{'x-vercel-protection-bypass':bypass}:{};
const failures=[];
const record=(ok,message)=>{console.log(`${ok?'PASS':'FAIL'} ${message}`);if(!ok)failures.push(message);};

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

 const health=await get('/health');
 record(health.status===200,`GET /health → ${health.status}`);
 if(health.status===200){
  const body=await fetch(base+'/health',{headers}).then(r=>r.json()).catch(()=>null);
  const commit=body?.capabilities?.build?.commit??body?.commit??null;
  record(typeof commit==='string',`backend reports a build commit (${commit??'none'})`);
  if(typeof commit==='string')console.log(`INFO backend commit ${commit}`);
 }else{
  console.log('INFO /health is not reachable: the first request may be a cold start; retry once before failing a release.');
 }
}catch(error){
 record(false,`request failed: ${error.message}`);
}

if(failures.length){
 console.error(JSON.stringify({event:'release_smoke',passed:false,failures},null,2));
 process.exit(1);
}
console.log(JSON.stringify({event:'release_smoke',passed:true,base}));
