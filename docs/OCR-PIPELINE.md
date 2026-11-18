# Local PDF and OCR pipeline (Mission 43)

BursYar reads PDF, PNG and JPEG documents in the student's browser. No document
byte, image or scan is sent to the API, to a model provider or to a third party.
Only the reviewed extracted text (12 KB maximum) is stored after explicit
consent.

This document records how the pipeline is built, what it provably does, and what
it does not do.

## 1. Self-hosted assets, no CDN

The runtime used to import Tesseract from `cdn.jsdelivr.net`. That dependency is
gone: `src/document-extraction.js` resolves OCR through `src/ocr-runtime.js`,
which loads every asset from this application's own origin under `/ocr/`.

`scripts/prepare-ocr-assets.mjs` copies the pinned files out of `node_modules`
and writes `public/ocr/manifest.json` with the size and SHA-256 of each one:

| Package | Version | Files |
| --- | --- | --- |
| `tesseract.js` | 5.1.1 | `tesseract.esm.min.js`, `worker.min.js` |
| `tesseract.js-core` | 5.1.1 | `tesseract-core-simd-lstm.wasm{,.js}`, `tesseract-core-lstm.wasm{,.js}` |
| `@tesseract.js-data/eng` | 1.0.0 | `4.0.0_best_int/eng.traineddata.gz` |
| `@tesseract.js-data/fas` | 1.0.0 | `4.0.0_best_int/fas.traineddata.gz` |
| `@tesseract.js-data/pus` | 1.0.0 | `4.0.0_best_int/pus.traineddata.gz` |

Total: 9 files, 17.7 MiB, loaded lazily on first PDF-with-no-text-layer or image
upload and cached by the browser afterwards. `public/ocr/` is generated and
therefore not committed (`.gitignore`); `package-lock.json` pins the bytes and
the manifest pins the hashes.

The script runs automatically through npm pre-scripts (`predev`, `prebuild`,
`pretest`) and manually via `npm run prepare:ocr`.

PDF parsing keeps the existing self-hosted PDF.js 4.10.38 worker
(`src/pdf-runtime.js`, `pdf.worker.min-*.mjs` emitted by Vite).

`workerBlobURL` is false, so the OCR worker is created from a same-origin script
rather than a `blob:` URL, and `corePath`/`langPath` are pinned to `/ocr/` and
`/ocr/lang/`.

## 2. Intake rules and limits

Enforced in `src/document-extraction.js` before anything is stored:

| Limit | Value |
| --- | --- |
| TXT | 12 KB, strict UTF-8, control characters rejected |
| PDF / PNG / JPEG | 5 MB |
| PDF pages | 1–5, else `pdfPageLimit` |
| Image dimensions | ≤ 4500 px per side and ≤ 12,000,000 pixels (`imageDimensions`) |
| Extracted text | 12 KB (`extractedTextTooLarge`) |
| Wall-clock budget | one 30 s deadline covers read, decode, PDF parse, render and OCR |
| OCR languages | `eng`, `fas`, `pus` only (`unsupportedOcrLanguage`) |

Failure handling: malformed or truncated PDFs fail with `invalidPdf`, encrypted
PDFs are rejected by PDF.js rather than parsed as text, wrong signatures fail
with `invalidImage`, unsupported extensions with `unsupportedFile`. Every path
terminates the worker, closes the bitmap and destroys the PDF task/canvas.
Text-layer PDFs never start OCR. A scan that yields no characters opens an
explicit manual-transcription editor instead of inventing content.

PDF.js runs with `isEvalSupported:false`, `enableScripting:false`,
`useSystemFonts:false`, `stopAtErrors:true`.

## 3. Content Security Policy

`vercel.json` now declares one global header set for `/(.*)`:

```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval' https://apis.google.com https://www.gstatic.com;
worker-src 'self' blob:; child-src 'self' blob:;
style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:;
connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com
  https://www.googleapis.com https://bursyar-api.onrender.com;
frame-src 'self' https://accounts.google.com https://*.firebaseapp.com;
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'
```

