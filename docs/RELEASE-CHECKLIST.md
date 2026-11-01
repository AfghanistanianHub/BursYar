# Release checklist

Status: **NOT RELEASED**. Merge, deployment, and submission each need explicit
owner authorization. All six [release gates](MISSION-01-RELEASE-GATES.md)
remain **BLOCKED**.

## 1. Confirm submission logistics with the owner (UNVERIFIED)

- [ ] Actual hackathon portal, deadline/timezone, and eligibility.
- [ ] Official rules text and Meta-use proof requirements.
- [ ] Required assets: video length/format, repository-access policy, demo link.
- [ ] Repository-access policy before sharing any link.

## 2. Human reviews complete

- [ ] Semantic + fluent Dari/Pashto review recorded per
      [REVIEWER-CHECKLIST.md](REVIEWER-CHECKLIST.md); public metadata in
      `TRANSLATION-REVIEW.json` (currently `PENDING_HUMAN_REVIEW`).
- [ ] Source ledger bound: every [SOURCE-TRACEABILITY.md](SOURCE-TRACEABILITY.md)
      record reviewed against a dated capture (currently all
      `needs_reverification`).
- [ ] Manual assistive-technology / real-device validation (axe scans only so
      far).

## 3. Live verification (owner-authorized only)

- [ ] Real Google sign-in and revocation verified without changing permissions
      unless separately authorized.
- [ ] At least one real Meta interpretation of official scholarship evidence
      reviewed; billed cost taken only from an authorized billing view.
- [ ] Live document file-upload UI check completed (currently pending).
- [ ] No paid request without fresh explicit approval; prior approvals are
      superseded.

## 4. Code and CI at the exact SHA

- [ ] `npm test`, `npm run test:evaluation`, `npm run build` green.
- [ ] Emulator, browser, and macOS-helper suites green on the exact release SHA.
- [ ] Passing older commits is not sufficient; rerun all CI jobs after any
      change.

## 5. Release actions (explicit owner approval each)

- [ ] Draft status change approved; merge approved and performed in documented
      PR order; CI rerun on the integration head.
- [ ] Deployment approved; serving SHAs recorded (Render auto-deploy is OFF;
      currently-serving SHAs **UNVERIFIED**).
- [ ] Owner files the submission through the official portal; confirmation
      recorded in-repo. A local demo and draft PRs are not a filed submission.
