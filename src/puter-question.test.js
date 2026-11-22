import test from 'node:test';
import assert from 'node:assert/strict';
import {PUTER_MODEL,PUTER_SCRIPT_URL,loadPuter} from './puter-question.js';
test('Puter integration uses official browser SDK and low-cost default',()=>{
 assert.equal(PUTER_SCRIPT_URL,'https://js.puter.com/v2/');
 assert.equal(PUTER_MODEL,'gpt-6-luna');
});
test('Puter SDK is loaded only when requested',async()=>{
 const old=globalThis.puter;
 let appended=0;
 const doc={head:{append(script){appended++;globalThis.puter={ai:{chat:async()=>''}};script.onload();}},createElement(){return {}}};
 try{
  delete globalThis.puter;
  const api=await loadPuter({doc});
  assert.equal(appended,1);
  assert.equal(typeof api.ai.chat,'function');
 }finally{if(old===undefined)delete globalThis.puter;else globalThis.puter=old;}
});
