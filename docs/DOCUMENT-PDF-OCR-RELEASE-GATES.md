# PDF/image document intake — release gates (2026-11-03)

## Implemented in PR #86
- TXT: UTF-8, 12 KB.
- PDF: 5 MB, max 5 pages. Browser-only PDF.js text extraction; fallback to local Tesseract OCR for pages without a text layer.
- PNG/JPEG: 5 MB; magic bytes and decoded image limits; browser-only Tesseract OCR.
- English/Farsi/Pashto OCR language selection (eng/fas/pus).
- Only extracted text (12 KB cap) enters existing authenticated, consent-gated document API; raw PDF/image bytes are not stored in the remote database and are not sent to Meta.
- For PDF/image, extraction now opens an editable, locally staged text preview. No binary-derived text is uploaded until the user explicitly clicks **Save reviewed extracted text**. Cancel discards the preview; changing file or OCR language invalidates it. Dedicated browser regression `verification/document-preview-browser.mjs` covers cancel/confirm/storage and en/fa/ps (mocked extractor, not a claim of real OCR accuracy).
- **OCR zero-text policy:** If OCR returns no readable characters (observed on a synthetic Pashto image), the UI opens an explicitly labelled manual-transcription preview. No text is invented and no write happens without user entry and consent. Private record provenance is `manual_transcription_from_image` or `manual_transcription_from_pdf` rather than an OCR-success claim. Mocked browser regression covers this fallback, cancellation and consent withdrawal. This does not imply Pashto OCR accuracy is solved.
- Explicit English/Farsi/Pashto degree and GPA labels are staged for human review; they never get issuer-verified status.
- Public source comparison uses the existing SSRF-protected /api/source to fetch **only a URL**; issuer-name mention does not verify a student's certificate. Text is compared locally within the browser. URL query/credentials are blocked in the UI.
- Upload request IDs from PR #83 remain supported after main integration.

## Known security/product limitations
- PDF.js and Tesseract code, WASM worker and OCR language data download on demand from external sources. These are pinned packages, but no SRI or self-hosted, audited assets yet. A malicious third-party script could access origin context; vendor/serve assets from the origin with locked hashes and CSP before deploying broadly to real students.
- No anti-malware sandbox or trusted offline authenticity check for original binary. No original binary is retained by the server.
- OCR is probabilistic and must be reviewed. Text extraction and public website comparison **never** authenticate a person's original document.
- No registrar API/issuer signature verification, QR-code trust validation, institutional accreditation registry or credential-specific official lookup has been integrated. Issuer names in public pages can be impersonated.
- The backend's claim extractor recognizes only narrow fields; it is not a complete AI interpretation of all academic records.
- OCR language performance for Farsi and Pashto has not been human-evaluated. A correct locale model alone is not evidence of accuracy.
- The public-source comparison only checks a declared issuer name against the text of one fetched page. It does not prove the page is official, that the issuer is accredited, that the document was issued, or that the holder is the named student.

## Must pass before production merge / marketing claim
1. All four GitHub Actions CI jobs (verify, emulator, browser, macos-helper).
2. Real Chromium test with a synthetic **selectable-text PDF** and a **scanned PDF**, including invalid/encrypted PDFs and page-count/size limits; correct field-level review after extraction and reload/deletion.
3. Real PNG/JPEG OCR tests with synthetic images in en/fa/ps, missing network/WASM assets, timeouts, and memory limits on mobile devices.
4. Confirm CDN dependencies are either vendored/self-hosted under an enforced CSP or explicitly approved through security/privacy review. No sensitive documents should be used in third-party code experiments.
5. Ensure accessibility of OCR language control, public-source check, and error states in all three UI languages; fluent human review of translations.
6. Retest host deployment persistence, owner isolation, deletion and PR #83 idempotent upload.
7. For issuer **verification** status, implement an issuer-controlled API or independently audited manual issuer response with verifiable evidence, and write negative tests proving OCR/LLM/public-name matches cannot promote authenticity.
8. Model-based visual fraud signals, if implemented later, must be opt-in, data-minimized, age/geography/policy compliant, and represented as suspicion requiring human investigation—not proof.

## Non-goals / costs
No paid inference, no Meta API calls, no new cloud OCR account, no Firebase authentication changes, and no automatic authenticity promotion were introduced.

## Safe current claim
“Students can submit PDF/image files for on-device text extraction and review (subject to browser and release verification). BursYar can compare a claimed issuer name with publicly retrieved source text, but document authenticity remains unverified unless an authorized independent issuer confirmation becomes available.”
