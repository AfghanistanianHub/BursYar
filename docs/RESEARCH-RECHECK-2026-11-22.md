# Research source re-check — 22 November 2026

Scope: the 12 public leads in `src/research-data.js` (BY-08). Each row's
`sourceUrl` was fetched and read on 22 November 2026; the deadline and the
programme description recorded in the catalog were compared with what the
official page states on that date.

This record is evidence of a **source read**, not a live verification or an
eligibility decision. Each row now carries `lastCheckedBy: 'automated_source_read'`
alongside `lastCheckedAt: '2026-11-22'`, so the interface can show what kind of
check produced the date; no row is presented as a human check or as currently
verified.

| ID | Catalog deadline | What the official page states | Verdict |
|---|---|---|---|
| `chevening-2027` | none | [Application timeline](https://www.chevening.org/scholarships/application-timeline/): 2027/28 applications opened August 2026 and closed in October 2026 (exact date differs by country page); shortlisting mid-February 2027, interviews March–April 2027, offer deadline 8 July 2027. | No single deadline exists; the 2027/28 window has closed. `null` stays correct. |
| `gates-cambridge-2027` | `2026-12-08` | [Timeline](https://www.gatescambridge.org/apply/timeline/): US round closed 14 October 2026; all other applicants have a course funding deadline “usually either Tuesday 8th December 2026 or Wednesday 6th January 2027”. | Matches the earlier published course deadline; the later one (6 January 2027) applies to some courses. |
| `nyuad-2027` | none | [Key dates](https://nyuad.nyu.edu/en/apply/undergraduate/apply/key-dates-and-deadlines.html): Early Decision I 1 November, Early Decision II 1 January, Regular Decision 5 January; CSS Profile 10 November / 10 January / 1 February. The page prints no cycle year. | Fixed dates are published, but the year is not printed; inferring it would invent a deadline. `null` stays. |
| `auaf-online` | none | [AUAF](https://auaf.edu.af/): describes itself as a virtual university, internationally accredited, teaching students inside Afghanistan; no admission deadline on the page. | Programme description holds; no deadline published. |
| `auw-bachelor` | none | [Admissions](https://asian-university.org/admissions/): “ADMISSIONS ARE OPEN”; undergraduate and preparatory programmes, majority of students on full scholarship; no closing date. | No deadline published; `null` stays. |
| `mespom-2027` | `2027-01-07` | [Deadlines](https://www.mespom.eu/application-deadlines-and-admissions-calendar): 7 January 2027, 23:59 CET for financial-aid and visa-sensitive applicants; 15 April and 15 July 2027 for self-financing applicants. | Matches the earliest (financial aid) deadline. |
| `kaust-2027` | `2027-01-03` | [Timeline](https://admissions.kaust.edu.sa/how-to-apply/admission-timelines): Fall 2027 Round 2 deadline 3 January 2027 for MS, MS/PhD and PhD; Spring 2027 Round 1 was 27 September 2026, PhD only. | Matches the open round. |
| `yenching-2027` | `2026-11-30` | [Admissions](https://yenchingacademy.pku.edu.cn/ADMISSIONS.htm): international candidates, 30 November 2026, 09:00 Beijing time; Hong Kong/Macao/Taiwan candidates 8 January 2027. | Matches the international deadline. |
| `mmeg-us-canada` | `2027-01-15` | [Apply](https://www.mmeg.org/apply/): US-Canada programme accepts applications 15 September – 15 January, 11:59pm EST, results in April. Eligibility requires registration at an in-person programme; exclusively online programmes are ineligible. | Matches. The in-person requirement is not in the row and is worth surfacing before a student relies on it. |
| `uts-twente-2027` | `2027-04-01` | [UTS](https://www.utwente.nl/en/education/scholarship-finder/university-of-twente-scholarship/): form closes 1 April 2027, 16:00 CET; value €3,000 – €22,000 for one year; explicitly not a full scholarship. | Matches the deadline and the amount range. |
| `adb-jsp` | none | [ADB-JSP](https://www.adb.org/work-with-us/careers/japan-scholarship-program): full funding at 27 designated institutions, 17 in Japan; applications are made to the chosen institution, so no central deadline is published. | No central deadline exists; `null` stays correct. |
| `radboud-2027` | `2027-01-31` | [Radboud Scholarship Programme](https://www.ru.nl/en/education/scholarships/radboud-scholarship-programme): apply by 31 January 2027, 23:59 CET; application complete by 14 February 2027; tuition reduced to €2,771 (to be confirmed) for 2027/28. | Matches. |

## Result

- The automated re-read reproduced 5 of the 7 recorded deadlines; the per-row verdicts above are the human reading.
- 2 recorded deadlines could not be confirmed by the automated pass: KAUST served only 897 characters of readable text, and MMEG's page did not print the recorded date. Both stay unresolved until the pages are read again.
- 5 rows publish no fixed deadline and correctly keep `null`.
- No row's title, provider, degree level or funding label contradicts its page.
- Two known precision limits remain: Gates Cambridge has a second course-dependent
  deadline (6 January 2027), and NYU Abu Dhabi's dates are printed without a cycle
  year. Neither is recorded as a fact.

## Provenance of the refreshed dates

`lastCheckedAt` now reads `2026-11-22` for all 12 rows, and `lastCheckedBy`
records `automated_source_read` for each one. The card labels the date “Last
checked” and adds an automated-read warning in en, fa and ps; the JSON export
carries the validated provenance next to the date. Rows keep
`reviewStatus: needs_reverification`, and the recheck window now matches the
provenance: an automated read earns 14 days, a human source check 30, and a
check with no recorded provenance inherits the 14-day window because it cannot
claim a human reading. These automated dates therefore go stale after 6 December
2026, so the date cannot read as a permanent clearance. The single 30-day window
was too generous here: an automated fetch proves the page still prints the
recorded details but judges nothing, so the weaker claim is re-read more often.

`researchNeedsRecheck` turns that expiry into work rather than decoration:
`npm test` ends with the real-clock `check:research` gate, which prints each
overdue row with its date, provenance window and days past it, while the unit
suite itself takes fixed dates. These 12 automated rows therefore fail CI from
7 December 2026 until a re-read re-dates them; a stale badge can no longer be the
only consequence.

The next re-read can be drafted with `npm run research:recheck`, which fetches
each source and reports per row whether the recorded deadline is still printed,
with an excerpt. It writes a draft and nothing else: the dates below were set by
hand after reading, and a draft carries no authority to move them.

`tests/research-evidence.test.js` closes the obvious shortcut: a date must be
backed by this kind of dated record. For every `lastCheckedAt` in the catalogue
the test requires `docs/RESEARCH-RECHECK-<date>.md` to exist, to name the date,
and to name every row that carries it — so a future re-read cannot be recorded
as a date bump with nothing read.

What is still not claimed: the automated read did not assess eligibility,
funding conditions or language requirements, and the fa/ps provenance strings
remain UNREVIEWED pending a fluent reviewer (BY-21).
