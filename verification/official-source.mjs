import {createHash} from 'node:crypto';
export const SOURCE_URL='https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants';
const decode=s=>s.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
export function extractOfficialSource(html){
 const paragraphs=[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>decode(m[1].replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim()).filter(p=>/Clarendon|scholar|deadline|academic record|academic potential/i.test(p));
 const text=paragraphs.join('\n\n');
 if(text.length<300||text.length>12000||!text.includes('Clarendon scholarships cover course fees in full.')||!text.includes('December or January'))throw Error('Official source changed; human review required');
 return {sourceUrl:SOURCE_URL,text,sourceDigest:createHash('sha256').update(text).digest('hex'),retrievedAt:new Date().toISOString(),reviewStatus:'unreviewed',expected:{deadline:'course-specific; do not invent a day/year',funding:'course fees; living grant is conditional on full/part-time study',documents:'no additional Clarendon scholarship documents; course requirements are separate'}};
}
export async function readOfficialSource(){
 const response=await fetch(SOURCE_URL,{redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw Error('Official source unavailable');
 const reader=response.body.getReader();let size=0;const chunks=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>2*1024*1024)throw Error('Official source too large');chunks.push(value);}}catch(e){await reader.cancel();throw e;}finally{reader.releaseLock();}
 return extractOfficialSource(Buffer.concat(chunks).toString('utf8'));
}
