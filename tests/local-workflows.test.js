import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';
import {createScholarshipCatalog} from '../engine/deterministic.js';
const text='Applicants must hold a bachelor degree.';
const program={id:'synthetic-reviewed-test',coverageComplete:true,sourceUrl:'https://example.edu/award',sourceText:text,sourceDigest:createHash('sha256').update(text).digest('hex'),review:{status:'approved',sourceVerification:'official_source_reviewed',reviewedAt:'2026-10-29',expiresAt:'2030-01-01T00:00:00Z'},rules:[{id:'degree',type:'minimum_degree',minimum:'bachelor',sourceExcerpt:text}]};
test('deterministic and guardian HTTP workflows use stored profiles, isolate claims, export/erase and make zero provider calls',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-family-'));const documents=new DocumentStore(join(dir,'docs.db'));let calls=0,reservations=0,revoked=false;
 const grant={guardianUid:'guardian',subjectId:'student',authorityVerified:true,consentActive:true,subjectAgeBand:'under_18',expiresAt:Date.now()+60000};
 const server=createInferenceServer({projectId:'demo-bursyar',origin:'http://localhost',documents,catalog:createScholarshipCatalog([program]),loadFamilyGrant:async()=>({...grant,consentActive:!revoked}),quota:{reserve(){reservations++;}},infer:async()=>{calls++;},verify:async uid=>({uid,aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const api=async(path,method='GET',body,uid='guardian')=>fetch(`http://127.0.0.1:${server.address().port}/api${path}`,{method,headers:{authorization:`Bearer ${uid}`,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 try{
  assert.equal((await api('/scholarships')).status,200);
  for(const prefix of ['', '/family/student']){
   const response=await api(prefix+'/profile','PUT',{consent:true,values:{degree:'bachelor'}});assert.equal(response.status,200);
   const assessed=await api(prefix+'/evaluate','POST',{scholarshipId:program.id,profile:{degree:'doctorate'},country:'AF'});assert.equal(assessed.status,200);assert.equal((await assessed.json()).summary,'met');
  }
  assert.equal((await api('/family/student/profile','GET',null,'other')).status,403);
  assert.equal((await api('/family/other/profile')).status,403);
  assert.equal((await api('/family/student/analyze','POST',{text,sourceUrl:program.sourceUrl,language:'en'})).status,403);
  const upload=await api('/family/student/documents','POST',{consent:true,mime:'text/plain',text:'Degree: master'});assert.equal(upload.status,201);const doc=await upload.json();assert.equal(doc.authenticity,'not_verified');
  assert.equal((await api('/documents/'+doc.id)).status,404);
  const before=await(await api('/family/student/profile')).json();assert.equal(before.degree.value,'bachelor');
  assert.equal((await api('/family/student/documents/'+doc.id+'/review','POST',{decisions:{[doc.pending[0].id]:{action:'accept'}}})).status,200);
  const exported=await(await api('/family/student/export')).json();assert.equal(exported.profile.degree.value,'master');assert.equal(exported.issuerAuthenticated,false);assert.equal(exported.documents.length,1);
  await api('/family/student/erase','DELETE');assert.deepEqual((await(await api('/family/student/export')).json()).profile,{});
  assert.equal((await(await api('/profile')).json()).degree.value,'bachelor');
  revoked=true;assert.equal((await api('/family/student/export')).status,403);
  assert.equal((await api('/evaluate','POST',{scholarshipId:'unknown'})).status,422);
  assert.equal(calls,0);assert.equal(reservations,0);
 }finally{await new Promise(r=>server.close(r));documents.close();rmSync(dir,{recursive:true,force:true});}
});
