# Reviewer checklist (semantic + language)

No inference is required. Review locally; do not upload educational documents
or credentials. Automated tests never approve meaning or fluency.

## 1. Bind the exact artifacts

- [ ] Identify the exact source URL, source bytes/text, and saved normalized
      output from the run under review.
- [ ] Record the actual source SHA-256 (matching the result) and the SHA-256
      of the exact saved output bytes. Never approve diagnostic metadata alone.
- [ ] Record the runtime head if known; otherwise leave it unknown.
- [ ] If the output/source is not retained, leave review pending rather than
      reconstructing a supposed result from a fixture.

## 2. Criterion semantics (per criterion)

- [ ] Compare the exact quotation and every English/Dari/Pashto explanation.
- [ ] Check obligation vs preference; negation; exceptions; study mode;
      nationality/course/year scope; qualifications vs documentary evidence.
- [ ] Mark pass, correction required, or unresolved with source location and
      reason.

## 3. Funding and deadline wording

- [ ] Distinguish course fees from stipend conditions and historical amounts.
- [ ] Review deadline wording separately; a course-specific December/January
      deadline is not a universal date — never approve an invented day/year.

## 4. Coverage honesty

- [ ] Review the entire retained source, including conditions omitted from
      compact output; identify unsupported clauses and missing official course
      evidence.
- [ ] Do not approve `coverageComplete=false` changing merely because shown
      quotations are valid.

## 5. Profile, scenario, and UI wording

- [ ] Compare the actual profile/scenario evidence; a hypothetical result must
      leave real facts unchanged.
- [ ] Scholarship eligibility does not establish course admission or award
      selection — confirm no wording implies it.
- [ ] Review source-provenance, missing-evidence, consent/deletion, blocked-page
      recovery, approval, saved HTML/TXT privacy wording, and PathFinder
      messages in all three languages.

## 6. Record the decision

- [ ] A fluent reviewer records identity, language competence, time, exact
      source/output digests, scope, corrections, and decision in a private
      copy of [SEMANTIC-REVIEW-TEMPLATE.json](SEMANTIC-REVIEW-TEMPLATE.json).
- [ ] Keep reviewer contact details and raw outputs out of public Git unless
      deliberately authorized.
- [ ] Record only approved public review metadata in
      [TRANSLATION-REVIEW.json](TRANSLATION-REVIEW.json); its status remains
      `PENDING_HUMAN_REVIEW` until then.
