// Disposable loopback HTTPS gate. Run with the demo Auth emulator only.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createServer,request} from 'node:https';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';
import {sha256} from '../scripts/prepare-ocr-vendor-candidate.mjs';

const projectId='demo-bursyar';
const emulator='127.0.0.1:9099';
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,emulator,'require disposable loopback Auth emulator');
const dir=mkdtempSync(join(tmpdir(),'bursyar-https-gate-'));
const app=initializeApp({projectId},'bursyar-https-fixture');
const auth=getAuth(app);
const documents=DocumentStore.memory();
let server,checks=0;
const check=(name,value)=>{assert.ok(value,name);checks++;console.log('PASS '+name);};
try{
 const key=join(dir,'key.pem'),cert=join(dir,'cert.pem');
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1','-keyout',key,'-out',cert],{stdio:'ignore'});
 const ca=readFileSync(cert);
 const csp="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'";
 const prefix='/vendor/ocr-v1/';
 const manifest=JSON.parse(readFileSync('dist'+prefix+'asset-manifest.json'));
 const paths=new Map(manifest.outputs.map(entry=>[prefix+entry.path,entry]));
 const mime=path=>path.endsWith('.wasm')?'application/wasm':path.endsWith('.js')?'text/javascript':path.endsWith('.json')?'application/json':path.endsWith('.gz')?'application/gzip':'text/plain';
 let engine;
 server=createServer({key:readFileSync(key),cert:ca},(req,res)=>{
  if(req.url.startsWith('/api/'))return engine.emit('request',req,res);
  if(!['HEAD','GET'].includes(req.method)||!(paths.has(req.url)||req.url==='/'||req.url===prefix+'asset-manifest.json')){
   res.writeHead(404).end();return;
  }
  const body=readFileSync(req.url==='/'?'dist/index.html':'dist'+req.url);
  res.writeHead(200,{'content-type':req.url==='/'?'text/html':mime(req.url),'content-length':body.length,'content-security-policy':csp,'x-content-type-options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:body);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='https://127.0.0.1:'+server.address().port;
 engine=createInferenceServer({projectId,origin,documents,verify:token=>auth.verifyIdToken(token,true),quota:{},infer:async()=>{throw Error('Inference forbidden in fixture');}});
 const call=(path,{token,method='GET',body,contentType='application/json',requestOrigin=origin}={})=>new Promise((resolve,reject)=>{
  const encoded=body===undefined?undefined:JSON.stringify(body);
  const req=request(origin+path,{method,ca,headers:{origin:requestOrigin,'content-type':contentType,...(token?{authorization:'Bearer '+token}:{}),...(encoded?{'content-length':Buffer.byteLength(encoded)}:{})}},res=>{
   const authorized=res.socket.authorized;
   const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,authorized,body:Buffer.concat(chunks)}));
  });
  req.setTimeout(10000,()=>req.destroy(Error('Loopback HTTPS request timed out')));
  req.on('error',reject);req.end(encoded);
 });
 const root=await call('/');
 check('trusted HTTPS and enforcing CSP',root.authorized&&root.status===200&&root.headers['content-security-policy']===csp&&root.headers['x-content-type-options']==='nosniff');
 for(const [path,asset] of paths){
  const reply=await call(path,{method:'HEAD'});
  check('MIME and length '+asset.path,reply.status===200&&reply.headers['content-type']===mime(path)&&Number(reply.headers['content-length'])===asset.bytes);
 }
 const notices=JSON.parse(readFileSync('data/ocr-native-notices.json'));
 assert.equal(notices.productionApproved,false);
 const noticePaths=new Set(notices.notices.map(({file})=>prefix+'licenses/native/'+file));
 assert.deepEqual(new Set([...paths.keys()].filter(path=>path.includes('/licenses/native/')&&!path.endsWith('/NOTICE-SOURCES.json'))),noticePaths);
 for(const {file,sha256:expected} of notices.notices){
  const notice=await call(prefix+'licenses/native/'+file);
  check('packaged notice bytes '+file,notice.status===200&&sha256(notice.body)===expected);
 }
 const index=await call(prefix+'licenses/native/NOTICE-SOURCES.json');
 check('packaged notice index',index.status===200&&index.body.equals(readFileSync('data/ocr-native-notices.json')));
 const core=prefix+'core/tesseract-core-lstm.wasm';
 const response=await call(core);
 check('non-SIMD WASM exact bytes over HTTPS',sha256(response.body)===paths.get(core).sha256);
 async function identity(email){
  const base='http://'+emulator+'/identitytoolkit.googleapis.com/v1/accounts:';
  const password='synthetic-loopback-only-123!';
  const endpoint=(name,body)=>fetch(base+name+'?key=demo-key',{method:'POST',redirect:'error',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const input={email,password,returnSecureToken:true};
  const signup=await endpoint('signUp',input);
  assert.equal(signup.status,200,'emulator signup');
  const {localId}=await signup.json();
  await auth.setCustomUserClaims(localId,{bursyarDemo:true});
  const login=await endpoint('signInWithPassword',input);
  assert.equal(login.status,200,'emulator login');
  return (await login.json()).idToken;
 }
 const alice=await identity('mission35-alice@example.test'),bob=await identity('mission35-bob@example.test');
 const path='/api/documents';
 const payload={text:'Degree: bachelor',mime:'text/plain',consent:true};
 const post=(token,body,extra={})=>call(path,{token,method:'POST',body,...extra});
 check('anonymous and malformed tokens rejected',(await call(path)).status===401&&(await call(path,{token:'invalid'})).status===401);
 check('wrong origin rejected',(await call(path,{token:alice,requestOrigin:'https://outside.example.test'})).status===403);
 for(const [name,body,extra,status] of [
  ['consent missing',{...payload,consent:false},{},400],
  ['binary MIME',{...payload,mime:'application/pdf'},{},400],
  ['HTTP content type',payload,{contentType:'application/pdf'},415],
  ['invalid extracted characters',{...payload,text:'X\u0000Y'},{},400],
  ['unknown extraction status',{...payload,extractionMethod:'error'},{},400],
  ['extracted text over byte limit',{...payload,text:'ش'.repeat(6001)},{},400],
  ['HTTP body over limit',{...payload,text:'x'.repeat(60*1024)},{},413],
 ]){
  check(name,(await post(alice,body,extra)).status===status);
 }
 check('invalid requests left no records',JSON.parse((await call(path,{token:alice})).body).length===0);
 const upload=await post(alice,payload);
 check('approved emulator identity and consent accepted',upload.status===201);
 const record=path+'/'+JSON.parse(upload.body).id;
 check('second identity sees no list records',JSON.parse((await call(path,{token:bob})).body).length===0);
 for(const method of ['GET','DELETE','POST']){
  const target=method==='POST'?record+'/review':record;
  check('cross-user '+method+' rejected',(await call(target,{token:bob,method,body:method==='POST'?{decisions:{}}:undefined})).status===404);
 }
 check('owner retains access',(await call(record,{token:alice})).status===200);
 console.log('HTTPS AUTH EMULATOR PASSED '+checks+' checks');
}finally{
 if(server?.listening)await new Promise(resolve=>server.close(resolve));
 documents.close();await deleteApp(app);rmSync(dir,{recursive:true,force:true});
}
