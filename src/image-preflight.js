// Bounds declared image canvases BEFORE a native decoder allocates them.
// This is not a complete image validator or a decoder sandbox. In particular,
// compressed-data integrity and hard worker/memory isolation remain release gates.
const fail=code=>{throw Object.assign(new Error(code),{code});};
const dimensions=(width,height)=>{
 if(!width||!height||width>4500||height>4500||width*height>12000000)fail('imageDimensions');
 return {width,height};
};
const u16=(b,i)=>b[i]*256+b[i+1];
const u32=(b,i)=>b[i]*0x1000000+b[i+1]*65536+b[i+2]*256+b[i+3];
function png(b){
 if(b.length<33||[137,80,78,71,13,10,26,10].some((n,i)=>b[i]!==n)||u32(b,8)!==13||String.fromCharCode(...b.subarray(12,16))!=='IHDR')fail('invalidImage');
 const size=dimensions(u32(b,16),u32(b,20));
 const depth=b[24],color=b[25],channels={0:1,2:3,3:1,4:2,6:4}[color];
 const depths=color===0?[1,2,4,8,16]:color===3?[1,2,4,8]:[8,16];
 if(!channels||!depths.includes(depth)||b[26]!==0||b[27]!==0||![0,1].includes(b[28]))fail('invalidImage');
 // Bound inflated samples plus conservative Adam7 filter/alignment overhead.
 if(Math.ceil(size.width*size.height*channels*depth/8)+14*size.height>48*1024*1024)fail('imageDimensions');
 let offset=8,count=0,idat=false;
 while(offset+12<=b.length){
  if(++count>10000)fail('invalidImage');
  const length=u32(b,offset),end=offset+12+length;
  if(end>b.length)fail('invalidImage');
  const kind=String.fromCharCode(...b.subarray(offset+4,offset+8));
  if(!/^[A-Za-z]{4}$/.test(kind)||['acTL','fcTL','fdAT','iCCP','zTXt','iTXt'].includes(kind)||(kind==='IHDR'&&offset!==8))fail('invalidImage');
  if(kind==='IDAT')idat=true;
  if(kind==='IEND'){
   if(length!==0||end!==b.length||!idat)fail('invalidImage');
   return size;
  }
  offset=end;
 }
 fail('invalidImage');
}
function jpeg(b){
 if(b.length<4||b[0]!==255||b[1]!==216)fail('invalidImage');
 let offset=2,size=null,inScan=false,sawScan=false,count=0;
 while(offset<b.length){
  if(inScan){
   while(offset<b.length&&b[offset]!==255)offset++;
   if(offset>=b.length)fail('invalidImage');
   let next=offset+1;while(next<b.length&&b[next]===255)next++;
   if(next>=b.length)fail('invalidImage');
   if(b[next]===0||(b[next]>=0xd0&&b[next]<=0xd7)){offset=next+1;continue;}
   inScan=false;
  }
  if(++count>10000||b[offset++]!==255)fail('invalidImage');
  while(offset<b.length&&b[offset]===255)offset++;
  if(offset>=b.length)fail('invalidImage');
  const marker=b[offset++];
  if(marker===0xd9){if(!size||!sawScan||offset!==b.length)fail('invalidImage');return size;}
  // DNL can change scan-line counts after SOF. Hierarchical/differential,
  // arithmetic/lossless and additional frames are deliberately unsupported.
  if(marker===0||marker===1||marker===0xd8||(marker>=0xd0&&marker<=0xd7)||[0xc3,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xcb,0xcc,0xcd,0xce,0xcf,0xdc,0xde,0xdf].includes(marker))fail('invalidImage');
  if(offset+2>b.length)fail('invalidImage');
  const length=u16(b,offset),end=offset+length;
  if(length<2||end>b.length)fail('invalidImage');
  if([0xc0,0xc1,0xc2].includes(marker)){
   if(size||length<11||b[offset+2]!==8||b[offset+7]<1||b[offset+7]>4||length!==8+3*b[offset+7])fail('invalidImage');
   size=dimensions(u16(b,offset+5),u16(b,offset+3));
  }
  if(marker===0xda){
   if(!size||length<8||b[offset+2]<1||b[offset+2]>4||length!==6+2*b[offset+2])fail('invalidImage');
   inScan=true;sawScan=true;
  }
  offset=end;
 }
 fail('invalidImage');
}
export function inspectImageDimensions(bytes,mime){
 if(!(bytes instanceof Uint8Array)||bytes.length>5*1024*1024)fail('invalidImage');
 if(mime==='image/png')return png(bytes);
 if(mime==='image/jpeg')return jpeg(bytes);
 fail('invalidImage');
}
