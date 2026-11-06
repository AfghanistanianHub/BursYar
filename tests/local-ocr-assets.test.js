import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {verifyOcrAssets,ocrManifest} from '../scripts/prepare-local-ocr.mjs';

test('local OCR preparation has a checked-in asset integrity manifest',()=>{
 assert.ok(existsSync(new URL('../data/ocr-assets.json',import.meta.url)),'missing checksum manifest');
 const manifest=JSON.parse(readFileSync(new URL('../data/ocr-assets.json',import.meta.url)));
 assert.equal(manifest.productionApproved,false);
 for(const lang of ['eng','fas','pus'])assert.ok(manifest.files.some(f=>f.path===`lang/${lang}.traineddata.gz`));
});


test('local assets reject missing files, changed bytes and unexpected package versions',()=>{
 const modules=mkdtempSync(join(tmpdir(),'ocr-assets-test-'));
 try{
  const names=new Map(ocrManifest.packages.map(p=>[p.key,p.name]));
  for(const p of ocrManifest.packages){const dir=join(modules,p.name);mkdirSync(dir,{recursive:true});writeFileSync(join(dir,'package.json'),JSON.stringify({name:p.name,version:p.version}));}
  for(const f of ocrManifest.files){const dest=join(modules,names.get(f.package),f.source);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,readFileSync(new URL('../node_modules/'+names.get(f.package)+'/'+f.source,import.meta.url)));}
  assert.equal(verifyOcrAssets({modules}).length,23);
  const first=ocrManifest.files[0],target=join(modules,names.get(first.package),first.source),original=readFileSync(target);
  const changed=Buffer.from(original);changed[0]^=1;writeFileSync(target,changed);
  assert.throws(()=>verifyOcrAssets({modules}),/integrity mismatch/);
  writeFileSync(target,original);rmSync(target);
  assert.throws(()=>verifyOcrAssets({modules}),/ENOENT/);writeFileSync(target,original);
  writeFileSync(join(modules,'tesseract.js/package.json'),JSON.stringify({name:'tesseract.js',version:'5.1.2'}));
  assert.throws(()=>verifyOcrAssets({modules}),/version mismatch/);
 }finally{rmSync(modules,{recursive:true,force:true});}
});
