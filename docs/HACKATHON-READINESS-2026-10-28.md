# BursYar engineering handoff — 28 October 2026

Current integration tip: draft [PR #17](https://github.com/AfghanistanianHub/BursYar/pull/17), `37c0bf8`, stacked on #16/#15 and retaining the full functional chain. [Final review packet](FINAL-REVIEW-PACKET.md) is the current demonstration, review and integration handoff. Checkpoint 15 records one verified live Meta inference; no additional inference or Keychain access is needed or authorized. No merge, deployment or submission occurred.

## Readiness and evidence

| Phase | Status | Evidence and remaining limit |
|---|---|---|
| 1. Live Meta inference | VERIFIED (single run, 28 Oct 2026 evening) | Owner-supplied matching production-provider events: `muse-spark-1.3`, requestId `d1bb0e0f-caab-4f13-8611-e0c3d592335d`, `meta_response` (`finishReason: stop`) + `analysis_validated` (same requestId), 7,263 ms, 817 prompt / 1,931 completion (1,497 reasoning) / 2,748 total tokens, 4 validated criteria, 2 funding excerpts. `requiresHumanReview=true`, `coverageComplete=false`. One run only: not a latency/cost distribution, semantic-accuracy certification, source-authenticity proof, or translation approval. |
| 2. Scholarship reasoning | IMPLEMENTED; offline tested | Complete submitted source retained with exact offsets and provisional navigation tags. Two exact, URL-scoped Oxford exclusions join the narrow degree/IELTS grammar. Unselected critical candidates remain visible and unsupported ones stay unknown. Coverage is incomplete; user-pasted source is not automatically authenticated. |
| 3. Profile/documents | IMPLEMENTED for local TXT | Authenticated per-user private SQLite store, library, explicit review/correction, consent-based editable declarations, source/claim provenance, bounded edit history and deletion. PDF/image/OCR, cloud storage, issuer integration and translation certification are NOT implemented. |
| 4. Product UX | IMPLEMENTED; automated browser verification passed | Existing green/bronze design retained. Connected profile, document library, evidence chain, exclusion simulation, loading/error/empty states and responsive layouts. Screenshots are explicitly offline rehearsals. |
| 5. Languages | IMPLEMENTED; human review pending | English/Dari/Pashto UI, RTL, canonical IDs and values independent of display language. Automated accessibility/layout checks cannot approve fluency or semantic translations. |
| 6. Gap resolution | IMPLEMENTED conservatively | Exclusion/status/deadline/evidence actions. Oxford scholarship eligibility is separate from course admission. Official Oxford English-policy link only; no universal IELTS threshold, paid referrals, partnerships or endorsements. |
| 7. Security/validation | IMPLEMENTED; bounded regression scope | Authentication/demo claim, revoked-token/project checks, transactional quotas and strict provider/evidence guards retained. Profile/document tests cover ownership, consent, invalid values, provenance promotion and deletion. This is regression evidence, not an exhaustive security certification. |
| 8. Demonstration/submission | PREPARED; not submitted | Rehearsal, architecture and submission text below. Owner must confirm official portal/rules/assets and authorize submission. Live verification is complete. Public deployment needs separate approval. |

Original six-phase mission: stabilization/security validation are phase 7 here; reasoning phase 2; documents phase 3; gap resolution phase 6; multilingual UX phases 4–5; hackathon delivery phase 8. Phase 1 now records one verified live inference; no other status label asserts live success.

## What changed

The four-item Meta response is a compact semantic interpretation, not the entire source. `source-inventory.js` now preserves every submitted character plus exact sentence/line offsets. Heuristic categories distinguish mandatory candidates, exclusions, preferences, deadlines, funding and unknown text; they are not trusted semantic classifications. Unselected critical candidates become conservative unresolved rules, so they are not silently discarded by the display cap. The original full text remains available in the normalized result; the visible inventory lists its pieces.

Two exact Oxford exclusions use a curated mapping checked against the official applicant page on 28 October 2026. They concern deferred graduate offers and continuing the same Oxford degree. The URL and complete sentence must match. A conflicting or exceptional statement about the same subject makes the exclusion unresolved. These mappings evaluate supplied booleans only; “not reported” meets that one exclusion check and never establishes overall scholarship eligibility. Missing or pending facts remain unknown. Funding and selection preferences are displayed without inventing hard thresholds.

Profile edits are declarations with explicit consent, never issuer verification. Existing protected issuer fields cannot be changed by manual edits or document corrections. Educational history, languages, intended level, application status and reported dates can be saved; date expiry produces guidance, not an admissions verdict. Document extraction supports only bounded labeled UTF-8 text. Pending claims do not affect the profile. The document library reopens reviewed sources without inviting repeated approval. Deleting a document removes linked current facts and prior-fact references; deleting a profile clears profile history but explicitly leaves separately uploaded source documents. Owner backups and SQLite/file-system forensic erasure are outside this promise.

## Architecture and Meta's technical contribution

```text
Public scholarship text + official URL
  → authenticated loopback gateway + unchanged spending confirmation/quota reservation
  → pinned actual Meta endpoint, muse-spark-1.3, low reasoning, strict compact JSON schema
  → finish_reason=stop + shape/refusal/size checks
  → exact-source excerpts + source digest validation
  → conservative compiler + retained source-condition inventory
  → deterministic three-valued evaluator + explicit fact provenance
  → independent immutable counterfactual → same canonical results in three languages

Authenticated private document/profile API
  → local private SQLite → pending labeled claims → explicit human approval
  → unverified document facts / user declarations → evaluator
  (No document, profile, reference score or expected answer enters the Meta request.)
```

Meta interprets varied admissions prose, selects relevant evidence and proposes concise explanations across three languages. BursYar independently checks output structure, excerpts, provenance, supported grammar, contradictions and fact comparisons. The current deterministic layer covers a deliberately small subset; it cannot replace Meta's broader semantic work, nor can model fluency establish truth. Raw reasoning is neither requested nor logged. There is no fallback provider and no automatic paid retry.

The adapter and safety strategy remain those in PR #11: 4000 shared reasoning/visible completion tokens, 60-second default bounded timeout, low reasoning and strict schema. Safe metadata is captured before rejecting truncation. The earlier 426-byte response does not reveal how many tokens were reasoning; without returned usage the split remains unknown. Source inventory and profile changes do not increase token limits or send private data to the provider.

Official references: [Meta chat protocol](https://dev.meta.ai/docs/protocols/chat-completions), [reasoning](https://dev.meta.ai/docs/reasoning), [structured output](https://dev.meta.ai/docs/structured-output), [Oxford Clarendon applicants](https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants), [Oxford English guidance](https://www.ox.ac.uk/admissions/graduate/application-guide/qualifications-experience-languages-funding/english-language-proficiency). A policy link is not a claim that the pasted text is current, complete or verified.

## Live inference milestone — 28 October 2026 (evening)

A single owner-authorized live inference succeeded with full downstream validation. Matching production-provider events: `muse-spark-1.3`, requestId `d1bb0e0f-caab-4f13-8611-e0c3d592335d`, `meta_response` (`finishReason: stop`) + `analysis_validated` (same requestId), 7,263 ms elapsed, 817 prompt / 1,931 completion (1,497 reasoning) / 2,748 total tokens, 4 validated criteria, 2 funding excerpts. Only safe diagnostic metadata is preserved; no credentials, prompts, raw outputs, or personal data were stored. `requiresHumanReview=true` and `coverageComplete=false`, so this proves the live pipeline end to end but does not certify semantics, coverage, source authenticity, or translations. No further paid inference is authorized. Full record: `docs/checkpoints/15-live-inference-verified.md`.

## Reproducible offline evaluation

From this checkout with Node >=24.12, npm 11.9 and Java 21:

```sh
npm ci --no-audit --no-fund
npm test
npm run build
npm run test:evaluation
npm run test:emulator
npx playwright install chromium
npm run test:browser
```

These are maintainer reproduction instructions, not additional owner troubleshooting steps. Browser automation uses mocked identity/provider and real local document/profile APIs; it never calls Meta. Firebase tests use `demo-bursyar`, not production. Native-helper CI uses synthetic attestation data and the missing-item path without reading the owner's Keychain. No evaluation expected answers or reference scores are sent to a model.

Node checks include timeout/cancellation/slow-body, malformed/truncated output, exact evidence, quota preservation, auth and new policy/profile cases. Evaluation adds eight synthetic Oxford policy scenarios in each language to the three prior excerpt fixtures: 33 assertions total. This tests deterministic invariance and conservative handling; it does not measure live model semantic accuracy. CI browser coverage includes 15 language/viewport cases (320/390/768/1280/1440), plus the full profile/document/Oxford scenario at 390 in each language and WCAG-tagged axe scans. Test numbers and final CI URLs are recorded in the final engineering report.

## Four-minute rehearsal

Use `verification/fixtures/synthetic-education.txt` only. The automated browser screenshots include an OFFLINE REHEARSAL banner. Never present them as real Meta or Google-sign-in proof.

1. Show the existing BursYar design at mobile width. Explain that source text is public scholarship evidence; personal profile/documents stay local. Switch English → Dari → Pashto and show RTL.
2. Save a synthetic academic history, declared languages and application status with consent. Upload the synthetic TXT, inspect each extracted source line, correct or reject a claim, then explicitly approve. Explain the distinction between pending, reviewed and issuer-verified. No issuer integration exists.
3. Show the Oxford analysis obtained under owner authorization on 28 October 2026 (requestId `d1bb0e0f-caab-4f13-8611-e0c3d592335d`, `finishReason: stop`, same-requestId validation). Do not click Analyze again without fresh explicit paid authorization. Inspect original quote, provisional interpretation, retained unselected conditions and source digest. Label the semantics as awaiting human review (`requiresHumanReview=true`).
4. Set deferred offer to Yes and continuing same degree to No. The mapped exclusion is not met. Apply a hypothetical removal: only that exclusion changes; unsupported deadline/selection conditions remain unknown. Show that saved actual status remains Yes. A “met” result concerns enumerated rules only, never an award.
5. Show actionable next steps: confirm status with funding office, use the specific course funding deadline, verify actual accepted English tests/waivers through admissions. Do not book a test based solely on this analysis.
6. Switch languages again, preserving canonical results. Delete the synthetic document; its linked facts disappear. Explain the known limits: incomplete semantic coverage (`coverageComplete=false`), source authenticity, human translation review, TXT only, and single-run live evidence (see milestone).

## Minimal remaining owner actions

1.–2. DONE 28 October 2026 evening: the owner supplied the matching `meta_response` (`finishReason: stop`, `muse-spark-1.3`) and `analysis_validated` records with requestId `d1bb0e0f-caab-4f13-8611-e0c3d592335d` and token counters (817 / 1,931 / 2,748). The single authorized Oxford inference succeeded within the existing cap; actual billed dollars remain unknown unless supplied by an authorized account view. No further paid inference without fresh explicit owner authorization.
3. Arrange fluent Dari/Pashto review using `TRANSLATION-REVIEW.json`; supply specific output/source digests and reviewer approval. Confirm the official hackathon portal, deadline/timezone, entry eligibility, required video and asset format; approve and submit the prepared materials. Merges and public deployment remain owner decisions.

## Submission description draft

BursYar helps students inspect scholarship requirements in English, Dari and Pashto. Meta Muse Spark proposes compact source-grounded interpretations; BursYar validates exact excerpts and evaluates a narrow set of supported rules deterministically. The demonstration exposes missing evidence and uncertainty, preserves private user-approved educational facts, and compares hypothetical eligibility changes without editing actual facts. The current prototype is local, supports labeled text documents and does not certify authenticity or guarantee admission. Live evidence: one owner-authorized `muse-spark-1.3` inference on 28 October 2026 (`finishReason: stop`, same-requestId `analysis_validated`, 4 validated criteria; `requiresHumanReview=true`, `coverageComplete=false`; human semantic review still pending). Never label mock results as live integration.

## Recovery and integration

Current observed stack: #8 → #9 → #10; #11 is already merged into #10 (not into main); #12 remains based on the preserved #11 branch, followed by #13 → #14 → #15 → #16 → #17. All open PRs were mergeable when inspected. Do not merge #11 again. The current #10 merge commit `ab56e02` is not an ancestor of #17, but its tree equals its parent `4fcc73e`; the complete truncation fix is already an ancestor of #17. This ancestry distinction is documented rather than rewritten. See FINAL-REVIEW-PACKET.md for the owner-authorized integration procedure.

Do not merge, retarget integration branches, deploy, access Keychain, repeat inference or submit as part of this handoff. Preserve quota records, credentials, private databases and production settings.
