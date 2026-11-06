import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
let api;try{api=await import('../scripts/atomic-directory.mjs');}catch{}
test('failed asset publication restores the previous complete output',()=>{
 assert.ok(api,'missing atomic directory publisher');
 const dir=mkdtempSync(join(tmpdir(),'ocr-publish-')),target=join(dir,'assets');mkdirSync(target);writeFileSync(join(target,'sentinel'),'previous complete generation');
 try{
  assert.throws(()=>api.publishDirectory(join(dir,'missing-stage'),target));
  assert.equal(readFileSync(join(target,'sentinel'),'utf8'),'previous complete generation');
  const stage=join(dir,'.ocr-stage-synthetic');mkdirSync(stage);writeFileSync(join(stage,'sentinel'),'new complete generation');
  api.publishDirectory(stage,target);assert.equal(readFileSync(join(target,'sentinel'),'utf8'),'new complete generation');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('preparation lock bounds contention and releases after exceptions',()=>{
 assert.ok(api,'missing preparation lock');const dir=mkdtempSync(join(tmpdir(),'ocr-lock-')),lock=join(dir,'lock');
 try{
  mkdirSync(lock);const id='11111111-1111-4111-8111-111111111111';writeFileSync(join(lock,id+'.json'),JSON.stringify({schema:1,id,owner:api.currentProcessOwner(),choosing:false,number:1}));let entered=false;
  assert.throws(()=>api.withDirectoryLock(lock,()=>{entered=true;},{timeoutMs:20}),/busy/);
  assert.equal(entered,false);assert.ok(existsSync(lock));rmSync(lock,{recursive:true});
  assert.throws(()=>api.withDirectoryLock(lock,()=>{throw Error('synthetic failure');}),/synthetic failure/);
  assert.ok(existsSync(lock));assert.equal(api.withDirectoryLock(lock,()=>42),42);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
