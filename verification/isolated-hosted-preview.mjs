import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {preview} from 'vite';
import {createFirebaseVerifier} from '../engine/auth.js';
import {describeCapabilities} from '../engine/capabilities.js';
import {createScholarshipCatalog} from '../engine/deterministic.js';
import {defaultCatalog} from '../engine/default-catalog.js';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';
import {listenHost} from '../engine/listen-config.js';

const {FIREBASE_PROJECT_ID:projectId, FIREBASE_WEB_API_KEY:webApiKey} = process.env;
const origin = new URL(process.env.BURSYAR_ORIGIN);
const port = Number(process.env.PORT ?? 8080);
if (origin.origin !== process.env.BURSYAR_ORIGIN || origin.protocol !== 'https:' ||
    !Number.isInteger(port) || port < 1 || port > 65535 || !webApiKey) {
 throw Error('Expected an exact HTTPS preview origin, valid PORT and Firebase web configuration');
}
const verify = createFirebaseVerifier({projectId,webApiKey});
const csp = JSON.parse(readFileSync('vercel.json','utf8')).headers
 .flatMap(route=>route.headers).find(header=>header.key==='Content-Security-Policy').value;
const directory = mkdtempSync(join(tmpdir(),'bursyar-hosted-preview-'));
const documents = new DocumentStore(join(directory,'preview.db'));
const api = createInferenceServer({
 verify,projectId,origin:origin.origin,documents,providers:{},
 catalog:createScholarshipCatalog(defaultCatalog),
 capabilities:describeCapabilities({documentsAvailable:true,catalogAvailable:true}),
 quota:{reserve(){throw Error('Inference disabled in preview');}}
});
let site;
async function close(){
 if(site) await new Promise(resolve=>site.httpServer.close(resolve));
 if(api.listening) await new Promise(resolve=>api.close(resolve));
 documents.close();
 rmSync(directory,{recursive:true,force:true});
}
try {
 await new Promise((resolve,reject)=>api.once('error',reject).listen(0,'127.0.0.1',resolve));
 const target = 'http://127.0.0.1:'+api.address().port;
 site = await preview({
  configFile:false,
  preview:{host:listenHost(),port,strictPort:true,
   headers:{'Content-Security-Policy':csp,'Cache-Control':'no-store'},
   proxy:{'/api':target,'/health':target}}
 });
 console.log('Isolated preview ready. Records are temporary. Inference is disabled.');
 for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>close());
} catch(error) {
 await close();
 throw error;
}
