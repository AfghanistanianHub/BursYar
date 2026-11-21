# BursYar final review and demonstration packet

Current verified integration: PR #17 at `37c0bf850ee843a92a8a73f33878f99bc8a854dc`, stacked on PR #16 (`df351be`). This packet supersedes older demo/setup and live-inference blockers. No additional paid request, Keychain access, credential change, merge, deployment or submission is part of this work.

## Completed live milestone

[Checkpoint 15](checkpoints/15-live-inference-verified.md) preserves owner-supplied matching production-provider events:

| Field | Verified record |
|---|---|
| Model | `muse-spark-1.3` |
| Request ID | `d1bb0e0f-caab-4f13-8611-e0c3d592335d` |
| Provider completion | `meta_response`, `finishReason=stop` |
| Downstream validation | `analysis_validated`, same request ID |
| Latency | 7,263 ms |
| Tokens | 817 prompt + 1,931 completion = 2,748 total; 1,497 reasoning included in completion |
| Validated output | 4 criteria, 2 funding excerpts |
| Remaining flags | `requiresHumanReview=true`; `coverageComplete=false` |

This is one successful live run with downstream validation, not a semantic/translation approval or reliability distribution. Billed dollars are unknown. Raw source and output are not in the checkpoint; their digests must not be invented from diagnostic metadata. The agent's Keychain environment is irrelevant to this completed milestone. All previous unspent test approvals are superseded: do not repeat inference without fresh explicit approval.

## Evidence and multilingual QA

