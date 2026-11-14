// Reproducible same-origin assets, sourced only from exact lockfile packages.
// No network, package scripts, credentials or production-gate changes here.
import {readFileSync,lstatSync,realpathSync,mkdirSync,mkdtempSync,writeFileSync,rmSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {withDirectoryLock,publishDirectory,recoverPublication} from './atomic-directory.mjs';
import {limitCoreMemory,limitEmbeddedCore} from './limit-ocr-memory.mjs';
import {sha256} from './prepare-ocr-vendor-candidate.mjs';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const derivedManifest=JSON.parse(readFileSync(join(repo,'data/ocr-derived-assets.json'),'utf8'));
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
 // All upstream bytes are checked before deriving any modified artifact.
 const originals=new Map(verified.map(f=>[f.path,f.bytes]));
 return verified.map(f=>{
  if(!f.path.startsWith('core/'))return f;
  const bytes=f.path.endsWith('.wasm')?limitCoreMemory(f.bytes):limitEmbeddedCore(f.bytes,originals.get(f.path.slice(0,-3)));
  const expected=derivedManifest.files.find(x=>x.path===f.path);
  if(!expected||bytes.length!==expected.bytes||sha256(bytes)!==expected.sha256)throw Error('Derived OCR integrity mismatch');
  return {path:f.path,bytes};
 });
}
export function verifyModelProvenance(provenance,license){
 if(provenance?.selectedDistributionLicense!=='Apache-2.0'||provenance?.upstreamLicense!=='Apache-2.0'||sha256(license)!==provenance.licenseSha256)throw Error('OCR model license mismatch');
 if(!/^[a-f0-9]{40}$/.test(provenance.revision)||!Array.isArray(provenance.models)||provenance.models.length!==3)throw Error('OCR model provenance mismatch');
 for(const language of ['eng','fas','pus']){
  const rows=provenance.models.filter(m=>m.language===language),expected=ocrManifest.files.find(f=>f.path==='lang/'+language+'.traineddata.gz');
  if(rows.length!==1||rows[0].compressedSha256!==expected.sha256||rows[0].decompressedSha256!==expected.uncompressedSha256||rows[0].compressedMatchesNpm!==true||rows[0].decompressedMatchesNpm!==true||rows[0].url!==`https://raw.githubusercontent.com/naptha/tessdata/${provenance.revision}/4.0.0_best_int/${language}.traineddata.gz`)throw Error('OCR model provenance mismatch');
 }
 return true;
}
const nativeNoticeManifest=readFileSync(join(repo,'data/ocr-native-notices.json'));
export function verifyNativeNotices(directory=join(repo,'data/ocr-native-notices')){
 const {productionApproved,notices}=JSON.parse(nativeNoticeManifest);
 const names=new Set(notices.map(n=>n.file));
 if(productionApproved!==false||names.size!==notices.length||readdirSync(directory).length!==names.size)throw Error('OCR native notice inventory mismatch');
 return notices.map(({file,sha256:expected})=>{
  if(!/^[a-zA-Z0-9.-]+\.txt$/.test(file))throw Error('Unsafe OCR native notice path');
  const path=join(directory,file);
  if(!lstatSync(path).isFile())throw Error('Unsafe OCR native notice file: '+file);
  const bytes=readFileSync(path);
  if(sha256(bytes)!==expected)throw Error('OCR native notice checksum mismatch: '+file);
  return {path:'licenses/native/'+file,bytes};
 });
}
function outputMatches(target,files,manifestText){
 try{
  if(!lstatSync(target).isDirectory()||lstatSync(target).isSymbolicLink()||readFileSync(join(target,'asset-manifest.json'),'utf8')!==manifestText)return false;
  const expected=new Set(['asset-manifest.json',...files.map(f=>f.path)]);
  const walk=(dir,prefix='')=>{
   for(const entry of readdirSync(dir,{withFileTypes:true})){
    const name=prefix+entry.name;if(entry.isDirectory())walk(join(dir,entry.name),name+'/');
    else if(!entry.isFile()||!expected.delete(name))throw Error('unexpected generated asset');
   }
  };
  walk(target);
  return expected.size===0&&files.every(f=>sha256(readFileSync(join(target,f.path)))===sha256(f.bytes));
 }catch{return false;}
}
export function prepareLocalOcr(){
 const files=verifyOcrAssets(); // Never alter a previous candidate on failure.
 const provenanceBytes=readFileSync(join(repo,'data/ocr-model-provenance.json'));
 const inventoryBytes=readFileSync(join(repo,'data/ocr-license-inventory.json')),inventory=JSON.parse(inventoryBytes);
 if(inventory.productionApproved!==false||inventory.assets.length!==ocrManifest.files.length||new Set(inventory.assets.map(a=>a.path)).size!==ocrManifest.files.length||!ocrManifest.files.every(f=>inventory.assets.some(a=>a.path===f.path&&a.sourceSha256===f.sha256&&(a.kind!=='model'||a.selectedLicense==='Apache-2.0'))))throw Error('OCR asset license inventory mismatch');
 files.push({path:'LICENSE-INVENTORY.json',bytes:inventoryBytes},
  {path:'licenses/native/NOTICE-SOURCES.json',bytes:nativeNoticeManifest},...verifyNativeNotices());
 const provenance=JSON.parse(provenanceBytes),license=readFileSync(join(repo,'public/licenses/tessdata-LICENSE.txt'));
 verifyModelProvenance(provenance,license);
 files.push({path:'licenses/tessdata-LICENSE.txt',bytes:license},{path:'MODEL-PROVENANCE.json',bytes:provenanceBytes},{path:'CORE-MODIFICATIONS.txt',bytes:Buffer.from('BursYar modifies Tesseract.js-core 5.1.1: defined WASM memory maximum reduced from 2 GiB to 256 MiB, including embedded equivalents. Initial memory and executable instructions unchanged. Original/derived hashes are in asset-manifest.json. Production binary uploads remain disabled.\n')});
 const parent=join(repo,'public/vendor'),target=join(parent,'ocr-v1');
 mkdirSync(parent,{recursive:true});
 if(existsSync(join(repo,'.ocr-preparation.lock')))throw Error('Legacy OCR lock requires confirmed operator recovery');
 return withDirectoryLock(join(repo,'.ocr-preparation-tickets'),()=>{
 recoverPublication(target);
 const manifestText=JSON.stringify({upstream:ocrManifest,derived:derivedManifest,outputs:files.map(f=>({path:f.path,bytes:f.bytes.length,sha256:sha256(f.bytes)}))},null,2)+'\n';
 // Repeated initializations leave an intact matching generation in place.
 if(outputMatches(target,files,manifestText))return {files:files.length,bytes:files.reduce((sum,f)=>sum+f.bytes.length,0),productionApproved:false,reused:true};
 if(existsSync(target)&&(!lstatSync(target).isDirectory()||lstatSync(target).isSymbolicLink()||!existsSync(join(target,'asset-manifest.json'))))throw Error('Refusing to replace an unowned OCR output');
 const stage=mkdtempSync(join(parent,'.ocr-stage-'));
 try{
  for(const f of files){const dest=join(stage,f.path);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,f.bytes);}
  writeFileSync(join(stage,'asset-manifest.json'),manifestText);

  publishDirectory(stage,target);
 }finally{rmSync(stage,{recursive:true,force:true});}
 return {files:files.length,bytes:files.reduce((sum,f)=>sum+f.bytes.length,0),productionApproved:false};
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(prepareLocalOcr()));
