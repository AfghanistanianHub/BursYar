import {homedir} from 'node:os';
import {join,isAbsolute} from 'node:path';
import {lstatSync} from 'node:fs';
export function validateKeychainConfig(value){
 if(!value||value.version!==1||typeof value.metaApiKey!=='string'||!value.metaApiKey.trim()||value.metaApiKey.length>4096||/[\r\n]/.test(value.metaApiKey)||typeof value.metaModelId!=='string'||! /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(value.metaModelId)||typeof value.spendingConfirmed!=='boolean')throw Error('Invalid Keychain configuration');
 if(value.spendingConfirmed&&(!Number.isFinite(value.spendLimitUSD)||value.spendLimitUSD<=0||!Number.isFinite(Date.parse(value.confirmedAt))))throw Error('Invalid spending confirmation');
 return value;
}
export function existingPrivateFile(path){
 if(!isAbsolute(path))throw Error('Absolute private path required');
 const s=lstatSync(path);
 if(!s.isFile()||s.isSymbolicLink()||(s.mode&0o077)!==0||s.uid!==process.getuid())throw Error('Private file must be owned by this user, mode 600, without symlinks');
 return path;
}
export function rebootEnvironment(config,home=homedir()){
 validateKeychainConfig(config);
 return {
 FIREBASE_PROJECT_ID:'afghanistanian-scholarships',GOOGLE_APPLICATION_CREDENTIALS:join(home,'.bursyar-private/firebase-admin.json'),
 BURSYAR_QUOTA_DB:join(home,'.bursyar-private/quota.sqlite'),BURSYAR_ORIGIN:'http://localhost:5173',PORT:'8080',
 BURSYAR_USER_MINUTE:'2',BURSYAR_USER_DAY:'5',BURSYAR_GLOBAL_DAY:'20',BURSYAR_LIFETIME_UNITS:'200000',
 META_API_KEY:config.metaApiKey,META_MODEL_ID:config.metaModelId,META_TIMEOUT_MS:'20000',
 BURSYAR_SPENDING_CONFIRMED:config.spendingConfirmed?'1':'0',BURSYAR_SPEND_LIMIT_USD:config.spendingConfirmed?String(config.spendLimitUSD):'0',
 BURSYAR_SPENDING_CONFIRMED_AT:config.spendingConfirmed?config.confirmedAt:''
 };
}
// Classify only numeric OSStatus values; never surface raw stderr/captured output.
export class KeychainAccessError extends Error {
 constructor(stderr='',exitCode){
  const status=typeof stderr==='string'?stderr.match(/operation unavailable \((-?\d+)\)/)?.[1]:undefined;
  const message=exitCode===44?'BursYar Keychain entry was not found. Run npm run setup:mac in your logged-in Terminal.':status==='-67674'?'macOS Keychain service is unavailable to this process (OSStatus -67674). Run start-bursyar.command in your normal logged-in Terminal; do not re-enter the saved credential.':status==='-25308'?'macOS Keychain is locked or interaction is unavailable. Run startup in your logged-in Terminal and approve the macOS prompt.':status==='-25293'?'macOS denied Keychain authentication. Run startup in your logged-in Terminal and approve access.':'BursYar Keychain could not be read. Run startup in your logged-in Terminal; a missing credential has not been established.';
  super(message);this.name='KeychainAccessError';
 }
}
