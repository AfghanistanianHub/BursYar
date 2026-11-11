// Loaded only after the binary-document gate. npm's lockfile pins the parser
// and matching worker; both are served from this application, never a CDN.
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
export function pdfRuntime(){
 pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
 return pdfjs;
}
