import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DocumentStore} from './documents.js';
import {createInferenceServer} from './http.js';
import {resolveFamilyScope} from './family.js';
import {createMajorityTransferService} from './majority-transfer.js';
const projectId='demo-bursyar',subjectId='syntheticStudent';
test('family document routes enforce guardian UID, revocation and post-transfer tombstone',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-family-http-'));const documents=new DocumentStore(join(dir,'private.sqlite'));
 const grant={guardianUid:'guardian',subjectId,authorityVerified:true,consentActive:true,subjectAgeBand:'under_18',expiresAt:Date.now()+60000};
 let currentGrant=grant,modelCalls=0;
 const storageOwner=(await resolveFamilyScope({uid:'guardian',subjectId,loadGrant:async()=>currentGrant})).storageOwner;
 documents.updateProfile(storageOwner,{consent:true,values:{degree:'bachelor'}});
 const server=createInferenceServer({
  projectId,origin:'http://localhost',documents,quota:{reserve(){throw Error('external must remain blocked');}},
  infer:async()=>{modelCalls++;throw Error('external must remain blocked');},
  verify:async token=>({uid:token,aud:projectId,iss:'https://securetoken.google.com/'+projectId,bursyarDemo:true,firebase:{sign_in_provider:'google.com'}}),
  loadFamilyGrant:async()=>currentGrant,diagnose(){}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const fetchAs=async(uid,path,method='GET')=>fetch('http://127.0.0.1:'+server.address().port+path,{method,headers:{authorization:'Bearer '+uid}});
 try{
  assert.equal((await fetchAs('other','/api/family/'+subjectId+'/profile')).status,403);
  assert.equal((await fetchAs('guardian','/api/family/'+subjectId+'/profile')).status,200);
  assert.equal((await fetchAs('guardian','/api/family/'+subjectId+'/analyze','POST')).status,403);
  currentGrant={...grant,consentActive:false};
  assert.equal((await fetchAs('guardian','/api/family/'+subjectId+'/profile')).status,403);
  currentGrant=grant;
  const service=createMajorityTransferService({documents,verifyAuthority:async()=>({approved:true,sourceScope:storageOwner,targetUid:'new-adult',recipientAdultVerified:true,recipientIdentityVerified:true,recipientConsentVerified:true,guardianAuthorityVerified:true,guardianRevocationAuthorized:true})});
  assert.equal((await service.transfer({sourceScope:storageOwner,targetUid:'new-adult'})).transferred,true);
  assert.equal((await fetchAs('guardian','/api/family/'+subjectId+'/profile')).status,403);
  const response=await fetchAs('new-adult','/api/profile');
  assert.equal(response.status,200);
  assert.equal((await response.json()).degree.value,'bachelor');
  assert.equal(modelCalls,0);
 }finally{await new Promise(resolve=>server.close(resolve));documents.close();rmSync(dir,{recursive:true,force:true});}
});
