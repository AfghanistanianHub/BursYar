# Official Document Verification Pathways

Baseline: `797b777` (repository `AfghanistanianHub/BursYar`, branch `main` at the start of this work).
This workspace is a checkout, not a mirror of the live Vercel deployment.

## What this release does

The documents dashboard shows **"Verify with the issuer"** / **«استعلام از مرجع صادرکننده»**
/ **«د صادرونکي له مرجع څخه پوښتنه»** beside each saved record. The panel is guided only:

- it resolves a reviewed route from `src/official-verification.js`;
- it links to reviewed official HTTPS pages from that configuration;
- it offers a generic request template for registrar/issuer contact;
- it never contacts a provider, never calls an API, never reads document text, and
  never sends a TRF number, score identifier, share link, or personal data anywhere.

Opening a link, choosing a route, marking a request as sent, accepting extracted text,
or matching a scholarship rule does **not** change credential authenticity or holder
identity. There is no action or API in this release that can set "Verified by issuer".

## Reviewed routes

| id | Exact test/variant | Issuer | Route kind | Reviewed source |
| --- | --- | --- | --- | --- |
| `ielts` | IELTS Academic, IELTS General Training | IELTS (British Council, IDP, Cambridge) | Official score/credential delivery; receiving organisation verifies | https://ielts.org/take-a-test/your-results/getting-and-sharing-your-results and https://ielts.org/organisations/ielts-for-organisations/verifying-ielts-results |
| `toefl_ibt` | TOEFL iBT | ETS | Official score delivery | https://www.ets.org/toefl/test-takers/ibt/scores/send-scores.html |
| `duolingo` | Duolingo English Test | Duolingo | Official score delivery (My Tests → Share Score) | https://englishtest.duolingo.com/sharing |
| `testdaf` | TestDaF | g.a.s.t. | Issuer-side verification | https://www.testdaf.de/de/hochschulen/der-testdaf-und-hochschulen/verifikation-des-testdaf-zertifikats |
| `goethe_zertifikat` | Goethe-Zertifikat | Goethe-Institut | Issuer-side verification | https://www.goethe.de/verify |
| `tcf` | TCF tout public, TCF Canada, TCF Québec, TCF IRN | France Éducation international | Issuer-side verification (`verify_attestation_on_issuer_site`) | https://controle.france-education-international.fr/ (official authentication site; only the session date and attestation number are entered there; lookalike domains are not linked) |
| `delf` | DELF | France Éducation international / exam centre | Issuer contact and certificate guidance | https://www.france-education-international.fr/article/informations-pratiques-pour-les-candidats-au-delf-dalf |
| `dalf` | DALF | France Éducation international / exam centre | Issuer contact and certificate guidance | same official candidate guidance page |
| `tef_etudes` | TEF Études (never TEF Canada) | Le français des affaires (CCI Paris Île-de-France) | Issuer contact and certificate guidance | https://www.lefrancaisdesaffaires.fr/candidat/test-evaluation-francais/tef-etudes/attestation |
| `mycreds` | institution + document type reviewed below | MyCreds | Official credential sharing to a registered receiver | https://mycreds.ca/wp-content/uploads/2025/06/How-to-share-a-document-to-a-registered-organization.pdf |

MyCreds is offered only for an institution whose own reviewed page confirms the
document type:

- University of Manitoba — official transcripts, enrolment verification letters —
  https://umanitoba.ca/registrar/mycreds
- Saint Mary's University — official transcripts — https://www.smu.ca/academics/mycreds
- University of Waterloo — official transcripts —
  https://uwaterloo.ca/the-centre/forms-and-official-documents/official-documents/official-transcripts/mycreds-university-waterloo

Every other institution or document type gets the registrar/issuing-office fallback,
an explicit "no reviewed official route is confirmed", the generic request template,
and the note that a missing route or delayed reply is not evidence of invalidity.

All routes were reviewed on **2026-11-14**. New credentials are added to
`officialVerificationRoutes` without changing the dashboard flow. A route must record
the exact test or variant, issuer, kind, intended actor, action, source URL, and review
date. Variants never substitute for each other: TOEFL Essentials, Goethe-Test PRO,
IELTS Life Skills, TCF DAP, and TEF Canada do not resolve to the entries above.

## Acceptance is a separate question

`programAcceptanceStatus` is the low-level wording helper. The panel uses
`programAcceptance({ programId, test, variant })` from `src/program-acceptance.js`,
which confirms acceptance only when the selected catalog program has a reviewed
requirement entry for the exact test and exact variant. Matching tolerates case and
whitespace in the same string, but never treats a different exam or variant as
equivalent. Choosing a program or seeing a confirmed requirement does not change
credential authenticity, holder identity, or the request marker.

The program selector is populated from `researchScholarships`. With no program
selected, no test selected, an unreviewed program, or a credential the reviewed
source does not name, the panel shows **"Acceptance not confirmed"** and no source.

Reviewed program requirements (all reviewed **2026-11-14**):

| Program | Exact credential | Official source |
| --- | --- | --- |
| University of Twente Scholarship (`uts-twente-2027`) | IELTS Academic; TOEFL iBT | [UT master's language requirement](https://www.utwente.nl/en/education/master/application-admission/admission/language-requirement) — names IELTS (academic) and TOEFL iBT and excludes IELTS General Training; the [UTS page](https://www.utwente.nl/en/education/scholarship-finder/university-of-twente-scholarship) requires applicants to meet the general English requirement |
| NYU Abu Dhabi (`nyuad-2027`) | IELTS Academic; TOEFL iBT; Duolingo English Test | [NYU English Language Testing](https://www.nyu.edu/admissions/undergraduate-admissions/how-to-apply/standardized-tests/english-language-testing.html) — names each credential; [NYUAD entry requirements](https://nyuad.nyu.edu/en/apply/undergraduate/apply/entry-requirements.html) direct applicants to NYU's English testing policy |
| Yenching Academy Fellowship (`yenching-2027`) | IELTS Academic; TOEFL iBT | [Yenching Academy admissions](https://yenchingacademy.pku.edu.cn/ADMISSIONS.htm) — the 2027 cohort page names IELTS (Academic) and TOEFL (iBT) |

When confirmed, the panel shows the program, the reviewed source excerpt, the
official link and hostname, and the review date. It does not decide a score. Programs
whose official pages do not name the exact variant (for example KAUST or Radboud)
remain unconfirmed even when they refer to an English requirement. Catalog rows may
still carry `needs_reverification`; that is about discovery metadata, not the
separately reviewed language-requirement entry.

## Evidence a future "verified by issuer" status would need

No API accepts the following in this release. A future trusted integration or an
authorised review of independently received issuer evidence would have to record:

- the specific credential (document id, exact test/variant or award, issuer);
- the verifying authority (official name and domain, or integration identity);
- the method (authorised provider integration, issuer-side confirmation received
  independently, or a documented manual review);
- the verification date;
- an opaque reference to the evidence, stored outside public responses.

The holder's identity would remain a separate, optional workflow for a specific
partner or submission need, with its own consent and evidence. It must never be
implied by document review, issuer verification, or a scholarship match.

## Verification performed

The targeted `node --test tests/program-acceptance.test.js tests/official-verification.test.js`
run, the full `npm test` suite, and `npm run build` all passed. The dashboard panel was
not visually inspected in this workspace because no browser binary was available; see
the handoff report for the remaining limits.
