// One-command, post-login startup. No secret values in argv, files, stdout or history.
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {readFileSync,writeFileSync,mkdirSync,existsSync,chmodSync,renameSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {existingPrivateFile,validateKeychainConfig,rebootEnvironment} from './macos-config.mjs';
const run=promisify(execFile),root=fileURLToPath(new URL('../',import.meta.url));
const mode=process.argv[2]||'start';
try{
 if(process.platform!=='darwin')throw Error('macOS required');
 if(!['start','setup','status','check'].includes(mode))throw Error('Use start, setup, status or check');
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
 }else if(mode==='status'){
  try{await run(helper,['status'],{timeout:10000});}catch{throw Error('Keychain entry missing or unavailable; no contents displayed.');}
  console.log('BursYar Keychain entry exists; contents not displayed.');
 }else{
  existingPrivateFile(join(dir,'firebase-admin.json'));existingPrivateFile(join(dir,'quota.sqlite'));
  let privateConfig;
  try{const {stdout}=await run(helper,['read'],{timeout:60000,maxBuffer:16384});privateConfig=validateKeychainConfig(JSON.parse(stdout));}catch{throw Error('Keychain entry missing, locked or not authorized. Run npm run setup:mac and complete the secure macOS dialog.');}
  const saved=rebootEnvironment(privateConfig);
  if(mode==='check'){
   console.log(JSON.stringify({credentialsPresent:true,quotaDatabaseExists:true,spendingConfirmed:privateConfig.spendingConfirmed,liveInferenceVerified:false}));
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
 const known=['Keychain entry missing or unavailable; no contents displayed.','macOS required','Use start, setup, status or check','Keychain entry missing, locked or not authorized. Run npm run setup:mac and complete the secure macOS dialog.'];
 console.error(known.includes(error.message)?error.message:'Secure startup unavailable. Verify private file ownership/permissions or macOS Keychain authorization; no credential details logged.');process.exitCode=1;
}
