import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,mkdirSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const require=createRequire(import.meta.url);
test('patched rimraf preserves SDK asynchronous and synchronous cleanup APIs',async()=>{
 const gaxRequire=createRequire(require.resolve('@google-cloud/firestore-api'));
 const consumer=createRequire(gaxRequire.resolve('google-gax'));
 const {rimraf,rimrafSync}=consumer('rimraf');
 const dir=mkdtempSync(join(tmpdir(),'bursyar-dependency-'));
 try{
  for(const name of ['async','sync']){mkdirSync(join(dir,name));writeFileSync(join(dir,name,'synthetic'),'public synthetic only');}
  await rimraf(join(dir,'async'));assert.equal(existsSync(join(dir,'async')),false);
  rimrafSync(join(dir,'sync'));assert.equal(existsSync(join(dir,'sync')),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('patched glob preserves archiver, Firebase listing and controller-loader behavior',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-glob-'));
 try{
  mkdirSync(join(dir,'nested'));writeFileSync(join(dir,'a.js'),'module.exports={synthetic:true}');writeFileSync(join(dir,'nested','b.js'),'module.exports={}');writeFileSync(join(dir,'skip.txt'),'skip');writeFileSync(join(dir,'firebase-debug.log'),'skip');
  const utils=require('archiver-utils');assert.deepEqual(utils.file.expand({cwd:dir},['**/*.js','!nested/**']),['a.js']);
  const firebaseRequire=createRequire(require.resolve('firebase-tools'));
  const {listFiles}=firebaseRequire('./listFiles');assert.deepEqual(listFiles(dir,['skip.txt']).sort(),['a.js','nested/b.js']);
  const controllers=require('exegesis/lib/controllers/loadControllers.js').loadControllersSync(dir);
  assert.equal(controllers.a.synthetic,true);assert.ok(controllers['nested/b']);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('already-aborted glob fails without traversing supplied filesystem',async()=>{
 const {glob}=require('glob');let reads=0;
 await assert.rejects(()=>glob('**/*',{cwd:tmpdir(),signal:AbortSignal.abort(),fs:{readdir(_path,_options,callback){reads++;callback(null,[]);}}}),e=>e.name==='AbortError');
 assert.equal(reads,0);
});
