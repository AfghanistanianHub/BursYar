# BursYar Mission 44 defect register

Baseline `4e2d50cee3c6566f5f14b7c4b8692b8dfad8f1d3`. Candidate branch `work/restore-approved-ai-studio-hero`.

| Priority | Area | Defect and cause | Correction | Evidence |
| --- | --- | --- | --- | --- |
| P1 | Homepage → Eligibility | The landing page and journey links targeted a wrapper with a closed fictional-example disclosure. Users without an assessment reached the closed wrapper. | Open the example when those links are activated. A compiled assessment continues to render directly. | Baseline form hidden after following PathFinder. Candidate form visible. Three locales exercised in Chromium. |
| P1 | Hero accessibility | Changing languages or rebuilding the homepage mounted a new animation with pause reset to false. | Keep the explicit choice in page state. Resume only when visible, unpaused and permitted by reduced-motion preferences. Recompute SVG geometry when the mobile breakpoint changes. | Chromium keyboard pause and locale round-trip. The baseline restarts motion and the candidate preserves the pause. |
| P2 | Sample scholarship search | Keystrokes rebuilt the homepage and replaced the native search input and unrelated mounted tools. | Keep the input in place and update the result count, list and filter state in the sample explorer. | Chromium confirmed that the baseline detaches the input and the candidate keeps the original focused element. Search, filtering and result detail exercised in three locales. |
| P2 | Dashboard → Verifications | The route used the plural icon key and the icon dictionary used the singular key. The resulting SVG path was invalid. | Match the verification route's icon key. | The baseline emitted an invalid SVG path error in all 30 checks. The candidate production build reported zero console errors in the responsive matrix. Dashboard browser checks passed with synthetic identity. |
| P2 | Hero layout and copy | The desktop SVG reserved 40 unused viewBox units above the illustration. On mobile, wrapped CTA text produced unequal button heights. The caption implied a single conclusive answer. | Trim reserved desktop space above the arc, align mobile button heights, keep the tablet motion control in normal flow, and describe the comparison in all three languages. | Before/after captures at all 10 requested viewports in English, Farsi and Pashto. The arc, emblem and document example remain visible. |
| P2 | Homepage metadata | The protected recovery preview served the old cool-toned theme color and the old language label in its initial metadata. The runtime descriptions also carried the old label. | Use the established cream theme color and the Farsi label in the initial and localized descriptions. | Protected baseline HTTP 200 confirmed the old metadata. Candidate production build and locale regression check cover the revised metadata. |
| P2 | Dependency hygiene | Production dependency audit reported the optional transitive XML parser at an affected version. | Refresh the lockfile within the existing dependency ranges to `fast-xml-parser@5.12.1` and its required compatible dependencies. | Clean install, build, automated tests and repeat audit. The parser advisory cleared. |

## Open work

| Priority | Area | Next action |
| --- | --- | --- |
| P1 | Dependency advisories | Track [the Picomatch advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf). npm listed 4.0.7 as the latest available version in this environment and the advisory includes that version. Avoid npm's suggested Vite downgrade. Evaluate a compatible patched release and rerun the browser/build gates when it becomes available. Six moderate production-tree findings also remain and need package-by-package validation. |
| P1 | Live browser acceptance | With a Vercel-authorized test browser and an approved Google test account, verify sign-in, session persistence, protected redirects, account switching, document ownership and sign-out. Emulator and synthetic browser results track separate coverage. |
| P2 | Product and accessibility QA | Continue route-level checks for all dashboard empty/loading/error states, manual screen-reader checks and fluent Farsi and Pashto review. Compare animation CPU and memory in foreground, offscreen and after repeated navigation. Capture the authenticated routes with synthetic records. |
| P2 | Product development | Use the authenticated QA results to prioritize dashboard navigation and the evidence-to-PathFinder handoff. Continue within the existing design system and the current providers. |

## Implementation log

- Compared the recovery branch and the protected Vercel baseline. Used the baseline commit for reproducible before/after captures.
- Reproduced the animation, search rerender, eligibility disclosure and dashboard SVG defects, then repaired the affected code paths.
- Extended the existing journey regression tests and expanded the production output responsive probe to 10 viewports in each of the three locales. Added the responsive probe to the existing browser workflow.
- Used local fixtures, synthetic identity and Firebase emulators for verification. The mission did not require a paid model call or a pull request. Production merge and deployment require approval.
