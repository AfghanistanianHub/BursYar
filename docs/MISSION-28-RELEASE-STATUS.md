# Mission 28 release candidate

This is a review candidate, not a production release. No pull request, branch
push, remote CI run, hosting build, credential or project-setting change was
initiated by this mission.

## Integration

The existing local-PDF-runtime, PathFinder-priority and verified-discovery
branches merge without conflicts against main 9720b4a. Their source heads are
165377278c37796ee9608425fd5117fc1a275217,
9194c55d21ea0d81781f4760ed810a766cda16d9 and
82e45996a96178ce2d25c62624706311ba86be12 respectively.

The integrated review object is 9667ae6a868cce55023bbf463135c887da1bd14d.
It has no branch ref and does not represent a merge into main.

## Additional scoped fix

Image extraction now inspects bounded PNG/JPEG structure and canvas dimensions
before calling the native image decoder or OCR. It retains the post-decode
dimension check, cleanup, timeout and production binary prohibition. Supported
experimental inputs are static PNG and 8-bit baseline/extended/progressive JPEG.
APNG, multiple frames, DNL, hierarchical/lossless/arithmetic JPEG and trailing
representations are rejected. This is deliberately narrower experimental input
compatibility than the previous magic-byte check.

Independent read-only review found no concrete dimension-preflight bypass.
This is not full image validation or a decoder sandbox. Real OCR decoder
agreement, compressed-stream/metadata handling, hard worker/memory isolation,
EXIF orientation and broader image fixtures remain release gates. Production
PDF/image uploads remain disabled. No authenticity claim is introduced.

## Verification in the cloud workspace

- 409 Node tests passed, zero failed/skipped.
- 60 offline evaluation cases passed; interpretations are mocked, not model accuracy evidence.
- Vite production build passed.
- Native Chromium PNG, baseline JPEG and progressive JPEG decoded successfully.
  Oversized PNG/JPEG declarations reached neither decoder nor mocked OCR.
  No external requests were made; actual OCR was not tested by this check.
- Local PDF browser checks passed for eng/fas/pus, signature/page limits and
  zero external requests.
- Built-production browser gate passed: PDF/image rejection with zero writes,
  TXT accepted, no vendor-code requests or boot CSP violations. Identity is
  synthetic in this test; this is not a live authentication check.
- Discovery browser checks passed in en/fa/ps: search, save/reload/export/clear,
  strict filters, mobile layout and axe accessibility, with zero POST requests.
- Remote CI, Firebase emulator and macOS jobs were not run for this candidate.

## Release blockers

The prior PR check list identifies Vercel Agent Review as the Vercel integration,
not a repository workflow. Existing Git deployment exclusions do not establish
an exemption from paid Agent reviews. Official CodeReview documentation states
reviews incur agent and model usage. Draft skipping is configurable; the actual
effective choice could not be read through the available project/team APIs and
the dashboard requires sign-in. Therefore no draft PR was used as a presumed
free workaround.

Public-repository standard GitHub Actions compute is free, but artifact/cache
storage has separate allowances. Existing CI uploads browser artifacts; free
remaining storage and hosting build capacity were not confirmed. Render compute
is on the free plan, while its remaining included build allowance is unconfirmed.

An authorized release requires confirmation of nonbillable review, CI storage
and frontend build capacity, plus explicit owner approval before any change to
the automatic paid review integration. Preserve independent code review and all
existing CI jobs. Do not disable checks or assume draft PRs avoid billing.

Production metadata remains frontend 9720b4a (Vercel READY), backend 4e272a7
(Render live). This candidate is not deployed.

## Dependency advisories

Six moderate production dependency findings remain (zero high/critical): glob
GHSA-3g3m-2fjr-6pw4 and minimatch GHSA-g3hv-75wg-m249, with transitive findings
in rimraf, gaxios, gcp-metadata and google-gax. A separate non-force lockfile-only
audit-fix trial changed no versions and cleared none. No forced major override
was applied. Lack of direct app glob/rimraf calls is not proof of non-exploitability.

References: https://vercel.com/docs/agent/code-review ;
https://vercel.com/docs/agent/pricing ;
https://docs.github.com/en/billing/concepts/product-billing/github-actions
