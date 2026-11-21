# CTO research reuse

The public research library is mounted in Resources, above the existing illustrative demo catalog. It imports 12 discovery references from the owner-supplied CTO export. Titles/providers and recorded dates are historical metadata, not current official-source verification. Titles remain English and carry `lang=en` / `dir=ltr`; UI and country/degree labels support en/fa/ps. New fa/ps wording is UNREVIEWED pending fluent human review.

## Trust boundary

`src/research-data.js` is not connected to `engine/default-catalog.js`, `/api/evaluate`, profile data, document data, or Meta. Every imported record is marked `needs_reverification`; fee and English verification flags are false regardless of legacy booleans. No ranking score, acceptance prediction, automatic exclusion based on missing certificates, or language-test recommendation is imported. Strict fee/IELTS filters exclude unknowns. A valid past recorded date is identified using the current UTC day, independent of legacy status. A future date does not establish an open application window.

The source was the uploaded `shared-files-2824f992-16f0-48d1-8fb7-431a74ecc031.zip`, member `scholarship-app/verified-scholarships.json`.

Source JSON SHA-256: `129b980add09cd952cabf9c60744a4a86cfeab5bef35058914b033c0b67e6ab0`.

Imported fields: id, title, provider, hostCountry→country, degreeLevels→degrees, sourceUrl, lastVerifiedAt→lastCheckedAt, deadline. Eligibility notes, funding claims, afghanFriendly scores, fees, IELTS claims and legacy open/closed status are deliberately not promoted into current verified facts. Record IDs are preserved for later source rechecks.

## Storage and offline reading

Only known public IDs are stored under `bursyar:research-saved:v1`. Search terms and applicant data are not stored by this feature. Corrupt/blocked storage fails safely; a failed write produces a visible warning and leaves current selections usable for export. Clear removes saved IDs. Download exports an explicit whitelist of public metadata with `needs_reverification`; it cannot include profile or document fields. JSON downloads are an offline reference, not an offline app/PWA. No CTO service worker or navigation caching was imported.

## Integration

This branch is stacked on PR #37 (`feat/frontend-multilingual-completion`, base `51de12631ec242cc07b41c9bc25f8af655bc2498`) so its shell localization is preserved. It leaves the backend and matching/security PRs #36/#38 untouched. Integrate #37 first or retarget/cherry-pick after equivalent frontend changes land. This PR does not publish or deploy.

## Validation

- Node suite: 247 passed, including seven public research tests.
- Production build passed.
- Offline evaluation: 51 checks passed; no live Meta accuracy claim.
- Focused Playwright research journey: en/fa/ps at mobile width, search/save/reload/export/clear, strict filters, language switching and axe; no API POST requests.
- Independent code review found no actionable findings.
- Local emulator run is blocked by installed Java 17; firebase-tools requires Java 21. CI already provisions Java 21.
- Full existing browser suite and GitHub CI status must be checked separately; do not infer them from the focused research checks.

No current scholarship source was independently reverified in this change. No paid inference, billing change, merge or deployment occurred.
