import test from 'node:test';
import {isSpendingConfirmed} from '../engine/spending.js';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,chmodSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateKeychainConfig,rebootEnvironment,existingPrivateFile,KeychainAccessError,parseSpendingLimit} from '../verification/macos-config.mjs';
const config=()=>({version:1,metaApiKey:'test-key-not-real',metaModelId:'test-model',spendingConfirmed:false,spendLimitUSD:0,confirmedAt:''});
test('reboot startup is deterministic with an empty shell and live spending disabled',()=>{
 const env=rebootEnvironment(config(),'/private/test-user');assert.equal(env.BURSYAR_QUOTA_DB,'/private/test-user/.bursyar-private/quota.sqlite');assert.equal(env.GOOGLE_APPLICATION_CREDENTIALS,'/private/test-user/.bursyar-private/firebase-admin.json');assert.equal(env.BURSYAR_SPENDING_CONFIRMED,'0');assert.equal(env.BURSYAR_SPEND_LIMIT_USD,'0');assert.equal(env.META_API_KEY,'test-key-not-real');assert.equal(Object.keys(env).filter(k=>k.startsWith('VITE_')).length,0);
});
test('spending gate requires positive finite account limit and explicit confirmation timestamp',()=>{
 for(const c of [{...config(),spendingConfirmed:true},{...config(),spendingConfirmed:true,spendLimitUSD:-1,confirmedAt:new Date().toISOString()},{...config(),spendingConfirmed:true,spendLimitUSD:Infinity,confirmedAt:new Date().toISOString()}])assert.throws(()=>validateKeychainConfig(c));
 const env=rebootEnvironment({...config(),spendingConfirmed:true,spendLimitUSD:1,confirmedAt:new Date().toISOString()});assert.equal(env.BURSYAR_SPENDING_CONFIRMED,'1');assert.equal(env.BURSYAR_SPEND_LIMIT_USD,'1');
});
test('malformed Keychain data never silently selects a fallback model or credential',()=>{
 for(const c of [null,{}, {...config(),metaModelId:''},{...config(),metaApiKey:''},{...config(),metaApiKey:'line\nbreak'},{...config(),version:2},{...config(),spendingConfirmed:'yes'}])assert.throws(()=>validateKeychainConfig(c));
});
test('missing or insecure private files are rejected, never created or followed through symlinks',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-reboot-'));try{const path=join(dir,'quota.sqlite');assert.throws(()=>existingPrivateFile(path));writeFileSync(path,'existing quota content',{mode:0o600});assert.equal(existingPrivateFile(path),path);chmodSync(path,0o644);assert.throws(()=>existingPrivateFile(path));chmodSync(path,0o600);symlinkSync(path,join(dir,'link'));assert.throws(()=>existingPrivateFile(join(dir,'link')));}finally{rmSync(dir,{recursive:true,force:true});}
});

test('Keychain service failures never masquerade as missing credentials or reveal subprocess data',()=>{
 const missing=new KeychainAccessError('',44);assert.match(missing.message,/not found/);
 const service=new KeychainAccessError('BursYar Keychain operation unavailable (-67674). SECRET',1);assert.match(service.message,/service is unavailable/);assert.match(service.message,/do not re-enter/);assert.ok(!service.message.includes('SECRET'));
 for(const status of [-25308,-25293])assert.match(new KeychainAccessError(`operation unavailable (${status}) SECRET`,1).message,/macOS/);
 const unknown=new KeychainAccessError('SECRET arbitrary output',1);assert.match(unknown.message,/missing credential has not been established/);assert.ok(!unknown.message.includes('SECRET'));
});

test('a saved USD 5 amount alone is not confirmation; confirmed USD 5 survives the full environment mapping',()=>{
 const unconfirmed=rebootEnvironment({...config(),spendLimitUSD:5});assert.equal(unconfirmed.BURSYAR_SPENDING_CONFIRMED,'0');assert.equal(isSpendingConfirmed(unconfirmed),false);
 const confirmed=rebootEnvironment({...config(),spendLimitUSD:5,spendingConfirmed:true,confirmedAt:'2026-10-27T00:00:00Z'});
 assert.equal(confirmed.BURSYAR_SPEND_LIMIT_USD,'5');assert.equal(confirmed.BURSYAR_SPENDING_CONFIRMED,'1');assert.equal(isSpendingConfirmed(confirmed),true);
 for(const override of [{BURSYAR_SPENDING_CONFIRMED:'true'},{BURSYAR_SPEND_LIMIT_USD:'0'},{BURSYAR_SPENDING_CONFIRMED_AT:''},{BURSYAR_SPEND_LIMIT_USD:'NaN'}])assert.equal(isSpendingConfirmed({...confirmed,...override}),false);
});
test('explicit attestation accepts plain or dollar-prefixed USD amounts, rejects invalid or ambiguous values',()=>{
 for(const input of ['5','5.00','$5','$ 5.00'])assert.equal(parseSpendingLimit(input),5);
 for(const input of [undefined,'','0','-5','5junk','5,00','NaN','Infinity','1.001','1e3'])assert.equal(parseSpendingLimit(input),null);
});
