import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectImageDimensions} from '../src/image-preflight.js';
const be=n=>[n>>>24&255,n>>>16&255,n>>>8&255,n&255];
const chunk=(name,data=[])=>[...be(data.length),...Buffer.from(name),...data,0,0,0,0];
const png=(width,height,extra=[])=>Uint8Array.from([137,80,78,71,13,10,26,10,...chunk('IHDR',[...be(width),...be(height),8,6,0,0,0]),...extra,...chunk('IDAT'),...chunk('IEND')]);
const segment=(marker,data)=>[255,marker,(data.length+2)>>>8,(data.length+2)&255,...data];
const frame=(w,h,marker=0xc0)=>segment(marker,[8,h>>>8,h&255,w>>>8,w&255,1,1,0x11,0]);
const scan=()=>[...segment(0xda,[1,1,0,0,63,0]),0x22,255,0,0x33,255,0xd0,0x44];
const jpeg=(w,h,marker=0xc0,metadata=[])=>Uint8Array.from([255,216,...metadata,...frame(w,h,marker),...scan(),255,217]);
const rejects=(bytes,mime,code)=>assert.throws(()=>inspectImageDimensions(bytes,mime),e=>e.code===code);
test('static PNG and baseline/extended/progressive JPEG dimensions remain supported',()=>{
 assert.deepEqual(inspectImageDimensions(png(100,200),'image/png'),{width:100,height:200});
 for(const marker of [0xc0,0xc1,0xc2])assert.deepEqual(inspectImageDimensions(jpeg(100,200,marker),'image/jpeg'),{width:100,height:200});
 assert.deepEqual(inspectImageDimensions(jpeg(4500,1),'image/jpeg'),{width:4500,height:1});
});
test('oversized, zero and area-only dimensions fail before decode',()=>{
 for(const [w,h] of [[4501,1],[1,4501],[4000,4000],[0,10],[10,0]]){
  rejects(png(w,h),'image/png','imageDimensions');rejects(jpeg(w,h),'image/jpeg','imageDimensions');
 }
 rejects(png(0xffffffff,10),'image/png','imageDimensions');
});
test('PNG requires complete primary IHDR and rejects duplicate/animated/concatenated representations',()=>{
 for(const b of [png(100,100).slice(0,30),png(100,100,[...chunk('IHDR',Array(13).fill(0))]),png(100,100,[...chunk('acTL',[0,0,0,1,0,0,0,0])]),Uint8Array.from([...png(100,100),...png(1,1)])])rejects(b,'image/png','invalidImage');
 const b=png(100,100);b[11]=12;rejects(b,'image/png','invalidImage');
});
test('JPEG skips metadata by length, honors marker fill and rejects invalid/truncated/missing frames',()=>{
 const metadata=segment(0xe1,frame(10,10));
 rejects(jpeg(5000,1,0xc0,metadata),'image/jpeg','imageDimensions');
 const filled=jpeg(100,100,0xc2,[255,...metadata]);
 assert.deepEqual(inspectImageDimensions(filled,'image/jpeg'),{width:100,height:100});
 for(const b of [Uint8Array.from([255,216,255,0xe1,0,1,255,217]),jpeg(100,100).slice(0,10),Uint8Array.from([255,216,...scan(),255,217])])rejects(b,'image/jpeg','invalidImage');
});
test('JPEG rejects changed dimensions after a scan, multiple frames and concatenated images',()=>{
 for(const extra of [segment(0xdc,[0x20,0x00]),frame(100,100),segment(0xde,[0,0])])rejects(Uint8Array.from([255,216,...frame(100,100),...scan(),...extra,255,217]),'image/jpeg','invalidImage');
 rejects(Uint8Array.from([...jpeg(100,100),...jpeg(5000,1)]),'image/jpeg','invalidImage');
});
