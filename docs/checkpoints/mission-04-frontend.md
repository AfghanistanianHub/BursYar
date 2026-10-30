# Mission 04 — demo delivery checkpoint

## Implemented on this independent Draft PR
- Three-language (en/fa/ps) journey navigation and responsive RTL/LTR entry.
- Existing Google sign-in / approved server demo gates preserved.
- Source URL review, conservative evidence display, current profile editing, deterministic scholarship assessment and document provenance from Mission 01/02 retained.
- First-screen AI-free entry opens the authenticated deterministic assessment. If model inference fails or quota is exhausted, the user can intentionally switch to deterministic assessment without fabricating an AI result.
- Local assessment displays evidence excerpts and tri-state actions; it does not infer university-approved alternative tests.
- Browser assertions exercise desktop/mobile journey and offline entry with synthetic mocked identities. Tests do not verify live Meta or live Firebase sign-in.

## Verification and limits
- Commit 501a988 passed all four GitHub Actions jobs (verify/build, emulator, browser, macOS helper) in run 135.
- **New commits after 501a988 require independent exact-head CI before approval.**
- The Figma MCP Starter quota blocked reading Mission 03 design context; no pixel-perfect Figma claim.
- Verified official-source scholarship registry, current institutional acceptance decisions and human bilingual translation review remain unapproved; simulated and unverified listings remain explicitly labeled.
- No deployments, merges, paid inference, billing modifications or secrets changed.

## Security and release criteria
- Confirm latest-head CI, manual keyboard/screen reader and RTL review.
- Confirm Mission 01 guardian privacy and legal gates; Mission 02 provenance and reviewed school policies.
- Confirm live approved Google auth and real institution sources in a separately authorized test environment.
- No real student details in browser fixtures or screenshots; no Contributor API for user content; do not convert unknown into met.
