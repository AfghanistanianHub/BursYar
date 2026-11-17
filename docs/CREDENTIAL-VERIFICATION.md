# Credential verification — implementation and provider matrix (Mission 41)

## What this release actually does

- A signed-in student can record a **verification request** for one of their own
  documents and one issuing organisation, with explicit consent, an optional
  certificate/reference number and a durable audit trail
  (`verification_requests`, `verification_events`).
- The student can list and withdraw a request. A request that the issuer has
  confirmed cannot be withdrawn.
- Every issuer in the registry is displayed with its **official verification
  page**, whether institutional authorisation is needed, and a plain-language
  explanation of who can confirm the result.
- Verification history is included in the student's data export and is erased by
  account deletion.

## What this release does **not** do

- **No issuer API is integrated.** No issuer has granted BursYar authorised API
  access, so `autoVerificationAvailable` is `false` everywhere and no request can
  become `VERIFIED_BY_ISSUER` through the HTTP API, OCR, text extraction, an LLM
  or a public-web name match.
- BursYar does not scrape issuer portals, bypass authentication or fabricate a
  confirmation. The official URL is opened by the student in a new tab.
- Uploading a document and extracting its text is recorded as
  `authenticity: not_verified`. It is not a verification step.

## Status model

| Status | Meaning | Who can set it |
| --- | --- | --- |
| `NOT_REQUESTED` | No request exists (also returned after a withdrawal) | student |
| `PENDING` | Consent recorded; the issuer has not answered | student (create) |
| `VERIFIED_BY_ISSUER` | The issuer itself confirmed the credential | server-side issuer record only |
| `REJECTED_BY_ISSUER` | The issuer declined or did not confirm | server-side issuer record only |
| `MANUAL_REVIEW_REQUIRED` | A person must inspect issuer correspondence | server-side issuer record |
| `UNAVAILABLE` | Confirmation cannot be obtained | server-side issuer record |

`VERIFIED_BY_ISSUER`, `REJECTED_BY_ISSUER`, `MANUAL_REVIEW_REQUIRED` and
`UNAVAILABLE` are reachable only through
`createVerificationService().recordIssuerOutcome()`, which is **not exposed over
HTTP**. It requires `authorized: true` plus evidence whose kind is one of
`issuer_portal_confirmation`, `issuer_api_response`, `issuer_signed_document`,
`issuer_letter`. Evidence kinds `ocr`, `text_extraction`, `user_declaration`,
`public_web_mention`, `screenshot` and `model_interpretation` are rejected
outright by `isIssuerEvidenceAllowed()`.

## Provider matrix (checked 2026-11-17 against issuer documentation)

| ID | Test / credential | Official verification mechanism | Access type | Documented API | Issuer authorisation required |
| --- | --- | --- | --- | --- | --- |
| `ielts` | IELTS | IELTS Results Service (TRF verification / e-delivery) | institution account | yes, for registered organisations | yes |
| `toefl` | TOEFL iBT | ETS Online Score Verification System (ETS Data Manager) | institution account | server-to-server feeds | yes |
| `duolingo_english_test` | Duolingo English Test | Accepting-institution results dashboard | institution account | CRM/API guide for institutions | yes |
| `cambridge_english` | Cambridge English Qualifications | Results Verification Service (RVS) | institution account | API integration supported | yes |
| `pte_academic` | PTE Academic | Pearson Score Report Website (SRW) | institution account | none documented | yes |
| `goethe` | Goethe-Zertifikat | goethe.de/verify (certificate no., birth date, issue date) | public lookup | none | no |
| `testdaf` | TestDaF | g.a.s.t. verification form / certificate QR | public lookup | none | no |
| `telc` | telc | telc verification portal (QR / test taker no.) | public lookup | none | no |
| `osd` | ÖSD | ÖSD Cert Checker QR app; results only via exam centre | QR app | none | no |
| `delf` | DELF | France Éducation international / exam-centre confirmation | issuer contact | none documented | yes |
| `dalf` | DALF | France Éducation international / exam-centre confirmation | issuer contact | none documented | yes |
| `tcf` | TCF | France Éducation international attestation confirmation | issuer contact | none documented | yes |
| `tef` | TEF | CCI Paris Ile-de-France attestation confirmation | issuer contact | none documented | yes |
| `mycreds` | Academic credentials | MyCreds digitally signed credential shared with a verifier | signed document | verifier onboarding | yes |

Official source URLs are stored on each registry entry and rendered as the
"official verification page" link. They are never fetched or parsed by the
verification workflow.

## HTTP API

All routes require a Firebase-authenticated bearer token; the owner is derived
from the verified token, never from the request body. A guardian-scoped
`/api/family/...` route cannot reach them (403).

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/verifications/providers` | GET | Public-safe issuer matrix, statuses, `autoVerificationAvailable: false` |
| `/api/verifications` | GET | The caller's requests and recorded issuer decisions |
| `/api/verifications` | POST | `{documentId, providerId, consent: true, reference?}` → `201` with `PENDING` |
| `/api/verifications/:id` | DELETE | Withdraw a non-verified request |

Server-side errors: `400` invalid consent/body, `404` foreign or unknown
document/request, `409` withdrawing an issuer-confirmed result, `415` wrong
content type, `422` unknown issuer, `429` more than 25 requests, `503` the
workflow is not configured.

## Configuration

```bash
# Absolute path in an existing private (0700) directory. Requires
# BURSYAR_DOCUMENT_DB; without both, verification routes return 503.
BURSYAR_VERIFICATION_DB=/absolute/private-directory/verifications.sqlite
```

The database file is created mode `0600` with `O_NOFOLLOW`; a public parent
directory, foreign owner or symlink is refused at startup.

## Outstanding external dependencies

1. Institutional registration/approval for IELTS, TOEFL, Duolingo, Cambridge,
   PTE, MyCreds and similar verifier programmes before any automated adapter can
   be implemented.
2. Issuer API documentation and credentials for those programmes: not available
   to this project.
3. A documented, consent-based process for submitting a confirmation request to
   the issuers that only answer by contact (DELF, DALF, TCF, TEF, ÖSD).
4. Human review of the Persian and Pashto copy in `src/verifications.js`.

## Verification evidence in this release

`tests/verification.test.js`, `tests/verification-api.test.js` and
`tests/frontend-verification-copy.test.js` cover: registry integrity and
official HTTPS sources, no automatic verification anywhere, extraction/OCR
evidence rejection, consent gating, document ownership, idempotent requests,
cross-account isolation, persistence across connections, the 25-request cap,
issuer-only status promotion, withdrawal rules, data export inclusion, account
erasure, unavailable-service behaviour, and complete en/fa/ps copy.
