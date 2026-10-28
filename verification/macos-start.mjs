// One-command, post-login startup. No secret values in argv, files, stdout or history.
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {readFileSync,writeFileSync,mkdirSync,existsSync,chmodSync,renameSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {existingPrivateFile,validateKeychainConfig,rebootEnvironment,KeychainAccessError,parseSpendingLimit} from './macos-config.mjs';
const run=promisify(execFile),root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
const mode=args[0]==='--confirm-spending-usd'?'start':args[0]||'start';
const requestedLimit=args[0]==='--confirm-spending-usd'?args[1]:undefined;
try{
 if(process.platform!=='darwin')throw Error('macOS required');
 if(!['start','setup','status','check','diagnose'].includes(mode))throw Error('Use start, setup, status, diagnose or check');
 if(args[0]==='--confirm-spending-usd'&&(args.length!==2||parseSpendingLimit(requestedLimit)===null))throw Error('A positive USD limit is required for the explicit spending attestation');
 const dir=join(homedir(),'.bursyar-private'),bin=join(dir,'bin');mkdirSync(bin,{recursive:true,mode:0o700});
 const source=join(root,'verification/macos/BursYarKeychain.swift');
 const digest=createHash('sha256').update(readFileSync(source)).digest('hex');
 const helper=join(bin,'BursYarKeychain'),stamp=helper+'.sha256';
 if(!existsSync(helper)||!existsSync(stamp)||readFileSync(stamp,'utf8')!==digest){
  const cache=join(root,'verification/artifacts/swift-cache');mkdirSync(cache,{recursive:true});
  const temp=helper+'.building-'+process.pid;
  await run('/usr/bin/swiftc',['-module-cache-path',cache,source,'-o',temp],{cwd:root,maxBuffer:1024*1024,timeout:120000});
  await run('/usr/bin/codesign',['--force','--sign','-', '--identifier','ai.bursyar.keychain',temp],{timeout:15000});
  chmodSync(temp,0o700);renameSync(temp,helper);writeFileSync(stamp,digest,{mode:0o600});
 }
 if(mode==='setup'){
  const child=spawn(helper,['setup'],{stdio:'inherit'});child.once('error',()=>{console.error('Keychain dialog unavailable');process.exitCode=1;});child.once('exit',code=>{process.exitCode=code||0;});
 }else if(mode==='diagnose'){
  try{const {stdout}=await run(helper,['diagnose'],{timeout:60000,maxBuffer:16384});console.log(JSON.stringify(JSON.parse(stdout)));}catch(error){throw new KeychainAccessError(error.stderr,error.code);}
 }else if(mode==='status'){
  try{await run(helper,['status'],{timeout:10000});}catch(error){throw new KeychainAccessError(error.stderr,error.code);}
  console.log('BursYar Keychain entry exists; contents not displayed.');
 }else{
  existingPrivateFile(join(dir,'firebase-admin.json'));existingPrivateFile(join(dir,'quota.sqlite'));
  if(requestedLimit!==undefined){
   try{const {stdout}=await run(helper,['confirm-spending',String(parseSpendingLimit(requestedLimit))],{timeout:60000,maxBuffer:16384});console.log(JSON.stringify(JSON.parse(stdout)));}catch(error){throw new KeychainAccessError(error.stderr,error.code);}
  }
  let privateConfig;
  try{const {stdout}=await run(helper,['read'],{timeout:60000,maxBuffer:16384});privateConfig=validateKeychainConfig(JSON.parse(stdout));}catch(error){throw new KeychainAccessError(error.stderr,error.code);}
  const saved=rebootEnvironment(privateConfig,homedir(),{timeoutMs:process.env.META_TIMEOUT_MS});
  if(mode==='check'){
   console.log(JSON.stringify({credentialsPresent:true,quotaDatabaseExists:true,spendingConfirmed:privateConfig.spendingConfirmed,savedSpendingLimitUSD:privateConfig.spendLimitUSD,confirmationTimestampValid:Number.isFinite(Date.parse(privateConfig.confirmedAt)),backendSpendingConfirmed:saved.BURSYAR_SPENDING_CONFIRMED==='1',liveInferenceVerified:false}));
  }else{
   // Do not inherit stale provider/model/cap/emulator or secret frontend variables.
   const env={PATH:process.env.PATH,HOME:homedir(),LANG:process.env.LANG||'en_US.UTF-8',TMPDIR:process.env.TMPDIR,...saved};
   const child=spawn(process.execPath,['verification/start-demo.mjs'],{cwd:root,env,stdio:'inherit'});
   for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>child.kill(signal));
   child.once('error',()=>{console.error('Demo startup unavailable');process.exitCode=1;});child.once('exit',code=>{process.exitCode=code||0;});
  }
 }
}catch(error){
 // Only locally authored messages; execFile errors can contain captured secret stdout.
 const known=['Keychain entry missing or unavailable; no contents displayed.','macOS required','Use start, setup, status, diagnose or check','A positive USD limit is required for the explicit spending attestation','Keychain entry missing, locked or not authorized. Run npm run setup:mac and complete the secure macOS dialog.'];
 console.error(error instanceof KeychainAccessError||known.includes(error.message)?error.message:'Secure startup unavailable. Verify private file ownership/permissions or macOS Keychain authorization; no credential details logged.');process.exitCode=1;
}
