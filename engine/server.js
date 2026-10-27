import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { validateRequest, createPrompt, normalizeModelResponse } from './engine.js';

const env = process.env;
const port = Number(env.PORT || 8080);
const endpoint = 'https://api.meta.ai/v1/chat/completions';
const key = env.MODEL_API_KEY || env.META_API_KEY;
const model = env.META_MODEL_ID;
const internalToken = env.BURSYAR_INTERNAL_TOKEN;
if (!internalToken || internalToken.length < 32) throw new Error('Set a strong BURSYAR_INTERNAL_TOKEN (32+ characters)');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const maxBytes = 16 * 1024;
const capacity = 10;
const windowMs = 60_000;
const hits = new Map();
function send(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff' });
  res.end(JSON.stringify(data));
}
function authorized(header) {
  if (typeof header !== 'string') return false;
  const expected = createHash('sha256').update(`Bearer ${internalToken}`).digest();
  const actual = createHash('sha256').update(header).digest();
  return timingSafeEqual(actual, expected);
}
function withinQuota() {
  const now=Date.now();
  // Single-process protection only; replace with centralized limiter before scaling.
  const bucket=hits.get('internal') || { start:now, count:0 };
  if (now-bucket.start >= windowMs) {bucket.start=now; bucket.count=0;}
  bucket.count++;
  hits.set('internal',bucket);
  return bucket.count<=capacity;
}
async function readJson(req) {
  let size=0;
  const chunks=[];
  for await (const chunk of req) {
    size += chunk.length;
    if (size>maxBytes) { const e=new Error('Payload too large');e.status=413;throw e; }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch {const e=new Error('Invalid JSON');e.status=400;throw e;}
}
export const server=createServer(async(req,res)=>{
  if(req.url==='/health' && req.method==='GET') return send(res,200,{ok:true,providerConfigured:Boolean(key&&model)});
  if(req.url!=='/v1/analyze' || req.method!=='POST') return send(res,404,{error:'Not found'});
  if (!authorized(req.headers.authorization)) return send(res,401,{error:'Unauthorized'});
  if (!withinQuota()) return send(res,429,{error:'Rate limited'});
  if (!key||!model) return send(res,503,{error:'Meta provider not configured'});
  try {
    const input=validateRequest(await readJson(req));
    const result=await fetch(endpoint,{
      method:'POST',
      headers:{'content-type':'application/json',authorization:`Bearer ${key}`},
      body:JSON.stringify({model,messages:createPrompt(input),temperature:0.1}),
      signal:AbortSignal.timeout(20_000)
    });
    if(!result.ok) return send(res,502,{error:'Model provider unavailable'});
    const response=await result.json();
    const content=response?.choices?.[0]?.message?.content;
    const normalized=normalizeModelResponse(content);
    return send(res,200,normalized);
  } catch(e) {
    if(e.status) return send(res,e.status,{error:e.message});
    if(/^(Invalid request|Text must|Language must)/.test(e.message)) return send(res,400,{error:'Invalid input'});
    return send(res,502,{error:'Analysis unavailable'});
  }
});
if (process.env.NODE_ENV!=='test') server.listen(port,()=>console.log(`BursYar engine listening on ${port}`));