[CI 40806852485](https://github.com/AfghanistanianHub/BursYar/actions/runs/40806852485) passed verify, browser, emulator and macOS-helper jobs at `37c0bf8`. Runtime code is unchanged from #16. Evidence: 129 Node tests, 33 evaluation assertions, 47 Firebase Emulator checks, production build, native helper checks, and 15 English/Dari/Pashto × 320/390/768/1280/1440 browser cases. Browser cases include source-preview/recovery, saved HTML/TXT, pending-request approval, profile/documents, language-state retention, RTL and accessibility scans. Recorded axe violations and horizontal overflows: zero. Browser identity/provider are fixtures, not new live-provider proof.

A fresh static copy-parity check found 15 recovery keys and 32 general-interface keys per language, all nonempty and matching. Existing source/provenance/approval behavior was reviewed; no additional visual change was justified. Automated QA does not approve fluency or entailment. Keep the existing minimal URL/action layout and progressive evidence details.

The bounded #16 security diff review completed with all 11 source inventory items reviewed and no reportable findings. #17 changes only documentation; this packet changes no runtime controls. The review is not exhaustive security certification.

## Semantic review handoff — no inference required

Use the already generated public scholarship output from the owner's successful session. Review locally; do not upload educational documents or credentials. If that output/source is not retained, leave review pending rather than reconstructing a supposed real result from a fixture or asking for another model run.

1. Identify the exact source URL, source bytes/text and saved normalized output from that run. Record the actual source SHA-256 (matching the result) and SHA-256 of the exact saved output bytes. Record the runtime head if known; otherwise leave it unknown. The checkpoint commit records evidence, not necessarily the executing runtime revision.
2. For each of the four criteria, compare its exact quotation and every English/Dari/Pashto explanation. Check obligation versus preference; negation; exceptions; study mode; nationality/course/year scope; and qualifications versus documentary evidence. Mark pass, correction required or unresolved with source location and reason.
3. Review both funding excerpts, distinguishing course fees from stipend conditions and historical amounts. Review deadline wording separately; a course-specific December/January deadline is not a universal date.
4. Review the entire retained source, including conditions omitted from compact output. Identify unsupported clauses and missing official course evidence. Do not change `coverageComplete=false` merely because four quotations are valid.
5. Compare the actual profile/scenario evidence used in the demo. A hypothetical result must leave real facts unchanged. Scholarship eligibility does not establish course admission or award selection.
6. A fluent reviewer records identity, language competence, time, exact source/output digests, scope, corrections and decision in a private copy of [review record template](SEMANTIC-REVIEW-TEMPLATE.json). Keep reviewer contact details and raw outputs out of public Git unless deliberately authorized. Record only approved public review metadata in `TRANSLATION-REVIEW.json`; its status remains pending now.

The template is blank preparation, not evidence of completed human review. Review source-provenance, missing-evidence, consent/deletion and blocked-page recovery wording as well as criterion translations. Preserve original source quotations untranslated and visibly distinct.

## Four-minute demonstration — use evidence already available

| Time | Shot and narration |
|---|---|
| 0:00–0:35 | Show one URL field. Use the official Bristol Think Big page for genuine URL-first retrieval, or a clearly dated capture of the previously successful retrieval. Identify the original URL and preview. A capture is not a fresh request. Never imply Bristol is Oxford or apply Oxford exclusions to it. |
| 0:35–1:15 | Show the owner's existing Oxford live result or its matching safe diagnostic record. Say: “One real Meta request completed and passed source-evidence validation: four selected criteria and two funding excerpts. Human semantic review and complete policy coverage are still pending.” If only metadata is available, show only metadata; use a separately labeled offline screen for the illustrative UI. Do not click Analyze again. |
| 1:15–2:00 | Use the synthetic Afghan applicant and `verification/fixtures/synthetic-education.txt`. Show consent, pending claims, exact source lines, review/correction and unverified provenance. These documents are local and not sent to Meta. |
| 2:00–2:40 | Show conservative MET/NOT MET/UNKNOWN, missing evidence and practical actions. Missing language certification is not weak English. Course acceptance and deadlines need their own official evidence. A deterministic Oxford exclusion example must be labeled offline if it is not part of the saved real result. |
| 2:40–3:10 | Explore an isolated hypothetical qualification or exclusion change. Show exactly which supported result changes and which remains unknown. Do not attach a synthetic positive threshold to the Bristol source. |
| 3:10–3:40 | Show central Oxford's honest blocked-page recovery: original URL retained; paste primary action; official browser and saved HTML/TXT secondary. The central page was blocked; no protection bypass is needed. Supplied material stays labeled supplied. |
| 3:40–4:00 | Switch English/Dari/Pashto and show RTL, retained canonical state and source quotations. Close with pending human review, incomplete coverage, TXT-only educational ingestion and absence of issuer verification. |

The actual secure fetcher previously retrieved these public official pages: Oxford Law Clarendon, Oxford English funding, Oxford Humanities `node/62406`, and Bristol Think Big. The central Oxford Clarendon applicants URL returned 403/challenge and was rejected. Exact URLs, digests, timestamps and narrower content scopes are in [URL recovery evidence](URL-FIRST-RECOVERY.md) and `verification/source-evidence/`. Offline browser screenshots retain their rehearsal banner. A real provider milestone does not convert those screenshots into live evidence.

## Architecture and submission claims

URL fetch or supplied HTML/TXT → authenticated bounded source preview/provenance → explicit approval → existing Meta adapter with quotas/spending guards → exact-source evidence validation → conservative compiler → consented profile comparison → missing evidence/practical steps → separate hypothetical scenario. All three source paths use the same analysis implementation. Public-source imports remain separate from private educational-document storage.

Submission factual summary: BursYar connects scholarship evidence to a consent-based student profile and conservative planning in English, Dari and Pashto. It provides secure URL-first retrieval and truthful recovery when access is refused. One owner-authorized Meta run completed with matching downstream validation. The prototype exposes missing evidence and incomplete coverage; it does not certify credentials, translations, eligibility completeness or admission outcomes. PDF/image educational ingestion and issuer integration remain future work.

No hackathon portal, official rules, definitive deadline/timezone, entry eligibility or required video/asset format was supplied. The four-minute plan is a prepared asset, not a claim of organizer compliance or a filed submission.

## Integration snapshot and owner-authorized procedure

Inspected open PRs #8, #9, #10 and #12–#17 are drafts and mergeable against their current bases. #11 is already merged into #10; do not merge it again. `ab56e02` (current #10 merge commit) is not an ancestor of #17, but its tree equals `4fcc73e`, which is an ancestor of #17. The truncation fix is preserved; no content conflict is implied by this metadata-only ancestry distinction.

On explicit merge approval: review #8 into main, then #9, then #10; reconcile/retarget #12 from the preserved #11 branch to the approved integration result; then #13 → #14 → #15 → #16 → #17 → this documentation follow-up. Inspect each diff after retargeting and rerun CI on the resulting integration head. The current snapshot is not a guarantee that later retargets will remain conflict-free. Do not automatically close PRs or rewrite branches to make the stack appear flatter.

Outstanding human decisions are semantic/translation approval and official hackathon details. Merge, deployment and submission each need explicit owner authorization. No further paid request is needed for the completed milestone.
