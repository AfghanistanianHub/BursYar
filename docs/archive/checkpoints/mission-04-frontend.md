# Mission 04 — Frontend integration verification and acceptance

## Implemented (independent draft PR #33)
- Three-language (English/Farsi/Pashto) responsive RTL/LTR four-step journey navigation.
- Existing authenticated profile/document UI, source review and evidence provenance retained from Missions 01/02.
- Direct AI-free deterministic assessment; quota/provider failure fallback never fabricates a Meta inference.
- Reviewed-catalog source URL shown alongside a verify-current-institution-policy reminder; fictional sample listings visibly unverified.
- Tri-state (met / not_met / unknown) deterministic evaluation, cited source excerpts and conservative next actions. The shared step-four panel receives **only localized next-action text**, never the private profile.
- Previous verdicts invalidated after catalog refresh, scholarship selection, degree change or profile save.
- Automated browser coverage for three languages across 320, 390, 768, 1280 and 1440 pixel viewports, including axe rules and keyboard-reachable controls.

## Verified evidence
- **Exact implementation head:** `b0a8903f37baffd3776f8bb56cb089091f0e8ef0`.
- **GitHub Actions run 169:** https://github.com/AfghanistanianHub/BursYar/actions/runs/41023801642
- **Outcome:** completed / success; all four jobs (verify, emulator, browser, macOS helper) completed successfully.
- The browser test harness uses mocked Google identity and synthetic fixture source records. Neither live Meta inference nor live OAuth has been verified. The automated axe scan does not replace manual assistive-technology testing.
- The CI evidence applies to the exact implementation head above; documentation-only commits after that SHA still need their own exact-head status.

## How to reproduce (without inference fees)
From the root, with Node >=24.12 and npm 11.9:
```sh
npm ci --no-audit --no-fund
npm test
npm run test:evaluation
npm run build
npm run test:emulator
npm run test:browser
```
The emulator and browser suites intentionally use fake accounts/sources and do not require real Meta API calls. Production credentials are not required to run these test suites. Do not paste private student documents into test runs.

## External acceptance gates — NOT completed
1. **Figma Mission 03:** MCP access is blocked by the Figma Starter plan tool-call limit; visual parity with a finalized design has not been established. Reuse the current UI tokens until a design handoff is accessible.
2. **Human language review:** A fluent Farsi and a fluent Pashto reviewer must sign off actual copy, including caveats, right-to-left flow and accessibility labels.
3. **Current official sources:** Curate institution-hosted pages with dates, verified excerpts, deadlines and course-specific policies; pass the reviewed-catalog gates. A URL alone is not proof of issuer authenticity, and unknown must not be promoted to eligible.
4. **Mission 01 security and guardian policy:** Approve provider age/region restrictions, guardian access and privacy boundaries; no Contributor route for private student data.
5. **Live authorized sign-in and human accessibility validation:** With an approved demo identity and proper consent, independently validate Google Sign-In, keyboard navigation, screen reader and real-device behavior. Do not equate mocked auth with real OAuth.
6. **Release authorization:** PR #33 remains Draft. Merge/deploy only after external approvals and a successful CI run for the release commit.

No deployment, merges, paid Meta inference, billing edits, production Firebase rules changes or credential disclosure performed during Mission 04.
