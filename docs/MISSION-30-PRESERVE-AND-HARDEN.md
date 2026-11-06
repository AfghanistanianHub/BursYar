# Mission 30 — preserved candidate and security hardening

Review candidate only. Production binary uploads remain disabled. No remote
branch/ref, PR, remote CI, hosting build, deployment, inference, credential,
billing or production-setting change was initiated.

## Preservation boundary

Started exactly at `21472c01d242ff2fe22360e0e9eca9e7ebd0dd6b` in a separate
Work checkout. Mission 28/29 and all three original branches remain ancestors.
The original Work checkouts and existing GitHub branches were not overwritten.

At that exact commit, `vercel.json` excludes five named work branches from Git
deployment. A read-only `git ls-remote` confirmed all five already exist. No
new branch has a demonstrated deployment exclusion, and the absence of a PR
does not establish exemption from all integration activity. A demonstrably
nonbillable new remote branch path was not established; none was created.
The local branch is `work/mission30-preserve-harden`. GitHub commit objects
are linked from Issue #120 but have no remote ref or guaranteed retention;
Work workspace retention is also unconfirmed. This remains a persistence risk.

## Saved implementation

- Dependency fix: `99b9448bc8b9e7968ee4e2225e6c968473b52950`.
- OCR/security implementation: `d053d1db8b3f399b6d25506ac089b16ad9867297`.
- Exact source tree and machine-readable test evidence: [MISSION-30-VALIDATION.json](MISSION-30-VALIDATION.json).

The commits form a chain extending the full Mission 29 candidate. They are not
merges into main or deployed code.

## Dependency remediation

Scoped overrides select rimraf 6.1.4 and glob 14.0.4 for affected ranges;
glob resolves patched minimatch 11.0.5. Google SDK major versions are retained.
Both production-only and full development dependency audits report zero
advisories in this environment, replacing the six production findings.
This describes the candidate lockfile, not the unchanged production deployment.

Offline checks exercise the actual consuming SDK cleanup API, archiver pattern
exclusions, Firebase file listing, controller loading and already-aborted glob
traversal. Live Google services, emulator and platform CI were not exercised.

## OCR memory and initialization

The exact pinned cores define their own WASM memory with a 2 GiB maximum;
intercepting `new WebAssembly.Memory` would not bound them. Preparation now
checks every upstream hash before deriving all four standalone WASMs and their
four embedded equivalents. A strict parser lowers only the reviewed memory
maximum from 32768 to 4096 pages (256 MiB), keeping initial memory at 16 MiB.
Executable instructions are unchanged. Modified binaries carry a custom-section
notice and modified JavaScript carries a comment; original licenses and source
hashes are retained. Derived hashes are pinned separately. Imported memory,
unexpected layouts, mismatching embedded data and malformed binaries fail closed.

Tests verify engine-enforced rejection of both JavaScript and internal WASM
growth beyond the cap. Real English/Farsi/Pashto and scanned-page OCR succeeds
for the synthetic fixtures under these derived cores.

Asset preparation uses a bounded exclusive filesystem lock, reuses a complete
matching generation, stages all 26 outputs, and restores the prior output if
publication throws. Cold concurrent initializers are tested in an isolated
temporary checkout. This avoids preparation tests mutating a running preview.

**Not crash-safe:** the two-rename publication has a brief target-absence window.
SIGKILL/power loss there can leave a `.previous-*` backup and a stale lock. The
lock fails closed rather than deleting a possibly live owner's lock. Recovery
requires confirming no initializer is active before removing a stale lock or
restoring the retained backup. No process-wide memory ceiling is claimed.

## Model source and license evidence

The compressed and decompressed eng/fas/pus npm models match byte-for-byte the
files at upstream `naptha/tessdata` revision
`806cd9adc8c6e8abc11c782db1818c990576bebc`. URLs, hashes and check time are
recorded in [ocr-model-provenance.json](../data/ocr-model-provenance.json).
The upstream README identifies these as integerized Tessdata Best files
published to npm; its snapshot is retained. The upstream Apache-2.0 license is
retained and copied with generated assets. Build-time provenance checks bind
all three source models and the license hash to the recorded evidence.

Npm wrapper metadata declares MIT while upstream distributes these assets with
Apache-2.0. Both records are preserved; this discrepancy is not silently
resolved or relabeled. Formal license sign-off remains a release gate.

## Validation and corrected regressions

- 428 Node tests passed; 0 failed, skipped or cancelled.
- 60 offline evaluation cases passed; no live model accuracy claim.
- 34 real OCR/journey checks passed, including a valid AES-256 encrypted PDF,
  corrupt PDFs, oversized extracted text, concatenated/truncated PNG, JPEG DNL,
  unexecuted PDF OpenAction, consent withdrawal and retry recovery.
- 5 real worker lifecycle cases passed; zero workers remain after each case.
- Built worker OCR, local Vite build and built-production TXT-only gate passed.
- Full npm audit: zero advisories; no remote CI or deployment was triggered.

The review caught a scanned-PDF test-builder variable regression; it was
reproduced and corrected. A bitmap deadline test was made deterministic under
parallel WASM compilation without changing production deadlines. The oversized
text PDF was changed to keep its full text inside page bounds, so the actual
extracted-text size limit is exercised. Intermediate failures are resolved in
the final results above.

Fresh read-only security review found no cap bypass or remaining confirmed
security regression in its reviewed scope. The later metadata-notice addition
and test-harness corrections were verified by the final full suite and browser
checks; no extra independent review of those small follow-ups is claimed.

## Remaining gates

- WASM maximum excludes worker JavaScript, decoding buffers, PDF parsing/rendering,
  canvases, GPU, cross-tab and process-wide memory. Low-memory/mobile, non-SIMD
  and more adversarial compressed-content tests remain necessary.
- Crash-safe publication/recovery and stale-lock operator handling remain open.
- Formal model-license discrepancy resolution, hosted CSP/MIME/Google sign-in
  evidence and fluent human translation review remain open.
- Required platform CI, a safe durable remote ref and zero-cost release capacity
  remain unconfirmed. Production stays untouched; no live smoke claim is made.
