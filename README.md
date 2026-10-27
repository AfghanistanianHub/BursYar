# BursYar — Afghan Scholars Hub

Independent, mobile-first scholarship discovery web MVP for Afghan youth and women. Languages: English, Dari/Persian and Pashto, including RTL.

## Getting started

Requires Node.js 20+:

```bash
npm install
npm run dev
npm test
npm run build
```

This is a **new implementation**. CTO is not required.

## Current scope

- Responsive, localized UI with language switcher
- Client-side demo scholarship catalog, filtering and details
- AI explainer input, currently a deliberately non-functional placeholder
- Smoke tests for filter logic and localization

**All scholarships are explicitly demo-only.** There is no live scholarship catalog, Firebase persistence, live Meta inference, login or deployed app yet.

## Next steps

Integrate Firebase Auth and Firestore under least-privilege rules; ingest verified opportunities via a reviewed source pipeline. Use the isolated Meta model engine work in PR #2 only after server authentication, rate limits and provider tests are complete. Do not commit credentials or expose shared API tokens in the browser.

## Release status

Feature branch, not production. No deploy or billing change has been made.
