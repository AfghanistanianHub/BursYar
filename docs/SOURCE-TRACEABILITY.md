# Scholarship source traceability

Status: **seed ledger, all records `needs_reverification`**. No record below
asserts authenticity, current validity, deadlines, amounts, partnerships, or
availability. Every record must be bound by a human reviewer to a dated
capture before any release or submission claim.

## Ledger

Machine-readable seed: [data/scholarship-sources.json](../data/scholarship-sources.json)
(`schemaVersion: 1`).

Each record carries:

| Field | Meaning |
|---|---|
| `id` | Stable ledger key |
| `sourceUrl` | Official page URL the excerpt was attributed to |
| `method` | How the excerpt was obtained (`server_fetch_live_unpaid`, `official_page_review`, `official_snippets_only`, `excerpt_from_prior_review`) |
| `capturedOn` | ISO date of capture, or `null` when unknown |
| `coverage` | What was retained (always a limited excerpt, never a full policy snapshot) |
| `excerpts` | Pinned excerpt texts with SHA-256 digests (only where a digest is already on record) |
| `retrievalEvidence` | Pointer to in-repo evidence (fetch ledger or fixture header) |
| `status` | `needs_reverification` until reviewed |
| `verifiedBy` | Reviewer identity + date, or `null` |

## Ground rules

1. URL/domain matching alone never establishes provenance. See
   `engine/source-provenance.js` (`sourceAuthenticity: 'unverified'`).
2. Excerpts bind to output only by exact-substring match (`engine/evidence.js`);
   a paraphrase is not evidence.
3. Full source text is always retained alongside compact selections
   (`engine/source-inventory.js`: `completeSourceRetained: true`,
   `semanticCoverageComplete: false`).
4. Freshness is checked per analysis (`capturedOn`/`checkedOn`/`maxAgeDays`;
   stale sources fail closed as `source_outdated`).
5. Records covering blocked fetches (e.g. central Oxford Clarendon 403) stay
   labeled with the block; a block is never silently replaced by a snippet.

## Reviewer binding procedure

1. Re-fetch the `sourceUrl` (or open a dated capture) and confirm the excerpt
   text is still present verbatim.
2. Record capture date, method, source SHA-256, and excerpt digest.
3. Set `status` to `reviewed` with `verifiedBy: "<name>, <date>"`, or file
   corrections / mark `contradicted`.
4. Never approve from diagnostic metadata alone; see
   [REVIEWER-CHECKLIST.md](REVIEWER-CHECKLIST.md).
