// Reproducible same-origin assets, sourced only from exact lockfile packages.
// No network, package scripts, credentials or production-gate changes here.
import {readFileSync,lstatSync,realpathSync,mkdirSync,mkdtempSync,writeFileSync,renameSync,rmSync,existsSync} from 'node:fs';
import {resolve,dirname,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {sha256} from './prepare-ocr-vendor-candidate.mjs';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const ocrManifest=JSON.parse(readFileSync(join(repo,'data/ocr-assets.json'),'utf8'));
export function verifyOcrAssets({modules=join(repo,'node_modules')}={}){
 const packages=new Map();
 for(const p of ocrManifest.packages){
  const root=resolve(modules,p.name),metadata=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
  if(metadata.name!==p.name||metadata.version!==p.version)throw Error('OCR package version mismatch: '+p.name);
  packages.set(p.key,realpathSync(root));
 }
 const verified=[];
 for(const f of ocrManifest.files){
  const root=packages.get(f.package),path=resolve(root,f.source);
  if(!path.startsWith(root+sep)||!realpathSync(path).startsWith(root+sep)||!lstatSync(path).isFile())throw Error('unsafe OCR asset');
  if(lstatSync(path).size!==f.bytes||f.bytes>25*1024*1024)throw Error('OCR asset size mismatch: '+f.path);
  const bytes=readFileSync(path);
  if(sha256(bytes)!==f.sha256)throw Error('OCR asset integrity mismatch: '+f.path);
  if(f.uncompressedBytes){
   const raw=gunzipSync(bytes,{maxOutputLength:25*1024*1024});
   if(raw.length!==f.uncompressedBytes||sha256(raw)!==f.uncompressedSha256)throw Error('OCR model expansion mismatch: '+f.path);
  }
  verified.push({path:f.path,bytes});
 }
 return verified;
}
export function prepareLocalOcr(){
 const files=verifyOcrAssets(); // Never alter a previous candidate on failure.
 const parent=join(repo,'public/vendor'),target=join(parent,'ocr-v1');
 mkdirSync(parent,{recursive:true});
 const stage=mkdtempSync(join(parent,'.ocr-stage-'));
 try{
  for(const f of files){const dest=join(stage,f.path);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,f.bytes);}
  writeFileSync(join(stage,'asset-manifest.json'),JSON.stringify(ocrManifest,null,2)+'\n');
  if(existsSync(target))rmSync(target,{recursive:true});
  renameSync(stage,target);
 }finally{rmSync(stage,{recursive:true,force:true});}
 return {files:files.length,bytes:files.reduce((sum,f)=>sum+f.bytes.length,0),productionApproved:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(prepareLocalOcr()));
