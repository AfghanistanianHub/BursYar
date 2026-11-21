# BursYar engineering delivery — 28 October 2026

The core URL-first extension is implemented and published as reviewable draft PRs. **The overall mission is not fully done:** live Oxford retrieval is blocked by its website challenge, validated live Meta inference lacks correlated evidence, and fluent human translation review is pending. No paid requests, spending changes, merges, public deployment, production Firebase changes or hackathon submission were performed.

## Reviewable implementation

| Pull request | Scope | Relationship |
| --- | --- | --- |
| [#8](https://github.com/AfghanistanianHub/BursYar/pull/8) | Existing authenticated inference integration and Mac startup | Main integration base |
| [#9](https://github.com/AfghanistanianHub/BursYar/pull/9) | Existing evidence compiler, local TXT documents, private profile and scenarios | On #8 |
| [#10](https://github.com/AfghanistanianHub/BursYar/pull/10) | Existing bounded Meta timeout/cancellation diagnostics | On #9 |
| [#11](https://github.com/AfghanistanianHub/BursYar/pull/11) | Existing compact strict schema and low reasoning | On #10 |
| [#12](https://github.com/AfghanistanianHub/BursYar/pull/12) | Existing full condition inventory, editable private profiles, Oxford exclusions | On #11 |
| [#13](https://github.com/AfghanistanianHub/BursYar/pull/13) | **New:** authenticated URL fetch, safe extraction, provenance, approval, manual fallback and three-language errors | On #12 |
| [#14](https://github.com/AfghanistanianHub/BursYar/pull/14) | **New:** optional fictional example; connected three-language instructions and coverage warning | On #13 |

Preserved the existing approved visual identity, source-evidence validation, Firebase ownership controls, transactional private SQLite quotas, document consent/deletion controls and existing model policy. Main and production were not changed. PRs remain drafts in the stated review order.

## Current capabilities and limits

| Mission area | Evidence-backed status |
| --- | --- |
| URL-first retrieval | Implemented for public UTF-8 HTML/text over HTTPS. URL → authenticated fetch → extracted source review → explicit approval → existing analysis workflow. Offline end-to-end fixture verification; live Oxford acceptance remains blocked. |
| Safe fetching | All DNS answers must be public; pinned connection and peer validation; normal TLS verification; no pooled connections; revalidated redirects; byte, text, time, rate and concurrency limits. No scripts, challenge solving, cookies, authentication bypass or paywall bypass. |
| Provenance | Requested/final URL, retrieval time, redirect history, extraction method, raw body digest, extracted-text digest, full extracted text, and server-HMAC receipt. Receipts expire after 30 minutes and on server restart. Editing source invalidates approval/provenance; changing a fetched URL clears the prior fetched text. |
| Linked pages | At most 20 same-origin links are offered for manual review. They are not fetched automatically or certified as official conditions. Course-specific requirements remain unresolved until inspected. |
| Meta | Existing `muse-spark-1.3`, low reasoning, strict compact JSON schema, 4,000 completion-token cap, bounded cancellation, spending gate, transactional quotas and correlated safe events retained. No automatic retries, invented success or simulated runtime fallback. |
| Profile/documents | Existing authenticated, private persisted profile and reviewed UTF-8 TXT pipeline retained. Pending/user-declared/document-inspected/issuer-verified concepts remain distinct. No issuer verification service exists. Private documents are not sent to Meta. |
| Eligibility | Existing conservative MET / NOT MET / UNKNOWN evaluation, full retained source inventory and narrowly supported rules retained. Two exact Oxford exclusions are mapped. Unselected/unsupported decisive conditions remain unresolved. This does not constitute complete scholarship or admission eligibility. |
| Gaps | Existing requirement-specific guidance asks the institution to clarify actual missing evidence, status, deadlines and accepted tests. No unsupported provider referral, acceptance guarantee, partnership or invented threshold. |
| Counterfactuals | Existing isolated scenarios preserve actual profile facts and canonical rule IDs. Only supported rule changes can be evaluated; unknowns remain unknown. No admission-probability percentages. |
| Three languages | English/Dari/Pashto controls, source approval/errors, RTL and preserved source/profile/scenario state. Standard coverage uncertainty is localized; original quotations remain in their original language. New and existing translations still need fluent human review. |
| UX | Assistant is the primary journey before sample listings. Fictional eligibility example is optional; source-derived assessment appears directly following analysis. Existing illustrative scholarship listings remain clearly labeled sample data. |
| PDF/images | Not implemented; future hardened ingestion/OCR work. TXT remains the supported demo path. |

## Verification

Final CI status is recorded below when available. Automated browser identity, source transport and Meta responses are fixtures, not real provider or institutional verification.

- **122 Node tests passed**, zero failures/skips, on the final runtime code locally. Includes SSRF address classification, mixed DNS rejection, redirect revalidation/limits, connection pinning/peer checks, size/type/encoding limits, cancellation/deadlines, DNS-slot retention, receipt integrity/expiry, auth/origin checks and no-spend-before-analysis.
- **33 offline evaluation assertions passed** using existing official-excerpt fixtures and synthetic Oxford scenarios. These evaluate deterministic handling, not live model semantic accuracy.
- **47 Firebase Auth/Firestore Emulator checks passed** locally, with a fake model and the `demo-bursyar` project. No production Firebase operations.
- Production build passed. Full npm dependency audit reported **0 known vulnerabilities**; that is dependency advisory evidence, not a security certification.
- Native macOS helper compiled; synthetic attestation update/redaction self-tests passed without reading credentials. CI also checks its missing-item path.
- Browser matrix: English/Dari/Pashto × 320/390/768/1280/1440 pixels = **15 cases**, plus full profile/TXT/Oxford scenario at 390 in each language. Includes WCAG 2 A/AA and 2.1 AA axe scans, horizontal overflow, approval, no analysis on fetch, language-switch preservation, source changes and manual fallback. Local Chromium cannot start under the agent sandbox; these tests run in GitHub CI.
- First URL-first CI run passed all four jobs with **15 browser cases and 15 source-preview cases**, zero recorded axe violations or horizontal overflows: [run 40769603544](https://github.com/AfghanistanianHub/BursYar/actions/runs/40769603544). This earlier run predates the final DNS and UX refinements; final runs are listed below separately.

## Security findings and residual risks

Resolved during this work: unsafe network destinations are rejected before dispatch and after connection; redirect rebinding cannot escape destination checks; fetched-source provenance cannot be claimed for edited text; text from a previous URL is cleared when a fetched URL changes; prior displayed analysis clears when source changes; timed-out DNS lookups retain their concurrency slots until settled and never connect afterward.

Residual limits: semantic HTML extraction is heuristic and may select unrelated text or miss requirements. Whitespace normalization defines the extracted quote boundary; raw HTML bytes are represented by a separate digest. A valid public TLS connection does not prove an institution's policy is current, authentic or complete. Prompt isolation and exact excerpts do not prove semantic entailment. The deterministic grammar covers a small subset of possible policies. Rate/concurrency controls are single-process and restart with the gateway; the service stays loopback-only. SQLite/file deletion does not erase backups or storage-device remnants. There is no hardened PDF/OCR path, issuer credential validation, external translation approval or exhaustive independent security audit.

## Real provider evidence versus offline rehearsal

A real unpaid HTTPS request to the exact [Oxford Clarendon applicants page](https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants) returned **HTTP 403 with `cf-mitigated: challenge`** from this environment on 28 October. BursYar rejected it. No script was executed and no challenge was solved. **This does not pass the live URL-only Oxford acceptance criterion.**

No Meta inference was initiated in this session. Earlier stack documentation records an owner-authorized timeout and an HTTP 200 truncated response; neither proves successful downstream analysis. A successful live claim requires an actual `meta_response` with `finishReason: stop` followed by `analysis_validated` with the same requestId, plus inspection of the exact-source output. Such paired real evidence has not been established here. Offline tests deliberately exercise these events with fake providers and must never be presented as live proof.

Read-only official documentation recheck confirmed the retained [Muse Spark 1.3 model](https://dev.meta.ai/docs/models), [structured output](https://dev.meta.ai/docs/structured-output), and [reasoning controls](https://dev.meta.ai/docs/reasoning) remain documented. This verifies published support, not account access, provider performance, billed cost or successful inference.

## Four-minute Oxford demonstration and recording plan

Use only a clearly synthetic Afghan student and `verification/fixtures/synthetic-education.txt`. Keep a visible **OFFLINE REHEARSAL — mocked identity, source and Meta** banner wherever fixtures are shown.

| Time | Show and explain |
| --- | --- |
| 0:00–0:35 | Paste the official Oxford URL. Show the real retrieval result. If challenged, show the translated failure/manual fallback and explicitly label any subsequent fixture preview as offline; do not imply live URL success. |
| 0:35–1:05 | Inspect extracted requirements, requested/final URL, timestamp and digests. Explain unverified source status and course-specific uncertainty. Fetching makes no AI request; review and approval precede submission. |
| 1:05–1:40 | Inspect source excerpts, provisional interpretation and full retained condition inventory. Use a verified authorized live response only if paired provider/validation evidence exists; otherwise state that the displayed response is mocked. |
| 1:40–2:20 | Review synthetic TXT education claims, consent and source-to-profile provenance. Show persistence. Explain that inspected documents are not officially issuer-verified credentials. |
| 2:20–2:55 | Show MET/NOT MET/UNKNOWN for supported requirements and Oxford exclusions; keep admission and scholarship eligibility separate. Explain missing accepted certification versus assumed English ability. |
| 2:55–3:25 | Explore a hypothetical resolution of a supported condition. Point to the precise rule that changes, unchanged unknowns and unchanged actual profile data. |
| 3:25–4:00 | Switch English/Dari/Pashto, inspect RTL and original quotations. Show document deletion and consent. State remaining live, translation and ingestion limits. |

Capture a screen recording in that order; pause on each provenance/consent step. Browser screenshots carry the offline banner and synthetic data. Do not include credentials, private files, tokens, HARs or raw provider reasoning/output in submission assets.

Architecture: browser → authenticated loopback gateway → pinned public HTTPS source retrieval → review/approval → existing spending and transactional quota gates → strict compact Meta response → independent schema/exact-evidence validation → conservative deterministic compiler → private consent-based profile comparison → isolated scenarios. Private document/profile APIs use Firebase-derived ownership and local SQLite and never include documents in inference requests.

Submission description: BursYar connects scholarship source evidence, consent-based educational profiles and conservative three-valued eligibility checks in English, Dari and Pashto. It retains provenance and unresolved conditions, supports reviewed local TXT documents, and separates hypothetical plans from actual facts. The current demonstration is an offline rehearsal; live Oxford retrieval and successful source-validated Meta inference remain unverified.

## Minimum remaining owner actions

1. Supply existing safe correlated successful provider/validation records if available. If none exist and a live demo is required, separately authorize **one** paid inference under the unchanged spending cap; the mission itself forbids making that request without explicit authorization. No cap increase or credential re-entry is requested.
2. Arrange fluent Dari/Pashto review. No automated check substitutes for that review.
3. Confirm official hackathon entry requirements and approve final recording/submission. Review the stacked drafts in order; merging, public deployment and submission remain explicitly gated.

Oxford's challenge is an external retrieval limitation, not a request to bypass it or to relax security. Successful unpaid retrieval must be demonstrated on a network where the institution permits it before claiming the exact URL acceptance criterion is met.

## Durable recovery checkpoint

Remote branch: `feat/connected-student-journey`, draft PR #14, stacked on `feat/url-first-source-retrieval` / #13. Runtime implementation checkpoint: `8977abdec21d58ed221465fa142b16e7da596e62`. The final code tree before this report is `619160134df8d84f26a9f6f651da63a4f2ef1637`. Documentation-only commits may follow without changing runtime behavior.

PR #13 final runtime checkpoint `078bacb91d1c7cc83298691b014aae4d7b22a707` passed all four jobs in [run 40770075619](https://github.com/AfghanistanianHub/BursYar/actions/runs/40770075619). PR #14 runtime workflow is [run 40770652346](https://github.com/AfghanistanianHub/BursYar/actions/runs/40770652346); consult that run and current PR checks for final browser status. Do not infer success from an unfinished run.

Resume by fetching the two remote branches and checking out the current #14 head in a clean branch/worktree; preserve unrelated local changes. GitHub CLI credentials were unavailable in the agent, so commits/branches/PRs were published through the connected GitHub API. Remote trees were checked against local Git tree hashes. Local publication/review branches may have equivalent file trees with different commit metadata; do not force-push them over the remote branch. Use the remote ancestry for subsequent work.

Reproduce with Node >=24.12, pinned package-lock and Java 21: `npm ci`, `npm test`, `npm run test:evaluation`, `npm run build`, `npm run test:emulator`, then install Chromium and run `npm run test:browser`. The macOS helper CI compiles the Swift helper, runs synthetic self-tests and checks its no-secret missing-item path. Use only offline fixtures; `npm run test:live` is separately gated and is not part of this authorization.

The local emulator initially lacked Java on PATH; the existing temporary Java 21 runtime resolved it without a system install. npm used a task cache under `/tmp` because the default cache was unwritable. Local Chromium exited with SIGTRAP before testing, so browser assertions run in CI. None of these environmental failures is a product-test success claim.

Next independent work: inspect final CI/browser artifacts; preserve zero-overflow and zero-axe-violation evidence; arrange human translations; verify live unpaid Oxford retrieval only where permitted; obtain existing correlated provider evidence or a new explicit single-call authorization. Paid inference, cap changes, production Firebase changes, merging, public deployment and submission remain owner gates. No credential, database, quota reset or Keychain migration is needed to resume.

Final provenance refinement hashes original response bytes before UTF-8 decoding, so a byte-order mark remains represented by the wire digest even though the article text decoder omits it. A separate regression test covers this boundary.
