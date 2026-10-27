# BursYar — scholarship clarity

English, Dari/Persian and Pashto scholarship reader and bounded Barrier PathFinder for Afghan applicants. No CTO dependency.

## Current development status

Draft PR #6 (`feat/firebase-inference-quotas`) is stacked on PR #5. Implemented: Firebase-authenticated server-side inference, approved demo access, durable SQLite user/global quotas, bounded Meta adapter, evidence excerpts/provenance and multilingual unreviewed results. Document availability stays in browser memory and never proves eligibility.

**Not an operational live demo yet.** Live Firebase/Meta credentials and identity flow, official-source evaluation, human translation review, browser/RTL and Firebase emulator testing remain release gates. The scholarship catalog is demo-only. No public backend deployment or production rules changes have been performed.

## Setup and verification

Node >=22.13 required. From repository root:

```bash
npm ci
npm test
npm run build
npm run dev
```

For actual inference, follow [the inference runbook](docs/INFERENCE-RUNBOOK.md): Google sign-in uses public VITE_FIREBASE_* configuration; server uses private Firebase ADC and Meta credentials plus explicit quotas and persistent SQLite path. No credentials belong in Git or browser VITE_* variables. Server binds only loopback; Vite proxies same-origin /api.

## Resume development

Read [checkpoint index](docs/checkpoints/README.md) and [latest regression checkpoint](docs/checkpoints/04-regression-and-resume.md). Commit SHAs, test evidence, limitations and exact next steps are recorded there and in Issue #4/PR #6.

Product scope: [requirements](docs/PRODUCT-REQUIREMENTS.md), [execution plan](docs/EXECUTION-PLAN.md). Proposed firestore.rules have not been deployed; current rules tests are textual checks, not emulator verification.
