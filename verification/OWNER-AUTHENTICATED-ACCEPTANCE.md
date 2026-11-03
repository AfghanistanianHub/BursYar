# Owner authenticated acceptance (BursYar smoke test)

One short browser procedure for the owner, after signing in with the
approved Google demo account. No agent can perform these steps without
your session. Synthetic data only — never real student records.

Setup: open https://bursyar.vercel.app in your normal browser profile.

## A. Sign in (2 min)

1. Open Account → sign in with Google using the approved demo account.
2. Confirm your demo identity shows and no other user's data appears.
3. Keep this session for B–D; do step E last.

## B. Profile (3 min)

1. Open My profile and documents → Your educational profile.
2. Set Highest degree to Bachelor (synthetic), check the consent box,
   Save approved edits.
3. Reload the page, reopen the profile: Bachelor must persist.
4. PASS: saved value returns; nothing else changed.

## C. Document upload (5 min)

1. In Review an educational text document, check consent, choose this
   synthetic file (save as `synthetic-acceptance.txt`):
   `SYNTHETIC ACCEPTANCE ONLY` + newline + `Degree: bachelor`.
2. Upload and inspect → expect extracted degree claim, labeled
   not verified. Approve it, then reload and confirm the Reviewed —
   not verified record returns from the server.
3. Negative checks (must be rejected with a clear message):
   any `.pdf` file, any image, a file over 12 KB.
   PDF/image extraction is NOT supported (open PR #86 is the
   post-freeze candidate — do not expect it to work).
4. PASS: TXT accepted with unverified labels; PDF/image/oversize
   rejected; reload shows the same record.

## D. Retry idempotency (2 min)

1. With the library open, submit the identical `synthetic-acceptance.txt`
   again (same bytes, consent checked).
2. PASS: no second record appears (server returns the existing record).
3. Change one byte and resubmit: expect a 409-style conflict message
   and the original record intact.

## E. Sign out + cleanup (2 min)

1. Open the uploaded record → Delete document and linked profile facts.
2. Reset Highest degree to Unknown / not provided, save, reload, verify.
3. Sign out. Reload and confirm profile/documents now show the
   sign-in requirement and no private content.
4. PASS: library empty, profile reset, signed-out gates shown.

## Report back

For each of A–E reply PASS or FAIL with a screenshot of any failure.
Until then the hosted authenticated journey stays UNVERIFIED in
`FINAL-OWNER-DECISION.md` regardless of mock coverage.
