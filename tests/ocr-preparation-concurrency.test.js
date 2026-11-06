import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFileSync,mkdtempSync,mkdirSync,copyFileSync,symlinkSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
const exec=promisify(execFile),repo=fileURLToPath(new URL('../',import.meta.url));
test('cold concurrent initializers publish one complete, licensed, capped generation',async()=>{
 // Isolate generated output from running preview/build processes and start cold.
 const cwd=mkdtempSync(join(tmpdir(),'bursyar-ocr-concurrent-'));
 try{
  for(const dir of ['scripts','data','public/licenses'])mkdirSync(join(cwd,dir),{recursive:true});
  for(const path of ['scripts/prepare-local-ocr.mjs','scripts/atomic-directory.mjs','scripts/limit-ocr-memory.mjs','scripts/prepare-ocr-vendor-candidate.mjs','data/ocr-assets.json','data/ocr-derived-assets.json','data/ocr-model-provenance.json','public/licenses/tessdata-LICENSE.txt'])copyFileSync(join(repo,path),join(cwd,path));
  symlinkSync(join(repo,'node_modules'),join(cwd,'node_modules'),'junction');
  const results=await Promise.allSettled([1,2].map(()=>exec(process.execPath,['scripts/prepare-local-ocr.mjs'],{cwd,timeout:30000})));
  const summaries=results.map(r=>{assert.equal(r.status,'fulfilled',r.reason?.message);const data=JSON.parse(r.value.stdout);assert.equal(data.productionApproved,false);assert.equal(data.files,26);return data;});
  assert.ok(summaries.some(s=>s.reused!==true));assert.ok(summaries.some(s=>s.reused===true));
  const manifest=JSON.parse(readFileSync(join(cwd,'public/vendor/ocr-v1/asset-manifest.json')));
  assert.equal(manifest.derived.memoryMaximumBytes,256*1024*1024);assert.equal(manifest.outputs.length,26);
  for(const path of ['licenses/tessdata-LICENSE.txt','MODEL-PROVENANCE.json','CORE-MODIFICATIONS.txt'])assert.ok(manifest.outputs.some(f=>f.path===path));
 }finally{rmSync(cwd,{recursive:true,force:true});}
});
