import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {authenticate} from '../engine/auth.js';
import {QuotaStore,QuotaExceeded} from '../engine/quota.js';
const project='demo-bursyar';
const user={uid:'approved-user',aud:project,iss:`https://securetoken.google.com/${project}`,bursyarDemo:true,firebase:{sign_in_provider:'google.com'}};
test('identity boundary rejects missing, invalid, wrong-project and unapproved accounts',async()=>{
 assert.equal(await authenticate('Bearer signed-token',async()=>user,project),user.uid);
 for(const u of [{...user,aud:'other'}, {...user,bursyarDemo:false},{...user,firebase:{sign_in_provider:'anonymous'}}, {...user,uid:''}])await assert.rejects(authenticate('Bearer token',async()=>u,project));
 await assert.rejects(authenticate('Bearer token',async()=>{throw Error('expired/revoked');},project));
 await assert.rejects(authenticate(undefined,async()=>user,project));
});
test('SQLite reservations survive restart; multiple connections share caps; failed reservation is atomic',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-quota-'));const path=join(dir,'quota.sqlite');
 const limits={userMinute:1,userDay:2,globalDay:3,lifetimeUnits:30};
 let a=new QuotaStore(path,limits);const b=new QuotaStore(path,limits);
 try{
 a.reserve('one',10,0);assert.throws(()=>b.reserve('one',10,0),QuotaExceeded);
 a.close();a=new QuotaStore(path,limits);assert.throws(()=>a.reserve('one',10,0),QuotaExceeded);
 b.reserve('two',10,0);a.reserve('one',10,60000);
 assert.throws(()=>b.reserve('three',1,60000),QuotaExceeded);
 assert.throws(()=>b.reserve('three',1,86400000),QuotaExceeded); // lifetime does not reset daily
 }finally{a.close();b.close();rmSync(dir,{recursive:true,force:true});}
});
test('storage path and invalid limits fail closed',()=>{assert.throws(()=>new QuotaStore('relative.db',{}));});
