// Self-hosted OCR runtime. The worker script, the WebAssembly core and the
// language data are served from this application's own origin (public/ocr),
// generated from pinned npm packages by scripts/prepare-ocr-assets.mjs.
// No third-party CDN is contacted, so the CSP needs no vendor script origins.
const base='/ocr/';
export async function ocrRuntime(){
 // Imported on demand: the 0.6 MB loader is not part of the initial bundle.
 const module=await import(/* @vite-ignore */ `${base}tesseract.esm.min.js`);
 const api=module.default??module;
 if(typeof api.createWorker!=='function')throw Object.assign(Error('OCR runtime has no createWorker'),{code:'extractionUnavailable'});
 return {
  // Same-origin paths only. workerBlobURL stays false so the worker is created
  // from a real same-origin script instead of a blob: URL, and the SIMD/non-SIMD
  // LSTM core plus the traineddata are resolved inside our own origin.
  createWorker:(language,oem=1,options={},config={})=>api.createWorker(language,oem,{
   workerPath:`${base}worker.min.js`,
   corePath:base,
   langPath:`${base}lang`,
   workerBlobURL:false,
   gzip:true,
   ...options
  },config)
 };
}
