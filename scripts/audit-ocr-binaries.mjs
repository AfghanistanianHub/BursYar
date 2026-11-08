// Reproduce binary evidence without a compiler, linker, or network access.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyOcrAssets} from './prepare-local-ocr.mjs';
import {sha256} from './prepare-ocr-vendor-candidate.mjs';

function sections(bytes) {
 const result=[];
 let offset=8;
 while(offset<bytes.length){
  const id=bytes[offset++];
  let size=0,byte;
  for(let shift=0; ;shift+=7){
   assert.ok(shift<=28&&offset<bytes.length,'invalid section length');
   byte=bytes[offset++];
   size+=(byte&127)*2**shift;
   if(!(byte&128))break;
  }
  assert.ok(offset+size<=bytes.length,'truncated section');
  result.push({id,bytes:bytes.subarray(offset,offset+size)});
  offset+=size;
 }
 return result;
}

const markers={
 leptonica:'leptonica-%d.%d.%d',libjpeg:'Wrong JPEG library version',
 libpng:'libpng error:',libtiff:'LIBTIFF_STRILE_ARRAY_MAX_RESIZE_COUNT',
 zlib:'unsupported zlib version',
};
const report=[];
for(const file of verifyOcrAssets().filter(({path})=>path.endsWith('.wasm'))){
 const name=file.path.split('/').at(-1);
 const upstream=readFileSync(new URL('../node_modules/tesseract.js-core/'+name,import.meta.url));
 const originalSections=sections(upstream),derivedSections=sections(file.bytes);
 const modification=derivedSections.pop();
 assert.equal(modification.id,0);
 assert.ok(Buffer.from(modification.bytes).includes('bursyar.memory-limit'));
 assert.deepEqual(derivedSections.map(({id})=>id),originalSections.map(({id})=>id));
 for(const [index,section] of originalSections.entries()){
  if(section.id!==5)assert.ok(section.bytes.equals(Buffer.from(derivedSections[index].bytes)),name+' changed section '+section.id);
 }
 const module=new WebAssembly.Module(upstream);
 report.push({
  name,upstreamSha256:sha256(upstream),derivedSha256:sha256(file.bytes),
  codeSha256:sha256(originalSections.find(({id})=>id===10).bytes),
  imports:WebAssembly.Module.imports(module).length,exports:WebAssembly.Module.exports(module).length,
  hasNameSection:WebAssembly.Module.customSections(module,'name').length>0,
  hasLinkingSection:WebAssembly.Module.customSections(module,'linking').length>0,
  diagnosticStrings:Object.keys(markers).filter(key=>upstream.includes(markers[key])),
 });
}
assert.equal(report.length,4);
console.log(JSON.stringify({productionApproved:false,variants:report},null,2));