`'wasm-unsafe-eval'` is required for the Tesseract WebAssembly core. The Firebase
Auth origins (`apis.google.com`, `www.gstatic.com`, `accounts.google.com`,
`*.firebaseapp.com`, `identitytoolkit`/`securetoken`) keep Google popup sign-in
working; no `unsafe-inline` script or `unsafe-eval` is allowed. `X-Content-Type-Options:
nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` ship with it.

The policy takes effect on the next authorized deployment. It was exercised
locally by serving the production build with these exact headers (see below).

## 4. Verified behaviour

Browser: Chromium 141.0.7390.37 (Playwright 1.56). Synthetic fixtures only.

`verification/document-production-gate-browser.mjs` — **21/21 PASS** against the
built bundle (`dist/`, PROD=true) with the deployment's headers:

- TXT saves directly; a text-layer PDF is parsed by the same-origin PDF.js worker
  and saved; a scanned (image-only) PDF is OCRed; a PNG is OCRed.
- 6 requests to `/ocr/` and the PDF worker, **zero off-origin requests**, zero
  CSP violations.
- Corrupt PDF, 6-page PDF, >5 MB PDF, fake PNG and `.exe` all rejected with no
  write and no preview.

`verification/document-ocr-integration.mjs` — **20 cases PASS** (dev server, real
assets, mocked identity):

- English text PDF and scanned PDF, PNG and JPEG OCR, Dari OCR
  (`مدرک تحصیلی: لیسانس` read correctly, RTL preserved in the editor).
- Pashto: the shipped `best_int` model returned no characters for the synthetic
  rendering, and the app offered manual transcription instead — recorded as a
  limitation, not a pass for Pashto OCR.
- Corrupt/encrypted PDF, oversize, 6 pages, bad signature, bad extension →
  rejected; consent withdrawal, replacement, cancel, lost-response retry,
  idempotent retry, 409 conflict, reload persistence, and a second context that
  blocks `cdn.jsdelivr.net`/`unpkg.com` while OCR still works from `/ocr/`.

`verification/document-library-browser.mjs` and
`verification/document-preview-browser.mjs` pass as well, including per-owner
isolation (a second identity sees an empty library and gets 404 on a direct
fetch) and the PDF/image consent gate in en/fa/ps.

Unit suite: `npm test` **419 pass / 0 fail**, including 6 new tests that assert
the manifest hashes, the asset list, the absence of any absolute URL in
`src/ocr-runtime.js` and `src/document-extraction.js`, and that the generated
directory stays untracked.

## 5. Honest limitations

- Accuracy is **not** benchmarked against real certificates. The `best_int`
  models trade accuracy for size; a trailing letter can be missed (observed:
  "ONLY" → "ONLI" in a JPEG-in-PDF). Users must review extracted text before
  saving; the UI says so.
- **Pashto OCR is not established.** With the shipped model and synthetic input
  it produced nothing, so the manual-transcription fallback is the supported
  path. Do not claim Pashto OCR support beyond "attempted, may be empty".
- Persian OCR worked on the synthetic fixture; no claim is made about
  handwritten, stamped or low-resolution scans.
- No OCR output is treated as issuer verification. See
  `docs/TRANSLATION-REVIEW-WORKSHEET.md` and the verification centre copy.

## 6. Reproducing the browser checks

The Cloud runner has no system fonts and no root, so Chromium needs a local font
configuration and library prefix. Both helpers are sandbox-only and not part of
the application:

```bash
node scripts/dev/install-browser-libs.mjs   # unpacks .debs into /tmp/chrome-libs
node scripts/dev/install-browser-fonts.mjs  # DejaVu + fontconfig into /tmp/fonts
source /tmp/chrome-libs.env
source /tmp/chrome-fonts.env
npm run build
node verification/document-production-gate-browser.mjs
node verification/document-ocr-integration.mjs
```

Without a font configuration, headless Chromium aborts with
`SkFontMgr_FontConfigInterface ... Not implemented` as soon as a web font loads;
that is an environment defect, not an application defect.
