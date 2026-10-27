# BursYar — time-boxed implementation plan
Target demo: hackathon submission window early November 2026. Confirm exact deadline on official portal.

## Phase 0 — Verification (blocking)
- Inspect PR #2 AI engine and PR #3 frontend; keep draft until audited.
- Check GitHub Action runs and Render static site health; ensure Render billing plan.
- Verify Meta API exact model ID, access, free credit, limits, request/response and secret handling.
- Verify Firebase project, existing collections/rules and whether an isolated test environment is possible.

## Phase 1 — end-to-end demonstration
- Design typed analysis schema with source excerpt/reference attached to each criterion.
- Implement secure backend API: model adapter, JSON/schema validation, input length and SSRF-safe text-only flow.
- Add authenticated server boundary and user-level rate and budget caps; no secret in client.
- Connect user-facing form to API, loading/error/results views and RTL.
- Show one verified official scholarship, including unknowns and missing-document question.

## Phase 2 — quality and safety
- Real institutional document tests, bilingual human review of Dari/Pashto.
- Negative tests: instruction injection, invented deadline, unsupported alternative credential, budget exhaustion.
- Firebase emulator rules tests and read-only approved catalog (no production rules changes before review).
- Accessibility and responsive testing for 320/390/768/1440px; benchmark low-bandwidth performance.

## Phase 3 — submission
- Short demo script and recorded walkthrough, architecture diagram, setup docs, test evidence, project and source links.
- Publish only after checks; use PR review and avoid auto-merge/deploy of insecure backend.

## Ownership / delegation
- GitHub + coding agent: source, CI, tests, PRs
- Meta Model API: inference only via backend
- Firebase: optional approved catalog and auth, never substitute for a secure AI gateway
- Render: host tested frontend; backend only once secrets and limits are configured
- Human: review accuracy of scholarship data and translations before publication
- ChatGPT Work: orchestrate multi-app code/research/testing when enabled

## Current truth
- Public Render preview exists and its initial deployment was reported live; it displays *demo-only* listings.
- PR #3 contains the web UI and proposed Firestore rules; PR #2 has isolated experimental AI server.
- Live Meta/Firebase functionality has NOT yet been end-to-end verified.

## Non-negotiables
No CTO dependency. No production Firebase rule changes, billing upgrade, exposed key, or public AI deployment without review. Do not mark a task complete because code was merely committed.
