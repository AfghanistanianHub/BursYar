# Final mission — Meta credit cost ledger

Mission: BURS​YAR final Meta credit utilization and product completion.
Deadline: 2026-11-04 18:00 America/Vancouver.
Branch: `final/meta-credit-utilization` (from `origin/main`).

## Billing verification status: NOT VERIFIED — paid requests STOPPED

Phase 0 (2026-11-04) established from repository inspection only:

- No `$142.53` or `$142` reference exists anywhere in the repository (zero hits).
  The displayed figure is NOT confirmed as remaining balance. It must come from
  an authorized Meta billing view, which this agent context cannot open.
- No live `.env` file exists; only blank `.env.example` template placeholders.
- No payment methods, invoices, card data, or billing credentials in the repo.
- Repo-known credit/cap model (app-side only, not Meta-account truth):
  - `$150` promotional-credit balance named in `docs/MAC-REBOOT-STARTUP.md`,
    explicitly NOT a spending limit.
  - USD 5 local-era attestation (`docs/checkpoints/10-spending-attestation.md`).
  - USD 50 hosted cap (`docs/HOSTED-META.md`, 2026-11-01 owner activation).
  - Triple-gate `engine/spending.js`: `BURSYAR_SPENDING_CONFIRMED=1` plus
    positive `SPEND_LIMIT_USD` plus valid timestamp, else 503 before quota.
  - Quota units bind request bytes + 4000 completion tokens; never dollars.
  - Adapter records `costUSD:null` by design (`engine/meta.js`).
- Provider pin: `POST https://api.meta.ai/v1/chat/completions`,
  `muse-spark-1.3` Standard only (`engine/provider-policy.js` allowlist also
  admits `muse-spark-1.1/1.2`, `muse-wonder-1.0`; Contributor IDs rejected).
- Upstream 402 maps to `provider_billing` → generic 503, reservation consumed,
  no retry. Rule repeated across runbooks: billed cost only from an authorized
  billing view.

Owner-only items this agent cannot verify (blockers for any paid spend):

1. Actual remaining promotional credit balance, currency, expiration.
2. Promotional-credit applicability to Model API (`api.meta.ai`) calls versus
   other Meta surfaces (including any Muse Code harness usage).
3. Whether any spending limit applies before or after promotional credits.
4. Whether USD 5 / USD 50 hard caps are actually configured in Meta dashboard.
5. Actual billed dollars for recorded live runs `d1bb0e0f`, `5a58bff8`.
6. Payment method on file; guarantee of no out-of-pocket charge.

Per mission Phase 0 step 4, because item 6 cannot be guaranteed from this
context, all paid Meta Model API requests are STOPPED. No billing setting,
spending cap, payment method, or subscription was changed (and none will be).

## Running ledger (new eligible promotional credit consumed)

| Time (UTC) | Workstream | Operation | Verified cost |
|---|---|---|---|
| 2026-11-04 | Phase 0 | Repo/CI/deploy/test inspection, live health probes, 1 unit test file | $0.00 (no Model API calls) |

- Baseline usage: unknown — adapter stores `costUSD:null`; only the Meta
  dashboard can supply billed dollars. No usage-dollar ledger exists in repo.
- Total new credit consumed this mission: **$0.00 verified**.
- Live backend `/health` (2026-11-04): `meta.state=configured`,
  `inferenceVerified=false`, per-request trusted policy record still required.
  No inference was invoked by this mission.

## Policy for the rest of this mission

- Zero paid Model API calls until the owner supplies dashboard evidence for
  items 1–6 above AND explicitly authorizes spend with a USD cap.
- Continue zero-spend value: deterministic eligibility, trilingual quality
  review, responsive UI completion, unit/regression/browser tests, CI, docs.
- If authorization arrives, record every call here with timestamp, workstream,
  model, token counts, and dashboard-verified cost before proceeding further.
