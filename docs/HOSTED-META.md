# Hosted Meta activation

This release adds durable quotas on the existing BursYar Supabase project.
It does not itself create a Meta key, fabricate policy verification records or
run inference. Existing Firebase/demo, origin, adult, region and consent gates
remain enforced before quota reservations and model calls.

## Durable reservations

Apply `database/durable-quota.sql` once to the intended project. Two private RLS
tables and two service_role-only SECURITY INVOKER RPCs register provider limits
and atomically reserve user-minute, user-day, global-day and lifetime units.
Reservations lock the provider budget row and use the database clock. Exhaustion
returns false before any counter changes. Failures after a committed reservation
consume it; there are no automatic retries/refunds. Limits are immutable through
the app: changing configuration does not reset or raise an existing budget.

Set `BURSYAR_QUOTA_STORAGE=supabase` and leave `BURSYAR_QUOTA_DB` unset. The
existing server-only document Supabase URL/key are reused. Startup must register
exactly matching limits successfully; otherwise inference startup fails. Local
SQLite remains the default. The gateway awaits asynchronous reserve completion
before calling the model, including rejected promises.

## Server-only hosted settings

`BURSYAR_PROVIDER_JSON` is an optional bounded JSON alternative to the owner-only
provider file. `BURSYAR_POLICY_RECORDS_JSON` is the equivalent for trusted records.
Each is mutually exclusive with its file setting. Neither belongs in VITE_* or
a repository. Environment updates require a process restart; file records keep
the existing read-on-every-request behavior. No browser endpoint writes records.
A verified policy record still expires in at most 24 hours and cannot use an
unverified location, unknown age, expired consent or restricted jurisdiction.

## Activation prerequisites

- Existing `META_API_KEY` in Render's secret environment, never a repository/chat.
- Exact `muse-spark-1.3` Standard model; no Contributor or fallback adapter.
- Owner-confirmed account spending cap (now USD 50), confirmation timestamp and reviewed
  conservative provider cost bound. Do not infer a spending cap from credits.
- Genuine fresh adult/subject/region/consent evidence bound to the approved
  Firebase UID. Do not manufacture `ageVerified` or `locationVerified` flags from
  browser input or assume citizenship proves current permitted location.
- Reviewed provider configuration, short validity, restricted allowlist and the
  durable limits. No family-grants deployment may enable Meta/Gemini.
- One separately authorized manual public-source test; automated tests never
  call Meta. A configured adapter is not proof of successful live inference.

## Reviewed pricing and terms — 2026-11-01

Official pricing lists Muse Spark Standard input USD1.25 and output USD4.25 per
million tokens. Existing reservation units bound full request UTF-8 bytes plus
maximum completion tokens. At USD0.00000425 per unit, ten million lifetime units
conservatively bound this gateway's text-token requests to USD42.50 at those
reviewed rates, below the owner-approved USD50 app cap. This excludes other tools/accounts/API
keys; retain the independent account cap and re-review pricing before renewal.
No web-search/image/voice tools are used. Standard content is not used to train
Meta models; this is not a claim of zero retention or institutional endorsement.

Sources: https://dev.meta.ai/docs/pricing-rate-limits ;
https://dev.meta.ai/legal/terms-of-service ;
https://dev.meta.ai/legal/geographic-use-policy .

## Verification

293 Node tests, 51 offline evaluation assertions and production build passed.
Independent review found no actionable issues. Actual SQL rollback tests passed
for immutable budget registration, per-user/global/lifetime caps, exact lifetime
boundary, unchanged usage on denial and denied client privileges. The advisor
reported no findings on the new quota objects. No real usage budget was left by
these synthetic SQL checks and no provider was invoked.


## Live activation — 2026-11-01

The owner confirmed Canadian use, creation of a dedicated `BursYar-Hosted`
Meta key, secure Render provisioning, one public-source test, and an increased
USD50 cap. The generated key and approved-account policy record are server-only;
no key or Firebase UID is included here. The account-bound adult Canadian demo
record expires after approximately 24 hours. Other/unverified accounts remain
denied; no family or restricted-region access was enabled.

The reviewed lifetime budget was administratively raised from 1,000,000 to
10,000,000 units with an exact-old-limits guard and without resetting usage.
Per-user/global daily caps remain unchanged. Render's effective provider/spend
settings were updated through its configuration API to match the database.

Backend `4e272a74e65df5ccf2318f3adac312196f5db443` was LIVE in Render deployment
`dep-dbjooe0u01pc7383tj2g` when the activation check below ran. The current
live backend build is `3e7432a0a670d884135b970bfe97c9e521e8610c` (confirmed via
`/health` `capabilities.build.commit`; see HOSTED-BACKEND.md). The successful
inference evidence below is pinned to the `4e272a7` build, not re-run on
`3e7432a`; no backend inference-path code changed between them (server boot
log + capabilities reporting only). One real Firebase-authenticated Muse Spark 1.3
Standard request passed the evidence validator: request ID
`5a58bff8-0885-42c3-a707-60ce1fe4a8e9`, elapsed 3480 ms, one criterion and one
funding excerpt. The public Oxford Clarendon source was manually excerpted after
the server fetch declined robots access; provenance correctly remains manually
supplied and unverified, not server-fetched or issuer-authenticated.

English/Farsi/Pashto UI switching preserved the result without another request.
The actual durable database recorded one global request and 6089 reserved units.
Reserved units are not actual billed dollars. No retry, private student data,
profile or document was sent. Output remains partial and human-unreviewed;
success is integration evidence, not a scholarship eligibility or fluency claim.
All four CI jobs on the implementation, including the migrated macOS15 job,
completed successfully. Live document file-upload UI verification remains a
separate unfinished check.
