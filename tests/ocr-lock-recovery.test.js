import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {once} from 'node:events';
import * as api from '../scripts/atomic-directory.mjs';
const exec=promisify(execFile),moduleUrl=new URL('../scripts/atomic-directory.mjs',import.meta.url).href;
const child=(code,args=[])=>spawn(process.execPath,['--input-type=module','-e',code,...args],{stdio:['ignore','pipe','pipe']});
test('a killed lock owner is reclaimed by concurrent recoverers without overlapping work',async()=>{
 assert.equal(typeof api.currentProcessOwner,'function','missing owner-aware lock');
 const dir=mkdtempSync(join(tmpdir(),'ocr-dead-owner-')),lock=join(dir,'lock'),counter=join(dir,'counter');writeFileSync(counter,'0');
 const holder=child(`import {withDirectoryLock} from ${JSON.stringify(moduleUrl)};withDirectoryLock(process.argv[1],()=>{console.log('LOCKED');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,30000);});`,[lock]);
 try{
  await once(holder.stdout,'data');holder.kill('SIGKILL');await once(holder,'exit');
  const code=`import {withDirectoryLock} from ${JSON.stringify(moduleUrl)};import {readFileSync,writeFileSync} from 'node:fs';withDirectoryLock(process.argv[1],()=>{const n=Number(readFileSync(process.argv[2]));Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,50);writeFileSync(process.argv[2],String(n+1));});`;
  const results=await Promise.allSettled([1,2].map(()=>exec(process.execPath,['--input-type=module','-e',code,lock,counter],{timeout:15000})));
  for(const r of results)assert.equal(r.status,'fulfilled',r.reason?.message);
  assert.equal(readFileSync(counter,'utf8'),'2');assert.deepEqual(readdirSync(lock),[]);
 }finally{holder.kill('SIGKILL');rmSync(dir,{recursive:true,force:true});}
});
test('publication journal restores an interrupted rename before new output is reused',()=>{
 assert.equal(typeof api.recoverPublication,'function','missing publication recovery');
 const dir=mkdtempSync(join(tmpdir(),'ocr-journal-')),target=join(dir,'ocr-v1'),stage=join(dir,'.ocr-stage-synthetic'),backup=target+'.previous-11111111-1111-4111-8111-111111111111';
 try{
  mkdirSync(backup);writeFileSync(join(backup,'sentinel'),'complete old generation');mkdirSync(stage);writeFileSync(join(stage,'sentinel'),'complete new generation');
  writeFileSync(target+'.publication.json',JSON.stringify({schema:1,target:'ocr-v1',stage:'.ocr-stage-synthetic',backup:'ocr-v1.previous-11111111-1111-4111-8111-111111111111'}));
  api.recoverPublication(target);
  assert.equal(readFileSync(join(target,'sentinel'),'utf8'),'complete old generation');assert.equal(existsSync(stage),false);assert.equal(existsSync(target+'.publication.json'),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

for(const phase of ['journal','before-backup','after-backup','after-publish','after-cleanup'])test('publication recovers after SIGKILL at '+phase,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'ocr-kill-publish-')),target=join(dir,'ocr-v1'),stage=join(dir,'.ocr-stage-kill'),lock=join(dir,'lock');
 mkdirSync(target);writeFileSync(join(target,'sentinel'),'old');mkdirSync(stage);writeFileSync(join(stage,'sentinel'),'new');
 const code=`import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const [target,stage,lock,phase]=process.argv.slice(1);const rename=fs.renameSync,remove=fs.rmSync;fs.renameSync=(from,to)=>{if(phase==='before-backup'&&from===target)process.kill(process.pid,'SIGKILL');rename(from,to);if((phase==='journal'&&to===target+'.publication.json')||(phase==='after-backup'&&String(to).startsWith(target+'.previous-'))||(phase==='after-publish'&&to===target))process.kill(process.pid,'SIGKILL');};fs.rmSync=(path,...args)=>{remove(path,...args);if(phase==='after-cleanup'&&String(path).startsWith(target+'.previous-'))process.kill(process.pid,'SIGKILL');};syncBuiltinESMExports();const {withDirectoryLock,publishDirectory}=await import(${JSON.stringify(moduleUrl)});withDirectoryLock(lock,()=>publishDirectory(stage,target));`;
 const p=child(code,[target,stage,lock,phase]);
 try{
  const [exitCode,signal]=await once(p,'exit');assert.equal(signal,'SIGKILL','must exercise the intended interruption');
  api.withDirectoryLock(lock,()=>api.recoverPublication(target));
  assert.equal(readFileSync(join(target,'sentinel'),'utf8'),['after-publish','after-cleanup'].includes(phase)?'new':'old');
  assert.equal(existsSync(target+'.publication.json'),false);assert.equal(existsSync(stage),false);assert.deepEqual(readdirSync(lock),[]);
 }finally{p.kill('SIGKILL');rmSync(dir,{recursive:true,force:true});}
});
test('unverifiable owners and unsafe journals are preserved rather than guessed away',()=>{
 const dir=mkdtempSync(join(tmpdir(),'ocr-unknown-')),lock=join(dir,'lock'),id='11111111-1111-4111-8111-111111111111';mkdirSync(lock);
 try{
  const owner={...api.currentProcessOwner(),namespace:'unfamiliar-namespace'};
  writeFileSync(join(lock,id+'.json'),JSON.stringify({schema:1,id,owner,choosing:false,number:1}));
  assert.throws(()=>api.withDirectoryLock(lock,()=>assert.fail('must not enter'),{timeoutMs:20}),/busy/);assert.ok(existsSync(join(lock,id+'.json')));
  const target=join(dir,'ocr-v1'),precious=join(dir,'precious');mkdirSync(target);mkdirSync(precious);writeFileSync(join(precious,'sentinel'),'keep');
  writeFileSync(target+'.publication.json',JSON.stringify({schema:1,target:'ocr-v1',stage:'precious',backup:'ocr-v1.previous-'+id}));
  assert.throws(()=>api.recoverPublication(target),/Invalid/);assert.equal(readFileSync(join(precious,'sentinel'),'utf8'),'keep');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('cold interrupted publication completes its stage and impossible recovery fails closed',()=>{
 const dir=mkdtempSync(join(tmpdir(),'ocr-cold-journal-')),target=join(dir,'ocr-v1'),stage=join(dir,'.ocr-stage-cold'),journal=target+'.publication.json';
 const row={schema:1,target:'ocr-v1',stage:'.ocr-stage-cold',backup:'ocr-v1.previous-11111111-1111-4111-8111-111111111111'};
 try{
  mkdirSync(stage);writeFileSync(join(stage,'sentinel'),'complete cold generation');writeFileSync(journal,JSON.stringify(row));
  api.recoverPublication(target);assert.equal(readFileSync(join(target,'sentinel'),'utf8'),'complete cold generation');
  rmSync(target,{recursive:true});writeFileSync(journal,JSON.stringify(row));
  assert.throws(()=>api.recoverPublication(target),/preserved for recovery/);assert.ok(existsSync(journal));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
