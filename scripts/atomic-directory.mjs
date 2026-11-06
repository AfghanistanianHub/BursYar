import {mkdirSync,renameSync,rmSync,existsSync,readFileSync,writeFileSync,readdirSync,lstatSync,readlinkSync,openSync,fsyncSync,closeSync,unlinkSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {hostname} from 'node:os';
import {join,dirname,basename,resolve} from 'node:path';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const optionalRead=path=>{try{return readFileSync(path,'utf8').trim();}catch{return null;}};
const processStart=pid=>{const stat=optionalRead('/proc/'+pid+'/stat');return stat?stat.slice(stat.lastIndexOf(')')+2).split(' ')[19]:null;};
export function currentProcessOwner(){
 let namespace=null;try{namespace=readlinkSync('/proc/self/ns/pid');}catch{}
 let procIdsMatch=false;try{procIdsMatch=readlinkSync('/proc/self')===String(process.pid);}catch{}
 return {pid:process.pid,host:hostname(),platform:process.platform,boot:optionalRead('/proc/sys/kernel/random/boot_id'),namespace,start:processStart('self'),procIdsMatch};
}
function isDead(owner,current){
 if(!owner||!Number.isInteger(owner.pid)||owner.pid<1||typeof owner.host!=='string'||typeof owner.platform!=='string')throw Error('OCR preparation busy: invalid owner identity');
 if(owner.host!==current.host||owner.platform!==current.platform)return false;
 if(current.platform==='linux'){
  if(!owner.boot||!owner.namespace||!current.boot||!current.namespace)return false;
  if(owner.boot!==current.boot)return true;
  if(owner.namespace!==current.namespace)return false;
 }
 try{process.kill(owner.pid,0);}catch(error){return error.code==='ESRCH';}
 if(current.platform==='linux'&&current.procIdsMatch&&owner.start){const start=processStart(owner.pid);return start!==null&&start!==owner.start;}
 return false; // Live/unknown identities are never expired by elapsed time.
}
function atomicJson(path,value){
 const temp=path+'.'+randomUUID()+'.tmp';let fd;
 try{fd=openSync(temp,'wx');writeFileSync(fd,JSON.stringify(value));fsyncSync(fd);closeSync(fd);fd=undefined;renameSync(temp,path);}
 finally{if(fd!==undefined)closeSync(fd);rmSync(temp,{force:true});}
}
export function withDirectoryLock(lock,operation,{timeoutMs=5000}={}){
 if(!Number.isInteger(timeoutMs)||timeoutMs<0||timeoutMs>10000)throw Error('Invalid preparation lock timeout');
 mkdirSync(lock,{recursive:true});if(!lstatSync(lock).isDirectory()||lstatSync(lock).isSymbolicLink())throw Error('Unsafe OCR coordination directory');
 const owner=currentProcessOwner(),id=randomUUID(),path=join(lock,id+'.json'),started=performance.now();
 const tickets=()=>{
  const entries=readdirSync(lock);if(entries.length>1000)throw Error('OCR preparation busy: excessive coordination entries');
  const result=[];
  for(const name of entries){
   if(name.endsWith('.tmp'))continue; // A not-yet-published record cannot own a lock.
   const otherId=name.slice(0,-5);if(!name.endsWith('.json')||!uuid.test(otherId))throw Error('OCR preparation busy: unfamiliar coordination entry');
   const p=join(lock,name);let row;
   try{const stat=lstatSync(p);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096)throw Error('Invalid ticket');row=JSON.parse(readFileSync(p,'utf8'));}catch(error){if(error.code==='ENOENT')continue;throw Error('OCR preparation busy: invalid ticket');}
   if(row.schema!==1||row.id!==otherId||typeof row.choosing!=='boolean'||!Number.isSafeInteger(row.number)||row.number<0||row.number>1e9||(row.choosing?row.number!==0:row.number<1))throw Error('OCR preparation busy: invalid ticket');
   if(isDead(row.owner,owner)){try{unlinkSync(p);}catch(error){if(error.code!=='ENOENT')throw error;}continue;}
   result.push(row);
  }
  return result;
 };
 // Unique identity paths prevent a dead owner's cleanup from deleting a successor.
 try{
  atomicJson(path,{schema:1,id,owner,choosing:true,number:0});
  const number=1+Math.max(0,...tickets().map(row=>row.number));
  atomicJson(path,{schema:1,id,owner,choosing:false,number});
  for(;;){
   const blocked=tickets().some(row=>row.id!==id&&(row.choosing||row.number<number||(row.number===number&&row.id<id)));
   if(!blocked)return operation();
   if(performance.now()-started>=timeoutMs)throw Error('OCR preparation busy: live or unverifiable owner');
   Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,Math.min(25,timeoutMs));
  }
 }finally{rmSync(path,{force:true});}
}
const safeName=name=>typeof name==='string'&&/^[a-zA-Z0-9._-]{1,150}$/.test(name)&&name!=='.'&&name!=='..';
function directory(path){if(!existsSync(path))return false;const s=lstatSync(path);if(!s.isDirectory()||s.isSymbolicLink())throw Error('Unsafe OCR publication path');return true;}
export function recoverPublication(target){
 const journal=target+'.publication.json';if(!existsSync(journal))return;
 const stat=lstatSync(journal);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096)throw Error('Unsafe OCR publication journal');
 let row;try{row=JSON.parse(readFileSync(journal,'utf8'));}catch{throw Error('Invalid OCR publication journal');}
 const prefix=basename(target)+'.previous-';
 if(row.schema!==1||row.target!==basename(target)||!/^\.ocr-stage-[a-zA-Z0-9_-]{1,100}$/.test(row.stage)||!row.backup?.startsWith(prefix)||!uuid.test(row.backup.slice(prefix.length))||row.stage===row.target||row.stage===row.backup)throw Error('Invalid OCR publication journal');
 const parent=dirname(target),stage=join(parent,row.stage),backup=join(parent,row.backup);
 const t=directory(target),s=directory(stage),b=directory(backup);
 if(!t&&b){renameSync(backup,target);if(s)rmSync(stage,{recursive:true});}
 else if(t&&b&&!s)rmSync(backup,{recursive:true});
 else if(t&&!b){if(s)rmSync(stage,{recursive:true});}
 else if(!t&&!b&&s)renameSync(stage,target);
 else throw Error('Ambiguous OCR publication; preserved for recovery');
 rmSync(journal);
}
export function publishDirectory(stage,target){
 stage=resolve(stage);target=resolve(target);
 if(dirname(stage)!==dirname(target)||stage===target||!/^\.ocr-stage-[a-zA-Z0-9_-]{1,100}$/.test(basename(stage))||!safeName(basename(target)))throw Error('Invalid OCR publication paths');
 recoverPublication(target);
 if(!directory(stage))throw Error('Missing staged OCR generation');
 const backup=target+'.previous-'+randomUUID(),journal=target+'.publication.json';
 atomicJson(journal,{schema:1,target:basename(target),stage:basename(stage),backup:basename(backup)});
 try{
  if(directory(target))renameSync(target,backup);
  renameSync(stage,target);
  if(directory(backup))rmSync(backup,{recursive:true});
  rmSync(journal);
 }catch(error){
  try{recoverPublication(target);}catch(restore){throw new AggregateError([error,restore],'OCR publication preserved for recovery at '+journal);}
  throw error;
 }
}
