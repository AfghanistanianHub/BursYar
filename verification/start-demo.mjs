import {isSpendingConfirmed} from '../engine/spending.js';
import {classifyCatalogAttempt,catalogUnavailableEvent,catalogVerifiedEvent,buildReadinessLines,readyLine} from './demo-readiness.mjs';
// Runs only on owner request in the existing credential-bearing shell. No paid preflight.
// Deterministic-only startup is fully usable without a Meta key or catalog success.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
import {applicationDefault} from 'firebase-admin/app';
const root=fileURLToPath(new URL('../',import.meta.url));
const env={...process.env};
const children=[];
async function readConfig(url,token){
 const response=await fetch(url,{redirect:'error',headers:{authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});
 if(!response.ok){await response.body?.cancel();throw Error('Public Firebase web configuration unavailable through existing ADC');}
 const reader=response.body.getReader();const chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>128*1024)throw Error('Public Firebase config exceeds safe size');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');process.exitCode=code;}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>stop());
try{
 for(const name of ['FIREBASE_PROJECT_ID','BURSYAR_ORIGIN','BURSYAR_QUOTA_DB','BURSYAR_USER_MINUTE','BURSYAR_USER_DAY','BURSYAR_GLOBAL_DAY','BURSYAR_LIFETIME_UNITS'])if(!env[name])throw Error(`Existing environment missing ${name}`);
 const origin=new URL(env.BURSYAR_ORIGIN);
 if(!['localhost','127.0.0.1'].includes(origin.hostname)||origin.protocol!=='http:')throw Error('Demo frontend requires a loopback HTTP origin');
 const port=Number(env.PORT||8080),frontPort=Number(origin.port||80);
 if(![port,frontPort].every(p=>Number.isInteger(p)&&p>0&&p<65536)||port===frontPort)throw Error('Demo ports must be distinct valid ports');
 // Bind probes close immediately; never terminate the existing owner process.
 for(const p of [port,frontPort])await new Promise((resolve,reject)=>{const probe=createServer();probe.once('error',()=>reject(Error(`Port ${p} is occupied; stop only the existing BursYar process first`)));probe.listen(p,'127.0.0.1',()=>probe.close(resolve));});
 // Meta catalog check is advisory only. Missing keys or any catalog failure
 // degrade to deterministic-only startup; they never block local features.
 const skipped=classifyCatalogAttempt({hasKey:!!(env.META_API_KEY||env.MODEL_API_KEY),hasModel:!!env.META_MODEL_ID});
 if(skipped){console.log(JSON.stringify(skipped));}
 else{
  try{
   const response=await fetch('https://api.meta.ai/v1/models',{redirect:'error',headers:{authorization:`Bearer ${env.META_API_KEY||env.MODEL_API_KEY}`},signal:AbortSignal.timeout(15000)});
   if(!response.ok){await response.body?.cancel().catch(()=>{});throw Error(`HTTP_${response.status}`);}
   const reader=response.body.getReader();let size=0;const chunks=[];
   try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>128*1024)throw Error('CATALOG_TOO_LARGE');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
   let catalog;try{catalog=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('INVALID_CATALOG');}
   if(!catalog.data?.some(m=>m.id===env.META_MODEL_ID))throw Error('MODEL_ABSENT');
   console.log(JSON.stringify(catalogVerifiedEvent()));
  }catch(error){
   const reason=/^HTTP_\d+$/.test(error.message)?'model_catalog_http_error':['CATALOG_TOO_LARGE','INVALID_CATALOG','MODEL_ABSENT'].includes(error.message)?'model_catalog_unavailable':'model_catalog_unreachable';
   console.log(JSON.stringify(catalogUnavailableEvent(reason)));
  }
 }
 // Only public Firebase web config is fetched. Never print it or read private ADC contents.
 if(!env.VITE_FIREBASE_API_KEY||!env.VITE_FIREBASE_PROJECT_ID||!env.VITE_FIREBASE_AUTH_DOMAIN){
  if(!/^[a-z][a-z0-9-]{4,62}$/.test(env.FIREBASE_PROJECT_ID))throw Error('Invalid Firebase project ID');
  const credential=applicationDefault();
  const access=await credential.getAccessToken();
  const base=`https://firebase.googleapis.com/v1beta1/projects/${env.FIREBASE_PROJECT_ID}/webApps`;
  const apps=await readConfig(base+'?pageSize=100',access.access_token);
  if(apps.apps?.length!==1)throw Error('Public Firebase config selection requires existing VITE_FIREBASE_* environment');
  const appId=encodeURIComponent(apps.apps[0].appId);
  const config=await readConfig(`${base}/${appId}/config`,access.access_token);
  if(config.projectId!==env.FIREBASE_PROJECT_ID||typeof config.apiKey!=='string'||typeof config.authDomain!=='string')throw Error('Public Firebase config does not match project');
  env.VITE_FIREBASE_API_KEY=config.apiKey;env.VITE_FIREBASE_PROJECT_ID=config.projectId;env.VITE_FIREBASE_AUTH_DOMAIN=config.authDomain;
 }
 const childEnv={...env};
 // Preserve the configured timeout; do not infer a new value from elapsed browser time.
 const engine=spawn(process.execPath,['engine/server.js'],{cwd:root,env:childEnv,stdio:'inherit'});children.push(engine);
 engine.once('error',()=>{console.error('Backend could not start');stop(1);});
 engine.once('exit',code=>{if(!stopping)stop(code||1);});
 let ready=false,capabilities=null;
 for(let i=0;i<25&&!stopping;i++){
  try{
   const r=await fetch(`http://127.0.0.1:${port}/health`,{signal:AbortSignal.timeout(500)});
   if(r.ok){ready=true;try{const body=await r.json();if(body&&typeof body.capabilities==='object')capabilities=body.capabilities;}catch{}break;}
  }catch{}
  await new Promise(resolve=>setTimeout(resolve,200));
 }
 if(!ready||stopping)throw Error('Backend startup did not complete');
 for(const name of ['VITE_FIREBASE_API_KEY','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_AUTH_DOMAIN'])process.env[name]=env[name];
 const {createServer:createVite}=await import('vite');
 const vite=await createVite({root,server:{host:'127.0.0.1',port:frontPort,strictPort:true,proxy:{'/api':{target:`http://127.0.0.1:${port}`,changeOrigin:false}}}});
 await vite.listen();process.once('SIGINT',()=>void vite.close());process.once('SIGTERM',()=>void vite.close());engine.once('exit',()=>void vite.close());
 const {lines,deterministicOnly}=buildReadinessLines({spendingConfirmed:isSpendingConfirmed(env),spendLimitUSD:env.BURSYAR_SPEND_LIMIT_USD,capabilities});
 for(const line of lines)console.log(line);
 console.log(readyLine({origin:origin.origin,deterministicOnly}));
}catch(error){
 // All expected messages above are authored locally; suppress network/runtime details.
 const safe=/^(Existing environment missing |Demo frontend requires |Demo ports must be distinct valid ports|Port \d+ is occupied|Invalid Firebase project ID|Public Firebase |Backend startup did not complete)/.test(error.message);
 console.error(safe?error.message:'Demo startup unavailable; no credential details logged');stop(1);
}
