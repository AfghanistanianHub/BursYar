import {listenHost} from './listen-config.js';
import {defaultCatalog} from './default-catalog.js';
import {createDocumentStorage} from './document-storage.js';
import {isSpendingConfirmed} from './spending.js';
import {createFirebaseVerifier} from './auth.js';
import {createQuotaStorage} from './remote-quota.js';
import {createProvider} from './providers.js';
import {createTrustedPolicyResolver} from './trusted-policy.js';
import {createScholarshipCatalog} from './deterministic.js';
import {readPrivateJson,readPrivateSetting} from './private-config.js';
import {describeCapabilities,resolveBuildCommit} from './capabilities.js';
import {createInferenceServer} from './http.js';
const env=process.env;
const port=Number(env.PORT||8080);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid PORT');
if(!env.BURSYAR_ORIGIN||!['http:','https:'].includes(new URL(env.BURSYAR_ORIGIN).protocol)||new URL(env.BURSYAR_ORIGIN).origin!==env.BURSYAR_ORIGIN)throw Error('Exact BURSYAR_ORIGIN required');
const integer=name=>{const n=Number(env[name]);if(!Number.isSafeInteger(n)||n<1)throw Error(`Positive ${name} required`);return n;};
// No file => deterministic-only startup; credentials alone never enable a provider.
const config=(await readPrivateSetting(env,'BURSYAR_PROVIDER_CONFIG','BURSYAR_PROVIDER_JSON'))??{};
if(!config||typeof config!=='object'||Array.isArray(config))throw Error('Provider configuration object required');
const providers={},quotas=[];
for(const provider of ['meta','gemini','self_hosted']){
 const p=config[provider]??{};
 // Family service is a separate product boundary. Meta/Gemini are disabled in
 // any deployment that provisions guardian grants, irrespective of caller age.
 const enabled=p.enabled===true&&(!env.BURSYAR_FAMILY_GRANTS||provider==='self_hosted');
 const adapter=createProvider({...p,provider,enabled,key:provider==='meta'?env.META_API_KEY:provider==='gemini'?env.GEMINI_API_KEY:env.QWEN_API_KEY,model:p.model??(provider==='meta'?'muse-spark-1.3':undefined)});
 if(adapter.available){
  if(p.costReviewed!==true||!(p.worstCaseUsdPerUnit>0)||!Number.isFinite(p.worstCaseUsdPerUnit)||!(p.spendLimitUSD>0)||!Number.isFinite(p.spendLimitUSD))throw Error('Reviewed provider spending bound required');
  const lifetimeUnits=Math.min(integer('BURSYAR_LIFETIME_UNITS'),Math.floor(p.spendLimitUSD/p.worstCaseUsdPerUnit));
  if(!Number.isSafeInteger(lifetimeUnits)||lifetimeUnits<1)throw Error('Invalid provider spending bound');
  const quota=await createQuotaStorage(env,{provider,limits:{userMinute:integer('BURSYAR_USER_MINUTE'),userDay:integer('BURSYAR_USER_DAY'),globalDay:integer('BURSYAR_GLOBAL_DAY'),lifetimeUnits}});quotas.push(quota);providers[provider]=Object.freeze({...adapter,quota});
 }else providers[provider]=adapter;
}
const policyContextForRequest=createTrustedPolicyResolver({providers:config,loadRecord:async uid=>{
 const records=await readPrivateSetting(env,'BURSYAR_POLICY_RECORDS','BURSYAR_POLICY_RECORDS_JSON');
 if(!Array.isArray(records))throw Error('Trusted evidence unavailable');
 return records.find(r=>r.uid===uid&&r.subjectId===uid);
}});
const catalog=env.BURSYAR_REVIEWED_CATALOG?createScholarshipCatalog(await readPrivateJson(env.BURSYAR_REVIEWED_CATALOG)):createScholarshipCatalog(defaultCatalog);
const loadFamilyGrant=env.BURSYAR_FAMILY_GRANTS?async(uid,subjectId)=>(await readPrivateJson(env.BURSYAR_FAMILY_GRANTS)).find(r=>r.guardianUid===uid&&r.subjectId===subjectId):null;
const documents=await createDocumentStorage(env);
const verify=createFirebaseVerifier({projectId:env.FIREBASE_PROJECT_ID,webApiKey:env.FIREBASE_WEB_API_KEY?.trim()||undefined});
const buildCommit=resolveBuildCommit(env);
const capabilities=describeCapabilities({build:{commit:buildCommit},providerConfigPresent:!!(env.BURSYAR_PROVIDER_CONFIG||env.BURSYAR_PROVIDER_JSON),providerEnabled:config.meta?.enabled===true,familyGrantsPresent:!!env.BURSYAR_FAMILY_GRANTS,metaAvailable:providers.meta?.available===true,spendingConfirmed:isSpendingConfirmed(env),spendingApproved:config.meta?.spendingApproved===true,policyRecordsConfigured:!!(env.BURSYAR_POLICY_RECORDS||env.BURSYAR_POLICY_RECORDS_JSON),documentsAvailable:!!documents,catalogAvailable:!!catalog});
const server=createInferenceServer({documents,verify,projectId:env.FIREBASE_PROJECT_ID,quota:{reserve(){throw Error('Provider unavailable');}},providers,catalog,loadFamilyGrant,origin:env.BURSYAR_ORIGIN,canInfer:provider=>isSpendingConfirmed(env)&&config[provider]?.spendingApproved===true,policyContextForRequest,capabilities});
server.listen(port,listenHost(env));
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{server.close(()=>{for(const quota of quotas)quota.close();documents?.close();process.exit(0);});server.closeIdleConnections();});
