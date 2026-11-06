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
  assert.equal(verifyOcrAssets({modules}).length,ocrManifest.files.length);
  const first=ocrManifest.files[0],target=join(modules,names.get(first.package),first.source),original=readFileSync(target);
  const changed=Buffer.from(original);changed[0]^=1;writeFileSync(target,changed);
  assert.throws(()=>verifyOcrAssets({modules}),/integrity mismatch/);
  writeFileSync(target,original);rmSync(target);
  assert.throws(()=>verifyOcrAssets({modules}),/ENOENT/);writeFileSync(target,original);
  writeFileSync(join(modules,'tesseract.js/package.json'),JSON.stringify({name:'tesseract.js',version:'5.1.2'}));
  assert.throws(()=>verifyOcrAssets({modules}),/version mismatch/);
 }finally{rmSync(modules,{recursive:true,force:true});}
});

test('prepared core assets have an enforced 256 MiB engine maximum in standalone and embedded WASM',()=>{
 const files=verifyOcrAssets();
 for(const file of files.filter(f=>/\.wasm$/.test(f.path))){
  const module=new WebAssembly.Module(file.bytes),imports={};
  for(const i of WebAssembly.Module.imports(module)){assert.equal(i.kind,'function');(imports[i.module]??={})[i.name]=()=>0;}
  const instance=new WebAssembly.Instance(module,imports);
  const memory=Object.values(instance.exports).find(v=>v instanceof WebAssembly.Memory);
  assert.ok(memory);assert.throws(()=>memory.grow(4096),RangeError,file.path);
  const js=files.find(f=>f.path===file.path+'.js');
  const match=/data:application\/octet-stream;base64,([A-Za-z0-9+/=]+)/.exec(Buffer.from(js.bytes).toString());
  assert.ok(match);assert.deepEqual(Buffer.from(match[1],'base64'),Buffer.from(file.bytes));
 }
});

test('model provenance binds all three pinned NPM models to the recorded upstream revision',async()=>{
 const api=await import('../scripts/prepare-local-ocr.mjs');
 assert.equal(typeof api.verifyModelProvenance,'function','missing provenance gate');
 const provenance=JSON.parse(readFileSync(new URL('../data/ocr-model-provenance.json',import.meta.url)));
 const license=readFileSync(new URL('../public/licenses/tessdata-LICENSE.txt',import.meta.url));
 assert.equal(api.verifyModelProvenance(provenance,license),true);
 const changed=structuredClone(provenance);changed.models[0].compressedSha256='0'.repeat(64);
 assert.throws(()=>api.verifyModelProvenance(changed,license),/provenance/);
 assert.throws(()=>api.verifyModelProvenance(provenance,Buffer.from('wrong license')),/license/);
});

test('model distribution selects the authoritative upstream grant and excludes wrapper license labels',()=>{
 const p=JSON.parse(readFileSync(new URL('../data/ocr-model-provenance.json',import.meta.url)));
 assert.equal(p.selectedDistributionLicense,'Apache-2.0');
 assert.ok(p.licenseEvidence.maintainerStatementUrl.includes('issuecomment-1686457658'));
 assert.equal(ocrManifest.files.some(f=>/^licenses\/(eng|fas|pus)-(package\.json|README\.md)$/.test(f.path)),false);
 const inventory=JSON.parse(readFileSync(new URL('../data/ocr-license-inventory.json',import.meta.url)));
 assert.deepEqual(inventory.assets.map(a=>a.path).sort(),ocrManifest.files.map(f=>f.path).sort());
 assert.equal(inventory.productionApproved,false);
 for(const a of inventory.assets.filter(a=>a.kind==='model'))assert.equal(a.selectedLicense,'Apache-2.0');
});
