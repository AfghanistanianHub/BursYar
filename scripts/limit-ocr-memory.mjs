// Derived, never in-place: tighten ONLY the reviewed core's single defined
// memory maximum (2 GiB -> 256 MiB). No executable instruction is changed.
export const OCR_MEMORY_PAGES=4096;
const notice='BursYar: Tesseract.js-core 5.1.1 modified; memory maximum reduced to 4096 pages (256 MiB); executable instructions unchanged.';
const invalid=()=>{throw Error('Unreviewed OCR WASM memory layout');};
const encode=n=>{const bytes=[];do{let b=n&127;n=Math.floor(n/128);bytes.push(b|(n?128:0));}while(n);return bytes;};
function read(bytes,state){
 const start=state.offset;let value=0;
 for(let i=0;i<5;i++){
  if(state.offset>=bytes.length)invalid();const b=bytes[state.offset++];
  if(i===4&&(b&240))invalid();value+=(b&127)*2**(7*i);
  if(!(b&128)){if(encode(value).length!==state.offset-start)invalid();return value;}
 }
 invalid();
}
export function limitCoreMemory(input){
 if(!(input instanceof Uint8Array)||input.length<8||input.length>25*1024*1024||[0,97,115,109,1,0,0,0].some((n,i)=>input[i]!==n))invalid();
 const module=new WebAssembly.Module(input);
 if(WebAssembly.Module.imports(module).some(i=>i.kind==='memory'))invalid();
 const state={offset:8};let replacement;
 while(state.offset<input.length){
  const start=state.offset,id=input[state.offset++],size=read(input,state),end=state.offset+size;
  if(end>input.length)invalid();
  if(id===5){
   if(replacement||read(input,state)!==1||read(input,state)!==1||read(input,state)!==256||read(input,state)!==32768||state.offset!==end)invalid();
   const payload=Uint8Array.from([1,1,...encode(256),...encode(OCR_MEMORY_PAGES)]);
   replacement={start,end,bytes:Uint8Array.from([5,...encode(payload.length),...payload])};
  }
  state.offset=end;
 }
 if(!replacement)invalid();
 const {start,end,bytes}=replacement,out=new Uint8Array(start+bytes.length+input.length-end);
 out.set(input.subarray(0,start));out.set(bytes,start);out.set(input.subarray(end),start+bytes.length);
 const name=new TextEncoder().encode('bursyar.memory-limit'),message=new TextEncoder().encode(notice);
 const payload=Uint8Array.from([...encode(name.length),...name,...message]);
 const suffix=Uint8Array.from([0,...encode(payload.length),...payload]),result=new Uint8Array(out.length+suffix.length);
 result.set(out);result.set(suffix,out.length);
 if(!WebAssembly.validate(result))invalid();
 return result;
}
export function limitEmbeddedCore(source,standalone){
 const text=new TextDecoder('utf-8',{fatal:true}).decode(source);
 const matches=[...text.matchAll(/data:application\/octet-stream;base64,([A-Za-z0-9+/=]+)/g)];
 if(matches.length!==1)invalid();
 const embedded=Buffer.from(matches[0][1],'base64');
 if(!Buffer.from(standalone).equals(embedded))invalid();
 const derived=limitCoreMemory(embedded);
 return new TextEncoder().encode('/* BursYar modification: '+notice+' */\n'+text.replace(matches[0][0],'data:application/octet-stream;base64,'+Buffer.from(derived).toString('base64')));
}
