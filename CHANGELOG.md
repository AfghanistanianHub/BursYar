# Changelog

All notable changes to BursYar are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-21

Release closure was verified on 2026-11-18; this entry also records the repository and documentation baseline of 2026-11-21.

### Added

- Trilingual (English, Dari/Persian, Pashto) reader with RTL layout, persisted language choice and a skip link.
- Evidence-first analysis pipeline: source excerpt, per-criterion provenance, signed source receipts and three-valued verdicts (`met` / `not_met` / `unknown`).
- Deterministic reviewed-scholarship assessment that runs without any model provider.
- Private document and profile workflow with review history, staged claims, export and erase.
- Credential-verification requests for 14 issuers, with status tracking and withdrawal; no issuer auto-verification exists.
- Durable quota and document storage adapters for SQLite and Supabase.
- Self-hosted PDF.js worker and on-device OCR pipeline behind an explicit runtime gate.
- Runtime capability reporting that never claims verified inference (`inferenceVerified: false` at startup).
- Student dashboard, research explorer with checked program facts, and a guided journey navigation.

### Changed

- Repository documentation reorganised: mission, checkpoint, hackathon and release records moved to `docs/archive/` behind a single index; `README.md` rewritten to describe the current release, architecture, deployment and limits.
- Package metadata completed and the version set to `1.0.0`.
- Deployment configuration documented as one topology: Vercel static frontend plus the Render `bursyar-api` gateway; `render.yaml` now describes the backend service instead of an unused static preview.
- Source code comments no longer point at archived records for the translation-review rule.

### Security

- Firebase ID-token verification requires audience, issuer, non-anonymous provider and the approved demo claim; optional account-status checks reject disabled or revoked callers.
- Source retrieval is SSRF-guarded: HTTPS only, no credentials or explicit ports, DNS and post-connect address checks, redirect limits.
- Private storage uses owner-only directories, `O_NOFOLLOW`, `0600` files and `secure_delete`; quota reservations are transactional and durable.
- API responses are `no-store`, origin-checked, body-limited and never include secrets or user text in diagnostics.

### Known limitations

- Scholarship listings are sample data; no reviewed production catalog ships.
- Production document intake is TXT only; PDF and image extraction are local-demo capabilities.
- Dari/Persian and Pashto copy has not had fluent human review.
- Credential verification is request-only; no issuer connection is authorised.
- No production claim of live model inference beyond the single owner-approved request recorded in `docs/HOSTED-META.md`.
