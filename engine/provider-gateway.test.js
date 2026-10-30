import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createInferenceServer} from './http.js';

const projectId='demo-bursyar';
const sourceText='Applicants must have completed a bachelor degree before the application deadline.';
const requestBody={text:sourceText,sourceUrl:'https://example.edu/scholarships',language:'en'};

async function runGateway(policyContextForRequest) {
 let calls=0, reservations=0;
 const infer=async()=>{calls++;throw Error('Provider must never be invoked');};
 infer.reservationUnits=()=>1;
 const server=createInferenceServer({
  projectId,origin:'http://127.0.0.1:5173',
  verify:async()=>({uid:'test-user',aud:projectId,iss:'https://securetoken.google.com/'+projectId,bursyarDemo:true,firebase:{sign_in_provider:'google.com'}}),
  quota:{reserve:()=>{reservations++;}},
  infer,canInfer:()=>true,
  ...(policyContextForRequest===undefined?{}:{policyContextForRequest}),
  diagnose:()=>{}
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{
  const url='http://127.0.0.1:'+server.address().port+'/api/analyze';
  const result=await fetch(url,{method:'POST',headers:{authorization:'Bearer token','content-type':'application/json',origin:'http://127.0.0.1:5173'},body:JSON.stringify(requestBody)});
  return {status:result.status,calls,reservations};
 }finally{await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));}
}
test('no resolver denies analysis before provider or quota',async()=>{
 assert.deepEqual(await runGateway(undefined),{status:403,calls:0,reservations:0});
});
test('restricted, minor, unknown and Contributor contexts deny before provider',async()=>{
 const baseline={provider:'meta',model:'muse-spark-1.3',userAgeBand:'adult_18_plus',subjectAgeBand:'adult_18_plus',audience:'adult_only',locationDecision:'allowed',consentVerified:true,dataClass:'user_content'};
 for(const change of [
  {locationDecision:'restricted'}, {locationDecision:'unknown'}, {userAgeBand:'adult_18_plus',subjectAgeBand:'under_18'},
  {audience:'minor_targeted'}, {model:'muse-spark-1.3-contributor'}, {consentVerified:false}
 ])assert.deepEqual(await runGateway(async()=>({...baseline,...change})),{status:403,calls:0,reservations:0});
 assert.deepEqual(await runGateway(async()=>{throw Error('No reliable policy source');}),{status:403,calls:0,reservations:0});
});
