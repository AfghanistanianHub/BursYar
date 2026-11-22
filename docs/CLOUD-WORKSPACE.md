# BursYar cloud-only development handoff

## Canonical source and safeguards
- Repository: AfghanistanianHub/BursYar
- Working branch: `work/restore-approved-ai-studio-hero`
- GitHub is the source of truth. Google Drive is optional archival storage, **not** an execution environment.
- Never deploy or merge into production without explicit owner approval.
- Do not enable Vercel Agent Review, paid AI inference, or automatic model calls.
- Keep the approved new hero, multilingual UI, OCR/PDF, authentication and scholarship flows intact.
- No second competing application copy or independent development branch.

## Continue after ChatGPT Work/Codex quota runs out
1. Open https://github.com/AfghanistanianHub/BursYar and switch to `work/restore-approved-ai-studio-hero`.
2. Choose **Code > Codespaces > Create codespace on work/restore-approved-ai-studio-hero**. This is a cloud Linux machine accessed from a browser, not your MacBook.
3. Wait for the container setup to finish. Open the built-in terminal inside Codespaces.
4. Check `git branch --show-current` and `git status --short`. If the branch is wrong, stop; do not change files.
5. Use `npm test`, `npm run test:evaluation`, and `npm run build` to validate work. Use GitHub Actions Cloud Audit for repeatable verification.
6. For an AI coding agent, install a **Linux-compatible** CLI inside Codespaces and configure an explicitly selected provider/model with free quota. Installing a CLI alone does not provide free model inference. Never paste API keys into chat or commit them; use Codespaces secrets.
7. Keep agent changes reviewed and committed to the working branch only. Do not run multiple agents writing the same files simultaneously.
8. Stop the Codespace when finished to conserve included usage.

## Free/low-cost agent selection
- Start with **one** agent: OpenCode or Pi, if compatible with the selected provider and Linux runtime.
- Codex and Claude Code CLIs can be installed but may require separate authentication, subscription or API usage; do not assume they remain usable after ChatGPT limits.
- FCC orchestration is optional and must be separately installed/tested in Codespaces. Local macOS installation cannot be reused automatically.
- GitHub Actions cloud audit uses **zero AI tokens** and does not write application code.

## Cost boundaries
GitHub Actions and Codespaces use GitHub account/organization billing allowances; they are not guaranteed free indefinitely. Check https://github.com/settings/billing and the organization's billing policies. Set a zero additional-spend budget with **Stop usage when budget limit is reached** before creating a Codespace if strict zero cost is required. Organization-owned repositories may not receive the same personal Codespaces allowance.

## Safe starting task for the agent
Inspect the current branch, identify the top three user-visible defects with evidence, propose a small coherent fix batch, preserve approved hero and existing capabilities, run tests, and report the commit SHA and verification results. Do not deploy production, add paid providers, or change branches.
