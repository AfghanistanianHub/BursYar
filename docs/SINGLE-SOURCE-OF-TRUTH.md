# BursYar — single source of truth and release control

## Canonical sources
- Repository: `AfghanistanianHub/BursYar`.
- Approved integration branch for ongoing work: `work/restore-approved-ai-studio-hero`. Always inspect the live branch HEAD before modifying anything; do not assume an old SHA is current.
- Production release branch: `main`. Production deployment requires explicit owner approval after review; never silently merge or deploy.
- The approved new Hero and the current working application's functional features must be preserved; never restore an older snapshot over the approved branch.

## Mandatory change workflow
1. Fetch and verify the canonical branch HEAD and compare with `main`; verify the actual source of any AI Studio or Freebuff changes before coding.
2. Record all intended code changes in the canonical branch, with commit SHA and changed files. Never treat AI Studio, Freebuff, a local workspace, a Vercel preview, or a Render instance as a separate source of truth.
3. Run relevant automated checks and inspect real user flows in English, Persian (fa), and Pashto as appropriate.
4. Produce one preview associated with the exact tested commit SHA; label all preview links with SHA and status. Existing preview URLs are historical artifacts, not independent development branches.
5. Only promote the tested canonical commit to `main` after explicit approval. Confirm production deployment SHA matches the approved SHA. If it does not, stop and reconcile.
6. If changes are made in an external design/AI tool, export and reconcile the diff into the canonical Git branch before claiming they are implemented.
7. On each report distinguish: canonical branch HEAD, preview SHA/URL, production SHA/URL, and any unapplied external changes. Never claim a fix is live based only on a preview.

## Infrastructure boundaries
- Render `bursyar-api` is a backend service, not another BursYar application version.
- Render `bursyar-9router-private-test` is a separate experimental AI gateway; do not connect it to production, send student documents, or enable paid providers without separate approval and security verification.
- No paid inference, unnecessary builds, Vercel Agent Review, or local MacBook work.
- Do not delete historical deployments or branches until their unique changes have been compared and reconciled.

## Conflict rule
If branches, deploys, or workspaces disagree, STOP and compare commit SHAs and diffs. Never overwrite the canonical branch with an older or unknown artifact.
