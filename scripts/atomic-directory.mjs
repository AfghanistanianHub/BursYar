import {mkdirSync,renameSync,rmSync,existsSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
export function withDirectoryLock(lock,operation,{timeoutMs=5000}={}){
 if(!Number.isInteger(timeoutMs)||timeoutMs<0||timeoutMs>10000)throw Error('Invalid preparation lock timeout');
 const started=performance.now();
 for(;;){
  try{mkdirSync(lock);break;}catch(error){
   if(error.code!=='EEXIST')throw error;
   if(performance.now()-started>=timeoutMs)throw Error('OCR preparation busy or unfinished lock; no output changed: '+lock);
   Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,Math.min(25,timeoutMs));
  }
 }
 try{return operation();}finally{rmSync(lock,{recursive:true});}
}
export function publishDirectory(stage,target){
 const backup=target+'.previous-'+randomUUID();let backedUp=false,published=false;
 try{
  if(existsSync(target)){renameSync(target,backup);backedUp=true;}
  renameSync(stage,target);published=true;
 }catch(error){
  if(backedUp){try{renameSync(backup,target);}catch(restore){throw new AggregateError([error,restore],'OCR output preserved for recovery at '+backup);}}
  throw error;
 }finally{if(published&&backedUp)rmSync(backup,{recursive:true});}
}
