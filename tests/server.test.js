import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
process.env.BURSYAR_INTERNAL_TOKEN='test-only-token-with-at-least-32-characters';
delete process.env.META_API_KEY;delete process.env.MODEL_API_KEY;
const {server}=await import('../engine/server.js');
test('HTTP boundary denies unauthenticated requests and fails honestly without provider',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const url=`http://127.0.0.1:${server.address().port}/v1/analyze`;
 assert.equal((await fetch(url,{method:'POST'})).status,401);
 const r=await fetch(url,{method:'POST',headers:{authorization:`Bearer ${process.env.BURSYAR_INTERNAL_TOKEN}`}});
 assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'Meta provider not configured'});
 }finally{await new Promise(resolve=>server.close(resolve));}
});
