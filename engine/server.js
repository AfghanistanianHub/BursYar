import { createServer } from "node:http";
import { validateRequest, createPrompt, normalizeModelResponse } from "./engine.js";
const port = Number(process.env.PORT || 8080);
const key = process.env.META_API_KEY;
const endpoint = process.env.META_MODEL_ENDPOINT;
const model = process.env.META_MODEL_ID;
const internalToken = process.env.BURSYAR_INTERNAL_TOKEN;
if (!internalToken || internalToken.length < 24) throw new Error("Set a strong BURSYAR_INTERNAL_TOKEN before starting");
if (endpoint && (!endpoint.startsWith("https://") || !key || !model)) throw new Error("Meta endpoint, key and model must be configured together");
const maxBody = 16 * 1024;
function send(res,status,obj){res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"});res.end(JSON.stringify(obj));}
createServer(async(req,res)=>{
  if(req.url==="/health"&&req.method==="GET") return send(res,200,{ok:true,providerConfigured:!!endpoint});
  if(req.url!=="/v1/analyze"||req.method!=="POST") return send(res,404,{error:"Not found"});
  if(req.headers.authorization!==`Bearer ${internalToken}`) return send(res,401,{error:"Unauthorized"});
  let body="";
  try {
    for await(const chunk of req){body+=chunk.toString();if(body.length>maxBody) return send(res,413,{error:"Request too large"});}
    const input=validateRequest(JSON.parse(body));
    if(!endpoint) return send(res,503,{error:"Meta model provider not configured yet; no fake output generated"});
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),20000);
    let response;
    try {
      response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({model,messages:createPrompt(input),temperature:0.1,response_format:{type:"json_object"}}),signal:controller.signal});
    } finally {clearTimeout(timer);}
    if(!response.ok) return send(res,502,{error:"Model provider unavailable"});
    const data=await response.json();
    const content=data?.choices?.[0]?.message?.content;
    return send(res,200,normalizeModelResponse(content));
  } catch(e){return send(res,e instanceof SyntaxError?400:e.message?.startsWith("Text ")||e.message?.startsWith("Language ")||e.message==="Invalid request"?400:502,{error:e.message==="Model returned invalid JSON"||e.message==="Model schema mismatch"?"Invalid model response":"Request could not be processed"});}
}).listen(port,()=>console.log(`BursYar AI engine listening on ${port}`));
