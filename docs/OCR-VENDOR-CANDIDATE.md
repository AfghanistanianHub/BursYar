# OCR first-party vendor candidate (Issue #88)

## Status: CANDIDATE ONLY — NOT PRODUCTION ENABLEMENT

The production PDF/image gate stays **OFF**. Real students can use the consent-gated TXT route, not binary PDF/image OCR. A vendor candidate is **not** proof of code safety, model accuracy, source integrity, origin isolation or institutional document verification.

## What was automated

- A one-shot, **manual** GitHub Actions workflow (.github/workflows/ocr-vendor-candidate.yml) creates a review artifact on a read-only runner. It is never triggered by pull requests or by a site visit.
- scripts/prepare-ocr-vendor-candidate.mjs fetches six exact-version npm package tarballs through npm pack --ignore-scripts: pdfjs-dist@4.10.38, tesseract.js@5.1.1, tesseract.js-core@5.1.1, and @tesseract.js-data/{eng,fas,pus}@1.0.0.
- The complete candidate matrix is 15 files: PDF.js module + module worker, Tesseract ESM + worker, four core combinations each with a JS loader and WASM module, and three 4.0.0_best_int gzipped language models.
- A JSON manifest records the npm package identity, npm tarball integrity, path, byte length and SHA-256 for each copied file. inspectCandidate() checks exact file completeness, uniqueness, SHA-256, sizes, symlinks and unexpected files. The generator refuses pre-existing destinations.
- The candidate manifest sets releaseApproved: false and is accompanied by NOT_APPROVED_FOR_PRODUCTION.txt. The workflow uploads an **artifact for independent review only**, not a commit or deployment. Retention is 3 days.

## Run

When merged to default branch, in GitHub Actions choose **Prepare OCR first-party vendor candidate → Run workflow**. Alternatively in a networked clean environment run:

    node scripts/prepare-ocr-vendor-candidate.mjs /tmp/bursyar-ocr-candidate-unique

No real student records, credentials or private scholarship data should be present. If one package or language dataset is unavailable or missing, **the command fails closed** and production stays TXT-only. Do not substitute floating URLs, latest versions or silently omit Pashto.

The generated artifact may contain tens of megabytes of WASM/model data. It is deliberately not committed to Git in this phase.

## Mandatory separate release review

1. Independently review all npm tarball integrity fields, the full SHA-256 manifest, origin, licenses and applicable advisories. **A freshly generated SHA is a measurement, not approval**. Store approved hashes in a separately reviewed immutable lock.
2. Audit bundled worker and WASM behavior, browser sandbox and network requests. Copy approved files to a first-party immutable asset path with correct Content-Type, Cross-Origin-Resource-Policy and CSP. Avoid untrusted third-party runtime code and language data downloads.
3. Wire PDF.js worker and Tesseract workerPath, corePath (directory containing all core variants), and langPath to those first-party paths. Do not trust a URL from document text or browser input. Verify both ESM and web worker loading.
4. Re-run **real** headless Chromium synthetic PDF (selectable and scanned), JPEG/PNG, English/Farsi/Pashto, offline/missing-file and 320px/low-memory cases. If Pashto returns no text, allow explicitly labelled human transcription; never synthesize an OCR result.
5. Review Google Firebase sign-in when applying CSP. A previous CSP draft blocked sign-in and was intentionally reverted. Require staged auth, storage, owner isolation, consent and deletion tests before release.
6. Obtain documented acceptance of origin/CSP and privacy tests and only then consider removing the hard production binary gate in a **separate** PR. Issuer-name matches, OCR and human transcription remain authenticity: not_verified and cannot be upgraded to official verification.

Do not set a production flag simply because the candidate-artifact job passed.
