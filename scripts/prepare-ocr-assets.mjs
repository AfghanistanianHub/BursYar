// Copies the pinned OCR runtime into public/ocr so the browser loads the worker,
// the WebAssembly core and the language data from BursYar's own origin.
// Nothing is fetched from a third-party CDN at runtime.
//
// Runs automatically before `npm run dev` and `npm run build` (npm pre-scripts).
// The generated directory is not committed; package-lock.json pins the bytes.
// Run manually with: npm run prepare:ocr
import {createHash} from 'node:crypto';
import {copyFileSync,existsSync,mkdirSync,readFileSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const outDir=join(root,'public','ocr');
const languages=['eng','fas','pus'];
// tesseract.js 5.x defaults to OEM.LSTM_ONLY, so the LSTM core is the one it
// loads. The SIMD build is preferred and the plain build is its fallback for
// browsers without WebAssembly SIMD.
const coreFiles=[
 'tesseract-core-simd-lstm.wasm.js',
 'tesseract-core-simd-lstm.wasm',
 'tesseract-core-lstm.wasm.js',
 'tesseract-core-lstm.wasm'
];
// The "best_int" traineddata keeps the assets small enough to ship; accuracy is
// lower than the full models and langdata is never fetched at runtime.
const assets=[
 {from:'node_modules/tesseract.js/dist/tesseract.esm.min.js',to:'tesseract.esm.min.js'},
 {from:'node_modules/tesseract.js/dist/worker.min.js',to:'worker.min.js'},
 ...coreFiles.map(file=>({from:`node_modules/tesseract.js-core/${file}`,to:file})),
 ...languages.map(language=>({from:`node_modules/@tesseract.js-data/${language}/4.0.0_best_int/${language}.traineddata.gz`,to:`lang/${language}.traineddata.gz`}))
];

const missing=assets.filter(asset=>!existsSync(join(root,asset.from)));
if(missing.length){
 console.error('OCR assets missing. Run `npm ci` first.\n'+missing.map(asset=>`  - ${asset.from}`).join('\n'));
 process.exit(1);
}

rmSync(outDir,{recursive:true,force:true});
mkdirSync(join(outDir,'lang'),{recursive:true});
const manifest={generatedBy:'scripts/prepare-ocr-assets.mjs',servedFrom:'/ocr/',packages:{},files:[]};
for(const asset of assets){
 const target=join(outDir,asset.to);
 copyFileSync(join(root,asset.from),target);
 const bytes=statSync(target).size;
 manifest.files.push({
  path:asset.to,
  bytes,
  sha256:createHash('sha256').update(readFileSync(target)).digest('hex')
 });
 const pkg=asset.from.startsWith('node_modules/@')?asset.from.split('/').slice(1,3).join('/'):asset.from.split('/')[1];
 manifest.packages[pkg]=JSON.parse(readFileSync(join(root,'node_modules',pkg,'package.json'),'utf8')).version;
}
writeFileSync(join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const total=manifest.files.reduce((sum,file)=>sum+file.bytes,0);
console.log(`OCR assets prepared in public/ocr: ${manifest.files.length} files, ${(total/1048576).toFixed(1)} MiB`);
for(const [pkg,version] of Object.entries(manifest.packages))console.log(`  ${pkg}@${version}`);
