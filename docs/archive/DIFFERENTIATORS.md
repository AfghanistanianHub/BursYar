# BursYar differentiators (one-pager)

Derived from [EVIDENCE-FIRST-DEMO-ARCHITECTURE.md](EVIDENCE-FIRST-DEMO-ARCHITECTURE.md)
and [HACKATHON-READINESS-2026-10-28.md](HACKATHON-READINESS-2026-10-28.md) s9.
No benchmarks, partnerships, or availability are claimed.

1. **Evidence-first, exact-excerpt validation.** Model output binds to the
   source only by exact-substring quotation; paraphrases are not evidence.
   Every analysis carries a source SHA-256 digest, `requiresHumanReview=true`,
   and `selection.complete=false`. Compact selections never imply complete
   policy coverage.

2. **Conservative 3-valued compiler.** Eligibility compiles to
   MET / NOT MET / UNKNOWN. Unsupported predicates (nomination, rank
   percentile, nationality, study mode, course-specific timing) fail closed to
   UNKNOWN instead of guessing — pinned by 60 offline evaluation checks in
   `verification/evaluate.mjs` (mocked interpretations; no semantic-accuracy
   claim).

3. **Fail-closed trusted-policy gates.** Policy is evaluated before prompts,
   quota, or any provider call: 24-hour verified window, adult caller and
   subject, active matching consent, allowlisted jurisdiction, Standard models
   only. There is no provider or model fallback; the only fallback is the
   offline deterministic path.

4. **URL-first retrieval with honest recovery.** Genuine server fetch where
   allowed; when a page refuses (e.g. central Oxford 403/challenge), the
   original URL is retained and the user is routed to paste-or-import with
   supplied-vs-fetched labels — never a silent substitution or protection
   bypass.

5. **Privacy-minimal provider boundary.** The model receives only pasted
   public source text. Source URL, student identity, profile, documents, and
   quota state never enter provider messages.

6. **Trilingual evidence planning.** English/Dari/Pashto UI with RTL, local
   fonts, and original quotations kept untranslated and visibly distinct.
   All fa/ps strings remain **UNREVIEWED** pending fluent human review.
