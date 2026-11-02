# BursYar — Meta integration evidence (submission)

Model `muse-spark-1.3` (Standard access) via
`POST api.meta.ai/v1/chat/completions`: text-only input, low
reasoning effort, strict `json_schema bursyar_evidence_v1`.

## Recorded runs (metadata only — raw outputs intentionally unretained)

| Run | Request ID | Criteria | Funding | Proof |
|---|---|---|---|---|
| Local, 2026-10-28 | `d1bb0e0f-caab-4f13-8611-e0c3d592335d` | 4 validated | 2 validated | `meta_response` + `analysis_validated`, same ID; 7,263 ms; 2,748 tokens |
| Hosted, 2026-11-01 | `5a58bff8-0885-42c3-a707-60ce1fe4a8e9` | 1 validated | 1 validated | Firebase-authenticated; 3,480 ms; 6,089 units reserved |

Records: `docs/checkpoints/15-live-inference-verified.md`,
`docs/HOSTED-META.md`. Both runs carry `requiresHumanReview=true`
and `coverageComplete=false`.

## Why the model matters

Free-text scholarship pages vary unpredictably; only semantic
interpretation can select relevant evidence, flag uncertain
obligations, and draft provisional trilingual explanations across
them. Deterministic code then confines every model claim: exact
quotes, digests, supported syntax, contradictions, provenance.

## Spending controls (verified, not claims)

Owner-confirmed $50 account cap; 10M-unit lifetime budget bounding
gateway requests to $42.50 at reviewed rates ($1.25/$4.25 per M
tokens, 2026-11-01); atomic reservations; no retries/refunds;
spending gates intact. Billed dollars unknown; no cost distribution
claimed.

## Explicit non-claims

Two runs prove integration, not reliability, latency, fluency, or
translation accuracy. No additional live calls were made for this
submission; the demo video labels its illustrative UI as simulated.
