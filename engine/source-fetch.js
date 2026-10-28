import {lookup} from 'node:dns/promises';
import {request} from 'node:https';
import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import ipaddr from 'ipaddr.js';
import {parse} from 'parse5';
export class SourceFailure extends Error {constructor(code){super('Source unavailable');this.code=code;}}
const fail=code=>{throw new SourceFailure(code);};
export function sourceURL(value){
 let u;try{u=new URL(value);}catch{fail('invalid_url');}
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.href.length>2048||u.hostname.endsWith('.')||u.hostname.includes('%'))fail('blocked_url');
 u.hash='';return u;
}
export function publicAddress(value){try{const ip=ipaddr.process(value);return ip.range()==='unicast';}catch{return false;}}
export async function resolvePublic(host,resolve=lookup){
 const addresses=await resolve(host,{all:true,verbatim:true});
 if(!addresses.length||addresses.some(a=>!publicAddress(a.address)))fail('blocked_address');
 return addresses[0];
}
export function extractArticle(html,url){
 if(/<title[^>]*>\s*Just a moment/i.test(html)&&/cf-chl-|cdn-cgi\/challenge-platform/i.test(html))fail('challenge');
 const root=parse(html),blocked=new Set(['script','style','noscript','template','nav','header','footer','aside','form','svg','iframe','object','embed','meta','link','base','button']);
 const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
 const ignored=n=>blocked.has(n.tagName)||attr(n,'hidden')!==undefined||attr(n,'aria-hidden')==='true'||/display\s*:\s*none|visibility\s*:\s*hidden/i.test(attr(n,'style')??'');
 const candidates=[];function find(n){if(ignored(n))return;if(n.tagName==='main'||n.tagName==='article'||attr(n,'role')==='main')candidates.push(n);for(const c of n.childNodes??[])find(c);}find(root);
 // Prefer the main page region; absent semantic landmarks, use body with chrome removed.
 const chosen=candidates.find(n=>n.tagName==='main'||attr(n,'role')==='main')??candidates[0];
 function body(n){if(n.tagName==='body')return n;for(const c of n.childNodes??[]){const b=body(c);if(b)return b;}}
 const scope=chosen??body(root)??root,links=[];
 const boundaries=new Set(['p','div','section','article','main','li','h1','h2','h3','h4','tr','br']);
 function read(n){if(ignored(n))return '';if(n.nodeName==='#text')return n.value;if(n.tagName==='a'){try{const u=sourceURL(new URL(attr(n,'href'),url).href);if(u.origin===new URL(url).origin&&!links.includes(u.href)&&links.length<20)links.push(u.href);}catch{}}
 const value=(n.childNodes??[]).map(read).join('');return boundaries.has(n.tagName)?`\n${value}\n`:value;}
 const text=read(scope).split('\n').map(s=>s.replace(/\s+/gu,' ').trim()).filter(Boolean).join('\n');
 if(text.length<30)fail('empty_content');if(text.length>12000)fail('content_too_large');
 return {text,links,extraction:chosen?'semantic_article':'body_without_navigation'};
}
export function createSourceTransport(requestImpl=request){return (url,address,signal)=>new Promise((resolve,reject)=>{
 const req=requestImpl(url,{method:'GET',agent:false,autoSelectFamily:false,signal,lookup:(_host,_options,cb)=>cb(null,address.address,address.family),headers:{accept:'text/html, text/plain;q=0.8','accept-encoding':'identity','user-agent':'BursYar-SourcePreview/1.0'}},res=>{
  if(!publicAddress(res.socket.remoteAddress)||ipaddr.process(res.socket.remoteAddress).toString()!==ipaddr.process(address.address).toString()){res.destroy();return reject(new SourceFailure('connection_denied'));}
  if([301,302,303,307,308].includes(res.statusCode)){res.destroy();return resolve({redirect:res.headers.location});}
  if(res.headers['cf-mitigated']==='challenge'||res.statusCode!==200){res.destroy();return reject(new SourceFailure(res.headers['cf-mitigated']==='challenge'?'challenge':'inaccessible'));}
  if(res.headers['content-encoding']&&res.headers['content-encoding']!=='identity'){res.destroy();return reject(new SourceFailure('unsupported_encoding'));}
  const type=res.headers['content-type']??'';if(!/^(text\/html|text\/plain)(?:;|$)/i.test(type)||(/charset=/i.test(type)&&!/charset=["']?utf-8\b/i.test(type))){res.destroy();return reject(new SourceFailure('unsupported_content'));}
  let size=0;const chunks=[];res.on('data',chunk=>{size+=chunk.length;if(size>512*1024)res.destroy(new SourceFailure('response_too_large'));else chunks.push(chunk);});
  res.on('error',reject);res.on('end',()=>{try{const bytes=Buffer.concat(chunks);resolve({rawDigest:createHash('sha256').update(bytes).digest('hex'),body:new TextDecoder('utf-8',{fatal:true}).decode(bytes),plain:/^text\/plain/i.test(type)});}catch{reject(new SourceFailure('unsupported_encoding'));}});
 });req.on('error',reject);req.end();
});}
const retrieve=createSourceTransport();
export function createSourceFetcher({resolve=lookup,transport=retrieve,now=()=>Date.now(),timeoutMs=12000}={}){
 const key=randomBytes(32),rate=new Map();let active=0;
 const sign=r=>createHmac('sha256',key).update(JSON.stringify(r)).digest('hex');
 const owner=uid=>createHmac('sha256',key).update(String(uid??'')).digest('hex');
 function verify(receipt,text,url,uid){
  if(!receipt||typeof receipt.signature!=='string')fail('invalid_receipt');
  const {signature,...record}=receipt;const expected=sign(record);
  if(signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected))||record.owner!==owner(uid)||record.sourceUrl!==url||record.digest!==createHash('sha256').update(text).digest('hex')||now()-Date.parse(record.retrievedAt??record.suppliedAt)>30*60*1000)fail('invalid_receipt');
  const {owner:binding,...provenance}=record;return provenance;
 }
 async function fetchSource(value,{signal,uid}={}){
  const current=now();for(const [id,r]of rate)if(current-r.start>=60000)rate.delete(id);
  const entry=rate.get(uid)??{start:current,count:0};if(entry.count>=5||active>=2||rate.size>=10000&&!rate.has(uid))fail('busy');entry.count++;rate.set(uid,entry);active++;
  const timeout=AbortSignal.timeout(timeoutMs),cancel=signal?AbortSignal.any([signal,timeout]):timeout;
  const abort=new Promise((_,reject)=>{if(cancel.aborted)reject(new SourceFailure('timeout'));else cancel.addEventListener('abort',()=>reject(new SourceFailure('timeout')),{once:true});});
  try{return await Promise.race([(async()=>{try{
   const original=sourceURL(value).href;let url=sourceURL(value);const visited=[];
   for(let hops=0;hops<=3;hops++){
    if(cancel.aborted)fail('timeout');visited.push(url.href);
    const address=await resolvePublic(url.hostname,resolve);if(cancel.aborted)fail('timeout');
    const response=await transport(url,address,cancel);
    if(response.redirect!==undefined){if(hops===3||!response.redirect)fail('redirect_limit');url=sourceURL(new URL(response.redirect,url).href);if(visited.includes(url.href))fail('redirect_loop');continue;}
    const extracted=response.plain?{text:response.body.trim(),links:[],extraction:'plain_text'}:extractArticle(response.body,url.href);
    if(extracted.text.length<30)fail('empty_content');if(extracted.text.length>12000)fail('content_too_large');
    const record={kind:'server_fetched',owner:owner(uid),rawDigest:response.rawDigest??createHash('sha256').update(response.body).digest('hex'),requestedUrl:original,sourceUrl:url.href,retrievedAt:new Date(now()).toISOString(),digest:createHash('sha256').update(extracted.text).digest('hex'),extraction:extracted.extraction,redirects:visited.slice(0,-1),trust:'public_web_unverified'};
    return {...extracted,receipt:{...record,signature:sign(record)}};
   }
  }finally{active--;}})(),abort]);}catch(error){if(error instanceof SourceFailure)throw error;throw new SourceFailure('inaccessible');}
 }
 function importSource(input,{uid}={}){
  const url=sourceURL(input?.url).href;
  if(!['html','text'].includes(input?.format)||typeof input.contentBase64!=='string'||input.contentBase64.length>349528||!input.contentBase64.length||!(/^[A-Za-z0-9+/]*={0,2}$/.test(input.contentBase64)&&input.contentBase64.length%4===0))fail('invalid_import');
  const bytes=Buffer.from(input.contentBase64,'base64');if(bytes.length>256*1024||bytes.toString('base64')!==input.contentBase64)fail('invalid_import');
  let content;try{content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('unsupported_encoding');}
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(content))fail('invalid_import');
  const extracted=input.format==='html'?extractArticle(content,url):{text:content.trim(),links:[],extraction:'supplied_plain_text'};
  if(extracted.text.length<30)fail('empty_content');if(extracted.text.length>12000)fail('content_too_large');
  const record={kind:input.format==='html'?'user_supplied_html':'user_supplied_text',owner:owner(uid),sourceUrl:url,requestedUrl:url,retrievedAt:null,suppliedAt:new Date(now()).toISOString(),rawDigest:createHash('sha256').update(bytes).digest('hex'),digest:createHash('sha256').update(extracted.text).digest('hex'),extraction:extracted.extraction,redirects:[],trust:'user_supplied_unverified'};
  return {...extracted,receipt:{...record,signature:sign(record)}};
 }
 return {fetchSource,importSource,verify};
}
