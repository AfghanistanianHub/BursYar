import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';

test('hosted server starts without provider credentials and denies private APIs', {timeout:15000},async()=>{
 const reserve=createServer();await new Promise(resolve=>reserve.listen(0,'127.0.0.1',resolve));
 const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));
 const child=spawn(process.execPath,['engine/server.js'],{cwd:new URL('..',import.meta.url),env:{PATH:process.env.PATH,PORT:String(port),BURSYAR_HOST:'0.0.0.0',BURSYAR_ORIGIN:'https://bursyar.vercel.app',FIREBASE_PROJECT_ID:'demo-bursyar',FIREBASE_WEB_API_KEY:''},stdio:'ignore'});
 const exited=once(child,'exit');
 try{
  const url=`http://127.0.0.1:${port}`;let response;
  for(let n=0;n<100;n++){
   try{response=await fetch(url+'/health');break;}catch{if(child.exitCode!==null)throw Error('Server exited before readiness');await delay(50);}
  }
  assert.equal(response?.status,200);
  const body=await response.json();assert.equal(body.ok,true);
  assert.equal(body.capabilities.meta.state,'disabled');
  assert.equal(body.capabilities.documentStorage.available,false);
  assert.equal(body.capabilities.inferenceVerified,false);
  assert.equal((await fetch(url+'/api/scholarships')).status,401);
  assert.equal((await fetch(url+'/api/profile')).status,401);
  assert.equal((await fetch(url+'/api/analyze',{method:'POST'})).status,401);
  assert.equal((await fetch(url+'/api/scholarships',{headers:{origin:'https://unrelated.example'}})).status,403);
 }finally{child.kill('SIGTERM');await exited;}
});
