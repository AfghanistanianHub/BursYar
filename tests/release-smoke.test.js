import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// The release check must never hang on a sleeping free-plan instance, so the
// /health probe is bounded. These tests serve a fake host that either answers or
// deliberately never replies, and assert the bounded behaviour end to end.
const script=fileURLToPath(new URL('../scripts/release-smoke.mjs',import.meta.url));
const SHA='0123456789abcdef0123456789abcdef01234567';
const shell=`<!doctype html><html><head><meta name="bursyar-build" content="${SHA}"></head><body><div id="app"></div><script src="/assets/app-abc123.js"></script></body></html>`;

function run(base,environment){
 return new Promise(resolve=>{
  const child=spawn(process.execPath,[script,base],{env:{...process.env,...environment}});
  let out='',err='';
  child.stdout.on('data',chunk=>{out+=chunk;});
  child.stderr.on('data',chunk=>{err+=chunk;});
  child.on('close',code=>resolve({code,out,err}));
 });
}

async function withServer(handler,body){
 const server=createServer(handler);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const {port}=server.address();
 try{
  return await body(`http://127.0.0.1:${port}`);
 }finally{
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
 }
}

const files=(req,res)=>{
 if(req.url==='/'){res.writeHead(200,{'content-type':'text/html'});res.end(shell);return true;}
 if(req.url.startsWith('/assets/')){res.writeHead(200,{'content-type':'application/javascript'});res.end('console.log(1)');return true;}
 return false;
};

test('a /health probe that never answers fails the check once its budget expires',async()=>{
 const result=await withServer((req,res)=>{
  if(req.url==='/health')return; // Real Render sleep: hold the socket open and reply never.
  if(!files(req,res)){res.writeHead(404);res.end();}
 },base=>run(base,{BURSYAR_SMOKE_HEALTH_TIMEOUT_MS:'200'}));
 assert.equal(result.code,1,`expected exit 1, got ${result.code}\n${result.out}${result.err}`);
 assert.match(result.out,/GET \/health → no answer within 200 ms/);
 const report=JSON.parse(result.err);
 assert.equal(report.passed,false);
 assert.ok(report.failures.some(line=>/no answer within 200 ms/.test(line)),report.failures.join('; '));
 assert.ok(report.unmeasurable.some(line=>/probe timed out/.test(line)),report.unmeasurable.join('; '));
 assert.ok(!report.failures.some(line=>/commit/.test(line)),'a timed-out probe must not be reported as a commit mismatch');
});

test('an answering /health keeps the bounded probe on the normal parity path',async()=>{
 const result=await withServer((req,res)=>{
  if(req.url==='/health'){
   res.writeHead(200,{'content-type':'application/json'});
   res.end(JSON.stringify({ok:true,capabilities:{build:{commit:SHA}}}));
   return;
  }
  if(!files(req,res)){res.writeHead(404);res.end();}
 },base=>run(base,{BURSYAR_SMOKE_HEALTH_TIMEOUT_MS:'2000'}));
 assert.equal(result.code,0,`expected exit 0, got ${result.code}\n${result.out}${result.err}`);
 assert.match(result.out,new RegExp(`frontend ${SHA} and backend ${SHA} report the same commit`));
 assert.match(result.out,/"passed":true/);
});
