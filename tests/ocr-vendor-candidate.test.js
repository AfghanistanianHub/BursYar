import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {FILES,PACKAGES,sha256,inspectCandidate,prepareCandidate} from '../scripts/prepare-ocr-vendor-candidate.mjs';

test('candidate vendor plan covers all PDF, OCR, WASM and EN/FA/PS model assets',()=>{
 assert.equal(PACKAGES.length,6);
 assert.equal(FILES.length,15);
 assert.equal(new Set(FILES.map(f=>f[2])).size,FILES.length);
 for(const item of ['pdf/pdf.worker.min.mjs','tesseract/worker.min.js','core/tesseract-core-simd-lstm.wasm','lang/pus.traineddata.gz'])assert.ok(FILES.some(f=>f[2]===item));
});
test('candidate asset integrity is fail-closed; generated manifest never authorizes release',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-vendor-test-'));
 const root=join(dir,'assets');mkdirSync(root);
 try{
  const files=FILES.map(([,,path])=>{
   const bytes=Buffer.from('SYNTHETIC TEST ONLY '+path);
   const target=join(root,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes);
   return {path,bytes:bytes.length,sha256:sha256(bytes)};
  });
  const manifest={purpose:'human-review-only',releaseApproved:false,files};
  assert.equal(inspectCandidate(root,manifest).files,15);
  assert.throws(()=>inspectCandidate(root,{...manifest,releaseApproved:true}),/unapproved/);
  assert.throws(()=>inspectCandidate(root,{...manifest,files:files.slice(1)}),/incomplete/);
  const target=join(root,files[0].path);
  writeFileSync(target,'modified upstream content');
  assert.throws(()=>inspectCandidate(root,manifest),/integrity mismatch/);
  writeFileSync(target,Buffer.from('SYNTHETIC TEST ONLY '+files[0].path));
  writeFileSync(join(root,'unexpected.js'),'unreviewed source');
  assert.throws(()=>inspectCandidate(root,manifest),/unexpected candidate asset/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('candidate generator refuses existing directories, preventing destructive cleanup',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-vendor-preserve-'));
 const target=join(dir,'sentinel.txt');writeFileSync(target,'Do not erase this');
 try{assert.throws(()=>prepareCandidate(dir),/new empty directory/);assert.equal(readFileSync(target,'utf8'),'Do not erase this');}
 finally{rmSync(dir,{recursive:true,force:true});}
});
