import test from 'node:test';
import assert from 'node:assert/strict';
import {readDocumentText} from '../src/document-input.js';
const file=(name,bytes)=>({name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer});
const text=(name,value)=>file(name,new TextEncoder().encode(value));
test('valid UTF-8 text preserves exact source bytes and recognizes uppercase extensions',async()=>{
 assert.equal(await readDocumentText(text('TRANSCRIPT.TXT','Degree: bachelor\nیادداشت')),'Degree: bachelor\nیادداشت');
});
test('unsupported, oversized, empty, malformed UTF-8 and binary files have distinct safe errors',async()=>{
 for(const [input,code]of [[null,'missingFile'],[text('scan.pdf','hello'),'unsupportedFile'],[text('large.txt','x'.repeat(12001)),'fileTooLarge'],[text('empty.txt','  \n'),'emptyFile'],[file('bad.txt',[0xc3,0x28]),'invalidEncoding'],[file('binary.txt',[65,0]),'invalidEncoding']]){
  await assert.rejects(()=>readDocumentText(input),error=>error.code===code);
 }
});
test('decoded size is checked even when file metadata underreports bytes',async()=>{
 const input=text('oversize.txt','ی'.repeat(6001));input.size=1;
 await assert.rejects(()=>readDocumentText(input),error=>error.code==='fileTooLarge');
});
