import {open,constants} from 'node:fs/promises';
import {isAbsolute} from 'node:path';
// Private local administrative files only; never a user upload or public asset.
export async function readPrivateJson(path){
 if(!isAbsolute(path))throw Error('Absolute private configuration path required');
 const handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const stat=await handle.stat();if(!stat.isFile()||stat.uid!==process.getuid()||(stat.mode&0o077)||stat.size>1024*1024)throw Error('Private configuration required');return JSON.parse(await handle.readFile('utf8'));}finally{await handle.close();}
}
