# BursYar — scholarship clarity

English, Dari/Persian and Pashto scholarship reader and bounded Barrier PathFinder for Afghan applicants. No CTO dependency.

## Mission 04 — verified frontend integration checkpoint (Draft PR #33)

The independent frontend branch `feat/mission-04-journey-navigation` integrates English/Farsi/Pashto responsive navigation, authenticated private-profile review, evidence-focused source inspection, deterministic scholarship assessment and conservative next steps. Users can enter the deterministic path directly without Meta or switch to it if AI analysis is unavailable. This does **not** assert a fully reviewed institutional scholarship catalog or verified live inference.

The implementation commit `b0a8903` passed all four GitHub Actions jobs in [run 169](https://github.com/AfghanistanianHub/BursYar/actions/runs/41023801642): verify/build, emulator, Playwright browser tests and macOS helper. Tests use mocked identities and synthetic sources, **not** live Google sign-in or Meta inference.

See [Mission 04 verification and acceptance gates](docs/checkpoints/mission-04-frontend.md). Mission 03 Figma parity, human Farsi/Pashto review, official university-source approval, guardian/privacy sign-off and authorized live OAuth remain outstanding. PR #33 remains Draft; nothing was merged or deployed.

## Historical development status (earlier PR stack)


Draft PR #9 is stacked on draft PR #8. The stack now reconciles main history while preserving the Firebase-authenticated gateway, durable quotas, Keychain configuration and spending gates. Implemented: evidence-selected conservative compiler, deterministic three-valued evaluation, source provenance, contradictory-threshold detection, isolated score/degree scenarios, multilingual UI and private local UTF-8 document review/profile storage.

**Live Meta and human translation review remain unverified.** Document extraction is a bounded text parser, not OCR or issuer verification. The compiler supports two narrow English rule forms; real complex admissions clauses remain unknown. A user-supplied source URL is not authenticated ingestion. No public deployment or production rules changes occurred.

Read [the current demonstration and submission runbook](docs/HACKATHON-DEMO.md) and [mission checkpoint](docs/checkpoints/11-autonomous-mission.md) for executed evidence, limits, recovery and owner gates.

Current provider continuation: branch `fix/meta-truncated-completions`, stacked on the timeout fix, uses low reasoning and a compact strict response schema with the same 4000-token cap. The owner reported a real HTTP 200 / `length` reply; validated end-to-end live analysis remains pending. Read [the diagnosis and single authorized Oxford test](docs/META-TRUNCATION-INVESTIGATION.md).

## Setup and verification

Node >=24.12 required. From repository root:

```bash
npm ci
npm test
npm run build
npm run dev
```

For actual inference, follow [the inference runbook](docs/INFERENCE-RUNBOOK.md): Google sign-in uses public VITE_FIREBASE_* configuration; server uses private Firebase ADC and Meta credentials plus explicit quotas and persistent SQLite path. No credentials belong in Git or browser VITE_* variables. Server binds only loopback; Vite proxies same-origin /api.

## Resume development

Read [checkpoint index](docs/checkpoints/README.md) and [latest regression checkpoint](docs/checkpoints/04-regression-and-resume.md). Commit SHAs, test evidence, limitations and exact next steps are recorded there and in Issue #4/PR #6.

Product scope: [requirements](docs/PRODUCT-REQUIREMENTS.md), [execution plan](docs/EXECUTION-PLAN.md). Proposed firestore.rules have not been deployed; proposed rules are exercised only against isolated emulators; no production deployment is implied.
