// Isolated emulator integration only. No live Meta call; no production project.
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,query,where,updateDoc,deleteDoc} from 'firebase/firestore';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {createInferenceServer} from '../engine/http.js';
import {QuotaStore} from '../engine/quota.js';
import {DocumentStore} from '../engine/documents.js';
const projectId='demo-bursyar';
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,'127.0.0.1:9099');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8088');
const env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8088,rules:readFileSync('firestore.rules','utf8')}});
const admin=initializeApp({projectId},'bursyar-emulator-integration');const auth=getAuth(admin);
const dir=mkdtempSync(join(tmpdir(),'bursyar-emulator-'));let server,documents;let checks=0;
try {
 await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();await setDoc(doc(db,'scholarships/public'),{status:'published',title:'Reviewed test record'});await setDoc(doc(db,'scholarships/private'),{status:'draft'});await setDoc(doc(db,'review_logs/internal'),{secret:'test-only'});});
 for(const ctx of [env.unauthenticatedContext(),env.authenticatedContext('alice'),env.authenticatedContext('bob')]){
  const db=ctx.firestore();await assertSucceeds(getDoc(doc(db,'scholarships/public')));checks++;
  await assertSucceeds(getDocs(query(collection(db,'scholarships'),where('status','==','published'))));checks++;
  const denied=[()=>getDoc(doc(db,'scholarships/private')),()=>getDocs(collection(db,'scholarships')),()=>getDoc(doc(db,'review_logs/internal')),()=>setDoc(doc(db,'scholarships/new'),{status:'published'}),()=>updateDoc(doc(db,'scholarships/public'),{status:'draft'}),()=>deleteDoc(doc(db,'scholarships/public')),()=>setDoc(doc(db,'users/bob'),{role:'admin'}),()=>setDoc(doc(db,'quota/alice'),{used:0})];
  for(const call of denied){await assertFails(call());checks++;}
 }
 // Google IdP protocol in Auth emulator. Unsigned emulator tokens are never live proof.
 async function google(email){
  const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
  const idp=b64({alg:'none',typ:'JWT'})+'.'+b64({sub:email,email,email_verified:true,name:'Emulator demo user',iss:'https://accounts.google.com',aud:'demo-client'})+'.';
  const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo-key',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestUri:'http://localhost',postBody:new URLSearchParams({providerId:'google.com',id_token:idp}).toString(),returnSecureToken:true,returnIdpCredential:true})});
  assert.equal(response.status,200,'Google emulator sign-in must succeed');return response.json();
 }
 const alice=await google('alice@example.test');const bob=await google('bob@example.test');const unapproved=await google('unapproved@example.test');checks+=3;
 await auth.setCustomUserClaims(alice.localId,{bursyarDemo:true});await auth.setCustomUserClaims(bob.localId,{bursyarDemo:true});
 const a=await google('alice@example.test'),b=await google('bob@example.test');
 const quota=new QuotaStore(join(dir,'quota.db'),{userMinute:1,userDay:2,globalDay:5,lifetimeUnits:100000});let calls=0;
 const source='Applicants must provide academic transcripts. Tuition fees are covered.';
 const inference={criteria:[{kind:'transcripts',required:true,excerpt:'Applicants must provide academic transcripts.',en:'Provide transcripts.',fa:'اسناد تحصیلی ارائه کنید.',ps:'تحصیلي اسناد وړاندې کړئ.'}],deadline:null,funding:['Tuition fees are covered.']};
 documents=new DocumentStore(join(dir,'documents.db'));
 server=createInferenceServer({documents,projectId,origin:'http://localhost:5173',verify:token=>auth.verifyIdToken(token,true),quota,infer:async()=>{calls++;return JSON.stringify(inference);},maxConcurrent:10});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const post=(token,extra={})=>fetch(`http://127.0.0.1:${server.address().port}/api/analyze`,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify({text:source,sourceUrl:'https://example.edu/scholarship',language:'ps',...extra})});
 assert.equal((await post()).status,401);assert.equal((await post(unapproved.idToken)).status,401);checks+=2;
 const responses=await Promise.all([post(a.idToken),post(a.idToken,{uid:b.localId}),post(a.idToken,{quota:{used:0}})]);
 assert.equal(responses.filter(r=>r.status===200).length,1);assert.equal(responses.filter(r=>r.status===429).length,2);assert.equal(calls,1);checks+=3;
 assert.equal((await post(b.idToken)).status,200);assert.equal(calls,2);checks++;
 const documentRequest=(token,path,method='GET',body)=>fetch(`http://127.0.0.1:${server.address().port}${path}`,{method,headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const uploaded=await documentRequest(a.idToken,'/api/documents','POST',{mime:'text/plain',consent:true,text:'SYNTHETIC EMULATOR ONLY\nDegree: bachelor'});
 assert.equal(uploaded.status,201);const document=await uploaded.json();checks++;
 assert.equal((await documentRequest(b.idToken,`/api/documents/${document.id}`)).status,404);checks++;
 assert.equal((await documentRequest(a.idToken,`/api/documents/${document.id}/review`,'POST',{decisions:{[document.pending[0].id]:{action:'accept'}}})).status,200);checks++;
 assert.equal((await (await documentRequest(a.idToken,'/api/profile')).json()).degree.origin,'document_extracted');checks++;
 assert.deepEqual(await (await documentRequest(b.idToken,'/api/profile')).json(),{});checks++;
 assert.equal((await documentRequest(a.idToken,`/api/documents/${document.id}`,'DELETE')).status,200);checks++;
 assert.equal((await documentRequest(a.idToken,`/api/documents/${document.id}`)).status,404);checks++;
 await auth.updateUser(b.localId,{disabled:true});assert.equal((await post(b.idToken)).status,401);checks++;
 await new Promise(resolve=>server.close(resolve));server=undefined;quota.close();
 console.log(JSON.stringify({mode:'LOCAL_EMULATORS_WITH_FAKE_MODEL',checks,passed:true,liveFirebaseVerified:false,liveMetaVerified:false}));
}finally{documents?.close();if(server)await new Promise(resolve=>server.close(resolve));await env.cleanup();await deleteApp(admin);rmSync(dir,{recursive:true,force:true});}
