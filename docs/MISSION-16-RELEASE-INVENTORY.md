# MISSION 16 — Release inventory (audited 2026-11-03)

Baseline: `main c9eaa04` + Mission 16 stage-4 fix (unmerged at writing).
Production: `https://bursyar.vercel.app` (`index-Cz7AMs0T.js`).
Backend: `https://bursyar-api.onrender.com` (`/health` 200 `ok:true`).

Status key: **Hosted** = verified against production/the hosted API.
**Local** = verified against local code or mocked browser runs.
**Mocked** = demonstrated with fixtures/illustrative UI only.
**Unverified** = exists but not proven in the stated environment.

| # | Capability | Status | Evidence |
|---|---|---|---|
| 1 | Scholarship discovery + research explorer (12 records, search/filter/save/export) | Hosted (read-only flows) | Journey A (M16): live search + labels; `research-browser.mjs` fa/ps; `src/research-data.js` (all 12 `needs_reverification`, zero verified flags) |
| 2 | Source retrieval + explicit approval | Hosted (fetch path); sign-in gate Hosted | Journey A sign-in gate; `test:browser` recovery cases; `docs/URL-FIRST-RECOVERY.md` |
| 3 | Meta Muse Spark 1.3 analysis | Integration Hosted (2 recorded runs, 2026-10-28 / 2026-11-01); NOT continuously verified | `docs/checkpoints/15-live-inference-verified.md` (`d1bb0e0f`), `docs/HOSTED-META.md` (`5a58bff8`); `META-INTEGRATION-EVIDENCE.md` |
| 4 | Evidence quotation validation (exact substring + digests) | Local (deterministic, 60 eval checks) + recorded on 2 hosted runs | `npm run test:evaluation`; `engine/evidence.js` + tests |
| 5 | Source provenance + integrity (receipts, digests, supplied-vs-fetched) | Local | evidence/provenance unit tests; rehearsal recorder flow |
| 6 | MET / NOT MET / UNKNOWN compiler | Local (deterministic) | 60 offline eval checks; `eligibility-demo` tests; browser scenario cases |
| 7 | Barrier PathFinder guidance | Local | pathfinder tests; browser cases; M16 active-path check (fieldset+guidance move into `#next-actions`) |
| 8 | Hypothetical scenarios (isolated, real facts immutable) | Local | scenario tests; `04-eligibility` footage; browser simulate cases |
| 9 | Student profile create/edit + persistence | Hosted (historical, PR #59 demo account); Local (mocked save/reload in CI) | `docs/CURRENT-DEMO.md`; `test:browser` persistence cases; NOT re-verified hosted in M16 (no credentials used) |
| 10 | Academic evidence + document review (TXT/paste, claim review, library, deletion) | Hosted for pasted text (PR #59); native file upload Local only | CURRENT-DEMO boundaries; `document-review-browser.mjs` fa/ps |
| 11 | Google auth + session persistence | Hosted (historical PR #59); Local mocked in CI | Same as 9; Firebase config via env (`src/auth.js`, no hardcoded secrets) |
| 12 | Privacy/consent/data isolation (owner-scoped storage, export/deletion) | Local (tests + mocked flows) | documents/profile/engine tests; consent-gated UI copy |
| 13 | Guardian + age policy (adult caller, under-18 restrictions) | Local (policy-gate tests) | trusted-policy tests; `engine/*guardian*`; majority-transfer idempotency test |
| 14 | Geographic restrictions + provider access (allowlist, Standard-only) | Local (gate tests) | policy-gate tests; adapter config (no fallback model) |
| 15 | Rate limits + spending controls (atomic quota, $50 cap) | Local (reservation tests); $50 cap owner-confirmed, billed $ unknown | quota tests; `docs/checkpoints/10-spending-attestation.md`; non-claim in META-INTEGRATION-EVIDENCE |
| 16 | Offline deterministic assessment (no-AI path) | Local + Hosted UI (page serves offline path) | browser fallback cases; local-workflow tests |
| 17 | Trilingual UI (en/fa/ps + RTL, Persian numerals, local fonts) | Hosted (M15 visual QA 320–1440, zero overflow) | M15 screenshots; typography probe (0 external fonts); M16 key-parity audit (0 missing, 0 untranslated in 6 core tables); all fa/ps UNREVIEWED by humans |
| 18 | Mobile nav + accessibility (keyboard, focus, axe, 44px targets, zero motion) | Local (axe in CI suites) + Hosted screenshots | `test:browser`/research/document axe runs; 44px CSS minimums; no animation/transition in CSS; real-device + AT review NOT performed |
| 19 | Error handling + recovery (blocked pages, timeouts, malformed evidence, consent expiry) | Local | recovery tests; Journey E via suites; upload idempotency NOT implemented (known limitation, CURRENT-DEMO) |
| 20 | Judge entry experience (hero, workflow band, sample-labeled demo, video) | Hosted | M14/M15 delivery docs; canonical MP4 `731016d5` re-recorded from `dbfb054`; M16 stage-4 fix removes the last dead-end action |

## Known limitations (preserved, not fixed in M16)

- Server-side upload idempotency absent: after a lost write response the
  user must inspect the library before resubmitting. A safe fix needs a
  client idempotency key + server dedupe + migration; too risky
  pre-deadline. Workaround documented in CURRENT-DEMO.
- Native file upload hosted-verification outstanding (pasted-text path
  is the hosted-verified one).
- Hosted auth/profile flows last proven in PR #59; M16 re-verified them
  only under mocks (no owner credentials used, by policy).
- Only 2 live Meta runs exist; no reliability/latency/fluency claims.
- fa/ps human review pending (401+401 strings after M16 keys).
- Portal field rules still login-gated (OWNER VERIFICATION REQUIRED).
