import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveFamilyScope} from './family.js';
test('only the verified guardian can resolve an active student scope; all family inference stays deterministic',async()=>{
 const grant={guardianUid:'guardian',subjectId:'student',authorityVerified:true,consentActive:true,expiresAt:3000,subjectAgeBand:'under_18'};
 const resolve=(uid,r=grant)=>resolveFamilyScope({uid,subjectId:'student',loadGrant:async()=>r,now:()=>2000});
 const scope=await resolve('guardian');assert.equal(scope.processing,'deterministic');assert.notEqual(scope.storageOwner,'guardian');assert.equal(scope.storageOwner,(await resolve('guardian')).storageOwner);
 for(const [uid,change]of [['other',{}],['guardian',{authorityVerified:false}],['guardian',{consentActive:false}],['guardian',{expiresAt:2000}],['guardian',{subjectId:'other'}]])await assert.rejects(resolve(uid,{...grant,...change}));
});
