import {isSpendingConfirmed} from './spending.js';
import {createFirebaseVerifier} from './auth.js';
import {QuotaStore} from './quota.js';
import {createMetaInference} from './meta.js';
import {createInferenceServer} from './http.js';
const env=process.env;
// No public bind switch: deployment remains blocked until live security checks pass.
const port=Number(env.PORT||8080);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid PORT');
if(!env.BURSYAR_ORIGIN || !['http:','https:'].includes(new URL(env.BURSYAR_ORIGIN).protocol) || new URL(env.BURSYAR_ORIGIN).origin!==env.BURSYAR_ORIGIN)throw Error('Exact BURSYAR_ORIGIN required');
const integer=(name)=>{const n=Number(env[name]);if(!Number.isSafeInteger(n)||n<1)throw Error(`Positive ${name} required`);return n;};
const infer=createMetaInference({key:env.META_API_KEY||env.MODEL_API_KEY,model:env.META_MODEL_ID,timeoutMs:env.META_TIMEOUT_MS===undefined?20000:integer('META_TIMEOUT_MS')});
const verify=createFirebaseVerifier({projectId:env.FIREBASE_PROJECT_ID});
const quota=new QuotaStore(env.BURSYAR_QUOTA_DB,{userMinute:integer('BURSYAR_USER_MINUTE'),userDay:integer('BURSYAR_USER_DAY'),globalDay:integer('BURSYAR_GLOBAL_DAY'),lifetimeUnits:integer('BURSYAR_LIFETIME_UNITS')});
const server=createInferenceServer({verify,projectId:env.FIREBASE_PROJECT_ID,quota,infer,origin:env.BURSYAR_ORIGIN,canInfer:()=>isSpendingConfirmed(env)});
server.listen(port,'127.0.0.1');
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{server.close(()=>{quota.close();process.exit(0);});server.closeIdleConnections();});
