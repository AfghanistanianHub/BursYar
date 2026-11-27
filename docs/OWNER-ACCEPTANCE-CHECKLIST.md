# Owner acceptance checklist

Only the tasks that genuinely cannot be completed from this repository. Everything
else on the release path is verified locally; see `docs/CAPABILITY-MATRIX.md` for what
that covers. No values are recorded here — only variable names.

Use the longer browser procedure in `verification/OWNER-AUTHENTICATED-ACCEPTANCE.md`
for the click-by-click version of items 1 and 2, and `docs/OWNER-UNBLOCK-PACKET.md`
for the hosting decisions behind item 4.

---

## 1. Hosted Google sign-in

| | |
| --- | --- |
| Missing | The owner's Firebase project with the Google identity provider enabled, plus a test account. The workspace has none: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_AUTH_DOMAIN` are unset, so the shipped bundle stays signed out by design. |
| Why local is not enough | The emulator IdP accepts an unsigned `id_token` minted in the test (`verification/support/emulator-session.js`). That proves session persistence and restore, but it cannot prove the real OAuth popup/redirect round trip, consent screen, or that Google returns the Google account the owner expects. |
| Safe procedure | 1) Open the production URL in a normal browser profile. 2) Account → *Sign in with Google*, choose the approved synthetic test account. 3) Do not complete any upload with real student records. 4) Reload the page and confirm the session is still there. |
| Expected result | The account menu shows the signed-in state, the dashboard opens at `#dashboard`, the reload keeps it, and no other account's data is visible. Failure looks like: the button stays signed out and a message explains the missing configuration (that is the correct local behaviour, not a hosted one). |
| Variables | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_AUTH_DOMAIN` (client), `FIREBASE_PROJECT_ID` (server token verification) |

## 2. Hosted document acceptance

| | |
| --- | --- |
| Missing | Server credentials that can verify real ID tokens and a durable store for that deployment: `GOOGLE_APPLICATION_CREDENTIALS` (or the platform's equivalent service account), `BURSYAR_DOCUMENT_SUPABASE_URL` / `BURSYAR_DOCUMENT_SUPABASE_KEY` when the Supabase document store is used, and `BURSYAR_ORIGIN` for the same-origin check. |
| Why local is not enough | Locally the document API runs inside the test process with an emulator-verified token and a temporary SQLite file. It proves consent, extraction provenance, review decisions, quota and per-owner isolation, but not that the deployed service account can verify hosted tokens, that storage survives the platform's filesystem, or that the same-origin check accepts the real host. |
| Safe procedure | 1) Sign in with the test account. 2) Open *Documents & profile*, tick consent, upload one synthetic text file containing `Degree: bachelor`. 3) Approve the extracted claim. 4) Reload and reopen the document; then delete it. |
| Expected result | The claim appears with its cited line, approval changes the profile to Bachelor with *not verified*, the reload still lists the document, and deletion clears both the document and the facts it produced. A 503 with a sign-in prompt means the server could not verify the token — report it, do not upload real records. |
| Variables | `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`, `BURSYAR_ORIGIN`, optionally `BURSYAR_DOCUMENT_SUPABASE_URL`, `BURSYAR_DOCUMENT_SUPABASE_KEY`, `BURSYAR_QUOTA_STORAGE` |

## 3. Fluent Dari and Pashto review

| | |
| --- | --- |
| Missing | A fluent reviewer for the strings this mission added. They are all marked `PENDING` in `docs/TRANSLATION-REVIEW.json` (15 entries), and each source file says so in a comment. |
| Why local is not enough | No automated check can judge whether a sentence is natural Dari or Pashto. The automated guards only enforce mechanical rules (the banned `وړتیا` form, the product name, mixed-direction text). A wrong word passes every test. |
| Safe procedure | Open the worksheet in `docs/TRANSLATION-REVIEW-WORKSHEET.md`, review each `pendingStrings` entry, and mark it approved or replace the text in the named source file and key. |
| Expected result | Every entry leaves `PENDING`, and no string is marked approved without a named reviewer. New unreviewed strings must not ship as if reviewed. |
| Variables | none |

## 4. Final release approval

| | |
| --- | --- |
| Missing | The owner's authorisation to publish, and the release gate's requirement that the recorded commit is on `main`. This mission forbids merging to `main` and deploying, so the gate is expected to fail on that one row only. |
| Why local is not enough | Publication changes a public URL, invalidates cached bundles and exposes the hosting protection setting; none of that can be verified or undone from here. |
| Safe procedure | 1) Run `npm run release:check` and confirm the only failure is the `main` row. 2) Review the diff between `work/restore-approved-ai-studio-hero` and `main`. 3) Merge deliberately, promote, then run `npm run rehearsal:smoke`. |
| Expected result | `release:check` passes all rows including the commit-on-`main` row, the promoted deployment serves the same bundle hash, and the smoke run reaches the documented post-deploy state. |
| Variables | none beyond item 1 and 2 |

---

## Not owner tasks

These were checked here and need no owner action: research freshness and structure
(`npm run check:research`, 12 rows, 0 overdue as of 2026-11-27), document processing
including OCR, conflict, duplicate and deletion (`npm run test:ocr`,
`npm run test:workspace`, 27 scenes), accessibility and reduced motion in three
languages (`verification/browser.mjs`, `verification/animation-accessibility.mjs`),
unit and integration suite (`npm test`, 584/584).
