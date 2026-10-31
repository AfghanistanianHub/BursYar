// Manual, non-inference verification only. Never included in npm test or CI.
import {request} from 'node:https';
import {writeFileSync} from 'node:fs';
import {createSourceFetcher,createSourceTransport} from '../../engine/source-fetch.js';
if(process.argv[2]!=='--live')throw Error('Use --live only for an explicitly authorized unpaid public-page check.');
const urls=[
 'https://www.law.ox.ac.uk/admissions/scholarships-index/other-sources-funding-index/clarendon-scholarships',
 'https://www.english.ox.ac.uk/funding-scholarships',
 'https://www.humanities.ox.ac.uk/node/62406',
 'https://www.bristol.ac.uk/students/support/finances/scholarships/think-big-scholarships/'
];
const records=[];
for(const url of urls){const responses=[];
 const transport=createSourceTransport((u,options,cb)=>request(u,options,res=>{responses.push({url:u.href,status:res.statusCode,challenge:res.headers['cf-mitigated']==='challenge'});cb(res);}));
 const sources=createSourceFetcher({transport});
 try{const source=await sources.fetchSource(url,{uid:'manual-unpaid-public-source-check'});const {signature,owner,...provenance}=source.receipt;records.push({url,verification:'LIVE_UNPAID_SERVER_RETRIEVAL',responses,success:true,characters:source.text.length,provenance});}
 catch(error){records.push({url,verification:'LIVE_UNPAID_SERVER_RETRIEVAL',responses,success:false,code:error.code??'unavailable'});}
}
writeFileSync(new URL('./live-success-ledger.json',import.meta.url),JSON.stringify(records,null,2)+'\n');console.log(JSON.stringify(records.map(({url,success,characters,responses})=>({url,success,characters,responses})),null,2));
