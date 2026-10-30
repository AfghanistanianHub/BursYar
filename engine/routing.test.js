import test from 'node:test';
import assert from 'node:assert/strict';
import {createInferenceServer} from './http.js';
import {adultPolicy} from '../tests/helpers/policy.js';
async function check(context,adapter){
 let calls=0,reservations=0,prompts=0;
 const actual={provider:'meta',model:'muse-spark-1.3',available:true,infer:async()=>{calls++;throw Error('outage');},reservationUnits:()=>{prompts++;return 1;},quota:{reserve(){reservations++;}},...adapter};
 const server=createInferenceServer({projectId:'demo-bursyar',origin:'http://localhost',verify:async()=>({uid:'one',aud:'demo-bursyar',iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true}),quota:actual.quota,infer:actual.infer,providers:{[actual.provider]:actual},policyContextForRequest:async()=>context,diagnose(){}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const response=await fetch(`http://127.0.0.1:${server.address().port}/api/analyze`,{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json','x-country':'CA','x-age':'25'},body:JSON.stringify({text:'Applicants must hold a bachelor degree.',sourceUrl:'https://example.edu',language:'en',country:'CA',age:25})});return {status:response.status,calls,reservations,prompts};}finally{await new Promise(r=>server.close(r));}
}
test('every denial precedes prompt reservation and outbound transport, including mismatched real models',async()=>{
 for(const change of [{userAgeBand:'under_18'},{subjectAgeBand:'under_18'},{audience:'minor_targeted'},{locationDecision:'unknown'},{locationDecision:'restricted'},{consentVerified:false},{dataClass:'public_source'},{model:'muse-spark-1.3-contributor'}])assert.deepEqual(await check({...adultPolicy,...change}),{status:403,calls:0,reservations:0,prompts:0});
 assert.deepEqual(await check(adultPolicy,{model:'muse-spark-1.3-contributor'}),{status:403,calls:0,reservations:0,prompts:0});
 assert.deepEqual(await check(adultPolicy,{available:false}),{status:503,calls:0,reservations:0,prompts:0});
});
test('permitted outage consumes its provider reservation once and never falls back',async()=>{
 assert.deepEqual(await check(adultPolicy),{status:502,calls:1,reservations:1,prompts:1});
});
