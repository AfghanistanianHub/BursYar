# OCR staging release matrix

Use an independently approved disposable stage with synthetic documents, separate Firebase users and storage, the exact candidate tree, and inference disabled. Record the Git tree, browser version, origin, policy headers and result for each row. Use a stage-only binary test build while the shipped production bundle stays TXT-only.

| Gate | Reproduction | Pass condition |
| --- | --- | --- |
| Input and decompression | Run `node verification/local-pdf-browser.mjs`. Repeat the compressed-PDF, file-size, cancellation and retry cases in the stage browser. | Compressed excess text and inputs above 5 MiB reject, valid retries succeed, and no external requests occur. |
| Worker lifecycle and process memory | Run `node verification/ocr-worker-lifecycle-browser.mjs` and `node verification/document-ocr-integration.mjs`. On disposable 2 GiB and standard browser runners, repeat PDF/PNG/JPEG workflows 20 times, including cancel, missing core, invalid model and non-SIMD runs. Record baseline, peak and post-idle browser and child process RSS and worker counts. | Zero live OCR workers after each case, no process crash or hang, and a documented memory budget reviewed against the measured process peaks. |
| Asset MIME and integrity | For HTML and each asset in the prepared manifest, fetch headers and bodies on the stage over HTTPS. Compare SHA-256 with the prepared manifest. Inspect the Vite-emitted PDF worker separately. | JS and module workers have a JavaScript MIME type, WASM uses application/wasm, compressed models retain their expected bytes, and no asset resolves to an HTML fallback or off-origin redirect. |
| CSP and origin | Capture response CSP and browser securitypolicyviolation events during sign-in, TXT, PDF, OCR, failed asset, cancellation and retry. Intercept requests and record destinations. | All binary assets load from the approved origin, the page and worker policies are enforced, approved auth completes, unexpected network requests are blocked, and no genuine operation causes a violation. |
| Consent and authentication | In synthetic sessions, exercise anonymous requests, expired credentials, withdrawal while credentials are pending, and withdrawal during upload preparation. Run `node verification/document-production-gate-browser.mjs` on the production-mode build. | Unauthorized requests return 401 or 403, withdrawn consent prevents transmission, and the production bundle remains TXT-only. |
| Owner isolation | Create one synthetic document as each of two stage users. As the other user, attempt list, direct read, update and deletion by ID. Switch identity mid-extraction and inspect the pending upload. | No cross-user access or retained preview, no upload after identity changes, and owners can still access and delete their own documents. |

Local checks cover the fixture logic and keep production locked. Hosted MIME, CSP, authenticated Firebase personas, process RSS thresholds and non-SIMD coverage require a disposable stage and recorded evidence before enabling binary uploads.

## Mission 34 disposable loopback rehearsal

Run `node verification/document-ocr-integration.mjs` from an isolated checkout after `npm ci` and Chromium installation. It binds the front end and engine to random ports on 127.0.0.1, uses temporary SQLite, synthetic documents and stub identities, and closes the servers and deletes the database on exit. Inference throws if called. The browser blocks off-origin requests. The 45 checks passed, including three MIME checks, enforced fixture CSP, anonymous rejection, synthetic cross-user list/read/review/delete isolation, consent withdrawal and owner recovery. This is a local gate. Firebase, HTTPS, the hosting proxy and a disposable hosted target still require independent authorization and verification.

Run `OCR_MEASURE_RSS=1 node verification/ocr-worker-lifecycle-browser.mjs` on Linux. It samples Chromium CDP `SystemInfo.getProcessInfo` and Linux `/proc/<pid>/status` `VmRSS` every 100 ms, matching PID namespaces through `NSpid` and limiting the lookup to descendants of the test process. Values below are sampled sums by Chromium process type in KiB. RSS includes shared pages, and a short-lived peak between samples can be missed. OCR Web Workers share a renderer, so the renderer RSS includes worker memory without attributing it to individual workers.

| Local workload | Renderer baseline | Sampled renderer peak | Renderer at cleanup | Live worker targets after cleanup |
| --- | ---: | ---: | ---: | ---: |
| Stalled model | 80832 | 137968 | 106892 | 0 |
| Missing model | 80836 | 137792 | 106964 | 0 |
| Corrupt model, three attempts | 80800 | 138412 | 110520 | 0 |
| Missing WASM | 81032 | 104116 | 104116 | 0 |
| Concurrent extraction | 80964 | 138044 | 106972 | 0 |
| Cancelled model | 80864 | 116988 | 106968 | 0 |

Highest sampled browser RSS was 92868 KiB and GPU RSS was 60732 KiB. These observations do not establish a cap or a long-run leak result. Low-memory, non-SIMD and long-running tests remain open.
