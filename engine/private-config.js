import {open,constants} from 'node:fs/promises';
import {isAbsolute} from 'node:path';
// Private local administrative files only; never a user upload or public asset.
export async function readPrivateJson(path){
 if(!isAbsolute(path))throw Error('Absolute private configuration path required');
 const handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const stat=await handle.stat();if(!stat.isFile()||stat.uid!==process.getuid()||(stat.mode&0o077)||stat.size>1024*1024)throw Error('Private configuration required');return JSON.parse(await handle.readFile('utf8'));}finally{await handle.close();}
}
// Hosted secret-environment equivalent. File mode checks remain unchanged for files.
export async function readPrivateSetting(env,fileName,jsonName){
 const file=env[fileName],source=env[jsonName];
 if(file&&source)throw Error('Conflicting private configuration sources');
 if(file)return readPrivateJson(file);
 if(!source)return undefined;
 if(typeof source!=='string'||Buffer.byteLength(source)>1024*1024)throw Error('Invalid private JSON configuration');
 try{return JSON.parse(source);}catch{throw Error('Invalid private JSON configuration');}
}
