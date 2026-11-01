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
- Owner-confirmed account spending cap (USD 5), confirmation timestamp and reviewed
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
maximum completion tokens. At USD0.00000425 per unit, one million lifetime units
conservatively bound this gateway's text-token requests to USD4.25 at those
reviewed rates, below the USD5 app cap. This excludes other tools/accounts/API
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
