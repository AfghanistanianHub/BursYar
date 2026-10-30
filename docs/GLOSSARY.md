# BursYar controlled glossary — UNREVIEWED

Status: UNREVIEWED. No fluent Dari/Pashto reviewer has approved these terms.
Coded module: `src/glossary.js`. A regression test fails if any coded English
term is missing from this document.

Approval rule: a fluent human reviewer must supply reviewer identity, timestamp
and the reviewed glossary digest before any term is marked reviewed. Automated
tests never approve translations.

| Key | English | Dari (fa) | Pashto (ps) |
|---|---|---|---|
| appearsToMeet | Appears to meet | به نظر می‌رسد برآورده شده | ښکاري چې پوره شوی |
| potentialMismatch | Potential mismatch | ناسازگاری احتمالی | احتمالي نه سمون |
| cannotDetermine | Cannot determine | قابل تعیین نیست | نه شي ټاکل کېدای |
| requirement | requirement | شرط | شرط |
| evidence | evidence | شواهد | شواهد |
| deadline | deadline | مهلت | وروستۍ نېټه |
| exemption | exemption | معافیت | معافیت |
| overallScore | overall score | نمره مجموع | عمومي نمره |
| bandScore | band score | نمره باند | د باند نمره |
| gpa | GPA | معدل (GPA) | اوسط نمره (GPA) |
| institution | institution | مؤسسه | اداره |
| verify | verify | تأیید کنید | تایید کړئ |
| unknown | unknown | نامشخص | نامعلوم |

Usage notes for reviewers:

- Negations and exceptions must survive translation: "does not need", "unless
  exempt" and "or equivalent experience" change eligibility and must never be
  dropped or softened.
- Distinguish a missing document from a failed requirement: "unknown" means
  evidence is absent, never that the applicant is weak.
- Course-specific timing words (December/January intakes) are not calendar
  deadlines unless the source states an exact date.
