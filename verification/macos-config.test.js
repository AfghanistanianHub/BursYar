import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {forwardPrivateConfigPaths} from './macos-config.mjs';

const dir=mkdtempSync(join(tmpdir(),'bursyar-forward-'));
const good=join(dir,'provider.json');writeFileSync(good,'{}',{mode:0o600});
const wide=join(dir,'wide.json');writeFileSync(wide,'{}',{mode:0o640});
const link=join(dir,'link.json');symlinkSync(good,link);
test.after(()=>rmSync(dir,{recursive:true,force:true}));

test('absent config paths forward nothing and launcher stays deterministic-capable',()=>{
 assert.deepEqual(forwardPrivateConfigPaths({}),{});
 assert.deepEqual(forwardPrivateConfigPaths({BURSYAR_PROVIDER_CONFIG:'',BURSYAR_POLICY_RECORDS:''}),{});
});

test('only the two allowlisted private-config paths forward, verbatim',()=>{
 assert.deepEqual(
  forwardPrivateConfigPaths({BURSYAR_PROVIDER_CONFIG:good,BURSYAR_POLICY_RECORDS:good}),
  {BURSYAR_PROVIDER_CONFIG:good,BURSYAR_POLICY_RECORDS:good});
});

test('secret and unrelated variables are never forwarded',()=>{
 assert.deepEqual(forwardPrivateConfigPaths({
  META_API_KEY:'k',MODEL_API_KEY:'k',GEMINI_API_KEY:'k',
  BURSYAR_QUOTA_DB:'/x',BURSYAR_DOCUMENT_DB:'/x',VITE_FIREBASE_API_KEY:'k',
  PATH:'/bin',BURSYAR_SPENDING_CONFIRMED:'1',BURSYAR_SPEND_LIMIT_USD:'5'
 }),{});
});

test('unsafe or missing config paths fail closed with an actionable message',()=>{
 for(const value of [join(dir,'nope.json'),'relative/path.json',wide,link,dir]){
  assert.throws(()=>forwardPrivateConfigPaths({BURSYAR_PROVIDER_CONFIG:value}),/missing or unsafe/);
  assert.throws(()=>forwardPrivateConfigPaths({BURSYAR_POLICY_RECORDS:value}),/missing or unsafe/);
 }
});
