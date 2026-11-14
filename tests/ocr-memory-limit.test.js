import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const url=new URL('../scripts/limit-ocr-memory.mjs',import.meta.url);
let limiter;if(existsSync(url))limiter=await import(url);
const u32=n=>{const out=[];do{let b=n&127;n=Math.floor(n/128);out.push(b|(n?128:0));}while(n);return out;};
const section=(id,bytes)=>[id,...u32(bytes.length),...bytes];
const wasm=(memory=[1,1,...u32(256),...u32(32768)])=>Uint8Array.from([0,97,115,109,1,0,0,0,
 ...section(1,[1,96,1,127,1,127]),...section(3,[1,0]),...section(5,memory),
 ...section(7,[2,1,109,2,0,4,103,114,111,119,0,0]),...section(10,[1,6,0,32,0,64,0,11])]);
test('verified core memory can be capped at the engine level, including internal memory.grow',async()=>{
 assert.equal(typeof limiter?.limitCoreMemory,'function','missing memory-section limiter');
 const original=wasm(),derived=limiter.limitCoreMemory(original);
 const {instance}=await WebAssembly.instantiate(derived);
 assert.equal(instance.exports.m.buffer.byteLength,16*1024*1024);
 assert.equal(instance.exports.grow(1),256);
 assert.equal(instance.exports.grow(3840),-1,'internal WASM growth beyond 256 MiB must fail');
 assert.equal(instance.exports.m.buffer.byteLength,257*65536);
 assert.deepEqual(original,wasm(),'never modify upstream source bytes');
});
test('unreviewed memory declarations and malformed core binaries fail closed',()=>{
 assert.ok(limiter,'missing memory-section limiter');
 for(const memory of [[1,0,...u32(256)],[1,1,...u32(256),...u32(4096)],[1,1,...u32(257),...u32(32768)],[2,1,...u32(256),...u32(32768),1,1,1]])assert.throws(()=>limiter.limitCoreMemory(wasm(memory)));
 for(const b of [new Uint8Array(),wasm().slice(0,12),Uint8Array.from([0,97,115,109,1,0,0,0,5,255,255,255,255,127])])assert.throws(()=>limiter.limitCoreMemory(b));
});

test('imported memory and unexpected embedded payloads cannot bypass the derived limit',()=>{
 const imported=Uint8Array.from([0,97,115,109,1,0,0,0,
  ...section(1,[1,96,1,127,1,127]),...section(2,[1,3,101,110,118,6,109,101,109,111,114,121,2,1,...u32(256),...u32(32768)]),
  ...section(3,[1,0]),...section(7,[2,1,109,2,0,4,103,114,111,119,0,0]),...section(10,[1,6,0,32,0,64,0,11])]);
 assert.equal(WebAssembly.validate(imported),true);assert.throws(()=>limiter.limitCoreMemory(imported),/Unreviewed/);
 const source=wasm(),encoded=Buffer.from(source).toString('base64'),js=Buffer.from('const binary="data:application/octet-stream;base64,'+encoded+'";');
 const derived=limiter.limitEmbeddedCore(js,source);
 assert.notDeepEqual(derived,js);
 assert.throws(()=>limiter.limitEmbeddedCore(Buffer.concat([js,js]),source),/Unreviewed/);
 assert.throws(()=>limiter.limitEmbeddedCore(js,Uint8Array.from([0,1,2])),/Unreviewed/);
});

test('modified binary and JavaScript artifacts carry their own modification notices',()=>{
 const source=wasm(),derived=limiter.limitCoreMemory(source);
 const notices=WebAssembly.Module.customSections(new WebAssembly.Module(derived),'bursyar.memory-limit');
 assert.equal(notices.length,1,'modified WASM must carry its notice');
 assert.match(new TextDecoder().decode(notices[0]),/BursYar.*256 MiB/);
 const js=Buffer.from('const b="data:application/octet-stream;base64,'+Buffer.from(source).toString('base64')+'";');
 assert.match(new TextDecoder().decode(limiter.limitEmbeddedCore(js,source)),/^\/\* BursYar modification:/);
});
