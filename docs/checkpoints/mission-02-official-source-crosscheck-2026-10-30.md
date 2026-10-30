# Mission 02 — official public-source cross-check (2026-10-30)

Status: **research cross-check only**, NOT institutional certification, a curator sign-off, or live-model validation. These public pages were accessed through web search results on 2026-10-30; no repository source hashes were calculated from an authenticated BursYar fetch, so do not insert them into `official_verified` catalogs.

| Institution and award | Public primary source | Source-grounded requirement | Engine risk / next action |
|---|---|---|---|
| University of Oxford / Clarendon | https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants | Deferred graduate offers and continuing the same degree are excluded. Graduate application deadline depends on the particular course's December or January funding deadline; no separate Clarendon form. | Preserve exclusion logic. Ask for exact course deadline; never infer a single university-wide date. |
| Chevening | https://www.chevening.org/resource-hub/guidance/eligibility/ and https://www.chevening.org/scholarships/who-can-apply/work-experience/ | At least 2,800 hours of work experience after completion of the undergraduate degree, acquired over a minimum of two years; program has additional citizenship, return-home and course-offer conditions. | Work-hour totals alone do not prove eligibility. Evaluate timing, minimum duration and other conditions separately; unsupported fields => unknown. |
| University of Toronto / Lester B. Pearson | https://future.utoronto.ca/pearson-scholarships | School nomination is mandatory; the main 2027-start admissions timeline lists 2026-10-09 nomination, 2026-10-16 admission, and 2026-11-06 scholarship-document deadlines. Some FAQ sections on the same page still mention the previous cycle. | Treat stale-cycle FAQ dates as a contradiction risk. Require explicit program/intake scope and human resolution; do not silently choose a date. |

## Follow-up workflow
1. Operator-authorized fetch of complete official page and course detail including canonical redirects, capture time, raw and text digest.
2. Independent reviewer validates course/intake/scholarship applicability, conflicting page sections, eligibility exceptions, historical versus active dates, and explicit acceptance of alternative evidence.
3. Translate *exact* reviewed requirements to en/fa/ps and track named human sign-off at a fixed commit and source snapshot.
4. Feed only independently reviewed operator-owned records into the trusted catalog; no student-supplied flag, PDF, pasted excerpt or plausible domain may manufacture a verification decision.
5. Until then keep `sourceAuthenticity=unverified`, `institutionalAcceptance=unknown`, and human translations `UNREVIEWED`.

No claims about current submission availability or university acceptance beyond the public content. No production deployment or paid model calls.
