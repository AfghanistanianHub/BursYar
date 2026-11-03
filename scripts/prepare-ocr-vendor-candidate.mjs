#!/usr/bin/env node
// Candidate-only, offline-at-runtime OCR vendor assembly. This tool uses the
// npm registry at preparation time. Its output is NOT an approved release.
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,copyFileSync,statSync,lstatSync,rmSync,readdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const PACKAGES=Object.freeze([
 ['pdf','pdfjs-dist','4.10.38'],
 ['tesseract','tesseract.js','5.1.1'],
 ['core','tesseract.js-core','5.1.1'],
 ['eng','@tesseract.js-data/eng','1.0.0'],
 ['fas','@tesseract.js-data/fas','1.0.0'],
 ['pus','@tesseract.js-data/pus','1.0.0']
]);
export const FILES=Object.freeze([
 ['pdf','build/pdf.min.mjs','pdf/pdf.min.mjs'],
 ['pdf','build/pdf.worker.min.mjs','pdf/pdf.worker.min.mjs'],
 ['tesseract','dist/tesseract.esm.min.js','tesseract/tesseract.esm.min.js'],
 ['tesseract','dist/worker.min.js','tesseract/worker.min.js'],
 ...['tesseract-core','tesseract-core-simd','tesseract-core-lstm','tesseract-core-simd-lstm'].flatMap(n=>[
  ['core',n+'.wasm.js','core/'+n+'.wasm.js'],
  ['core',n+'.wasm','core/'+n+'.wasm']
 ]),
 ...['eng','fas','pus'].map(lang=>[lang,'4.0.0_best_int/'+lang+'.traineddata.gz','lang/'+lang+'.traineddata.gz'])
]);
export function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
export function inspectCandidate(root,manifest){
 if(manifest?.releaseApproved!==false||manifest?.purpose!=='human-review-only')throw Error('candidate requires explicit unapproved status');
 if(!Array.isArray(manifest.files)||manifest.files.length!==FILES.length)throw Error('incomplete candidate manifest');
 const expected=new Set(FILES.map(row=>row[2]));
 if(new Set(manifest.files.map(f=>f.path)).size!==expected.size)throw Error('duplicate manifest path');
 let total=0;
 for(const f of manifest.files){
  if(!expected.has(f.path)||typeof f.sha256!=='string'||!/^[a-f0-9]{64}$/.test(f.sha256)||!Number.isSafeInteger(f.bytes)||f.bytes<1||f.bytes>25*1024*1024)throw Error('bad manifest entry');
  const path=resolve(root,f.path);
  if(!path.startsWith(resolve(root)+'/'))throw Error('outside candidate root');
  if(lstatSync(path).isSymbolicLink()||!statSync(path).isFile())throw Error('nonregular candidate asset');
  const bytes=readFileSync(path);
  if(bytes.length!==f.bytes||sha256(bytes)!==f.sha256)throw Error('asset integrity mismatch: '+f.path);
  total+=bytes.length;
 }
 if(total>150*1024*1024)throw Error('candidate exceeds size bound');
 // Reject extra files in the deployable subtree; a new asset requires review.
 const walk=(dir,prefix='')=>{
  for(const entry of readdirSync(dir,{withFileTypes:true})){
   const name=prefix+entry.name;
   if(entry.isDirectory())walk(join(dir,entry.name),name+'/');
   else if(!entry.isFile()||!expected.has(name))throw Error('unexpected candidate asset: '+name);
  }
 };
 walk(root);
 return {files:manifest.files.length,bytes:total};
}
function packExtract(name,version,destination){
 const pack=JSON.parse(execFileSync('npm',['pack',name+'@'+version,'--ignore-scripts','--json','--pack-destination',destination],{encoding:'utf8',maxBuffer:3*1024*1024}));
 if(!Array.isArray(pack)||pack.length!==1||!pack[0]?.filename||typeof pack[0].integrity!=='string'||!/^sha512-[A-Za-z0-9+/=]+$/.test(pack[0].integrity))throw Error('missing npm tarball integrity metadata');
 const archive=join(destination,pack[0].filename);
 const listing=execFileSync('tar',['-tzf',archive],{encoding:'utf8',maxBuffer:3*1024*1024}).trim().split('\n');
 if(listing.some(p=>!p.startsWith('package/')||p.includes('..')||p.startsWith('/')))throw Error('unexpected package archive entry');
 const expanded=mkdtempSync(join(destination,'extract-'));
 execFileSync('tar',['-xzf',archive,'-C',expanded,'--no-same-owner']);
 return {path:join(expanded,'package'),npmIntegrity:pack[0].integrity||null};
}
export function prepareCandidate(output){
 if(!output||output==='/'||resolve(output)===process.cwd()||existsSync(resolve(output)))throw Error('candidate output must be a new empty directory');
 const scratch=mkdtempSync(join(tmpdir(),'bursyar-ocr-vendor-'));
 const root=resolve(output,'assets');
 try{
  mkdirSync(root,{recursive:true});
  const sources=new Map();
  const provenance=[];
  for(const [key,name,version] of PACKAGES){
   const extracted=packExtract(name,version,scratch);
   sources.set(key,extracted.path);
   provenance.push({package:name,version,npmIntegrity:extracted.npmIntegrity});
  }
  const files=[];
  for(const [source,relative,dest] of FILES){
   const from=resolve(sources.get(source),relative),base=resolve(sources.get(source));
   if(!from.startsWith(base+'/')||lstatSync(from).isSymbolicLink()||!statSync(from).isFile())throw Error('missing or unsafe npm asset: '+source+'/'+relative);
   const to=join(root,dest);mkdirSync(dirname(to),{recursive:true});copyFileSync(from,to);
   const bytes=readFileSync(to);
   files.push({path:dest,bytes:bytes.length,sha256:sha256(bytes)});
  }
  files.sort((a,b)=>a.path.localeCompare(b.path,'en'));
  const manifest={schema:1,purpose:'human-review-only',releaseApproved:false,source:'npm pack --ignore-scripts',provenance,files};
  const result=inspectCandidate(root,manifest);
  writeFileSync(join(output,'candidate-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  writeFileSync(join(output,'NOT_APPROVED_FOR_PRODUCTION.txt'),'OCR candidate. Do not upload to public/ or enable binary document intake until independent SHA-256 review, licenses, CSP, hosted-worker smoke tests and privacy review are signed off.\n');
  return result;
 }catch(error){rmSync(resolve(output),{recursive:true,force:true});throw error;}
 finally{rmSync(scratch,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
 const output=process.argv[2];
 if(!output){console.error('Usage: node scripts/prepare-ocr-vendor-candidate.mjs <empty-output-directory>');process.exitCode=2;}
 else{try{console.log(JSON.stringify(prepareCandidate(output)));}catch(error){console.error('Vendor candidate failed closed:',error.message);process.exitCode=1;}}
}
