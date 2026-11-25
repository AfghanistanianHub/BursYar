# Free and open LLMs for BursYar's GitHub Codespace

**Scope:** developer tooling in the canonical branch only; **not** the BursYar production inference service. No backend provider is silently switched. The public app remains deterministic without a provider.

## Verified options (2026-11-24)

| Option | License/hosting | Cost and real limits | Codespace fit |
| --- | --- | --- | --- |
| OpenCode ([project](https://opencode.ai/docs/)) | Open-source coding CLI; **not an inference provider** | Free software, model inference can be paid | Main coding agent |
| Ollama ([GitHub](https://github.com/ollama/ollama)) + Qwen3 1.7B ([model](https://huggingface.co/Qwen/Qwen3-1.7B)) | Local runtime; Qwen3 1.7B Apache-2.0 | No per-token API fee; ~1.4 GB model download, Codespaces compute/storage **may cost money** | CPU-only fallback for smaller tasks; coding accuracy limited |
| Ollama + Qwen3 4B ([model](https://ollama.com/library/qwen3)) | Local open-weight inference | No per-token fee; ~2.5 GB download; CPU slower and memory higher | Optional only if Codespace resources suffice |
| OpenRouter [free router](https://openrouter.ai/openrouter/free) | Hosted service, not open-source API software; routes to a changing list of free models | The **:free** variants currently have a shared 50 requests/day cap and 20 RPM; no guarantee of permanence | Useful remote fallback; requires API key |
| GroqCloud ([models](https://console.groq.com/docs/models), [limits](https://console.groq.com/docs/rate-limits)) | Hosted proprietary API serving some open-weight models | Free-plan rate limits vary by model/account and change; read live console | Often faster remote inference; requires API key |

**Do not recommend GitHub Models**: retired in July 2026. Trial credit is not a permanent free tier. Do not assume an arbitrary model in OpenRouter or Groq is free. Never enable billing as a setup step.

## Installation in GitHub Codespaces

Only use the existing Codespace for `AfghanistanianHub/BursYar`, branch `work/restore-approved-ai-studio-hero`. GitHub Codespaces is **metered**, even if a personal free allowance is available. Check the relevant GitHub billing allowance before downloading models.

```bash
git branch --show-current
bash scripts/setup-free-llm.sh --agent
bash scripts/setup-free-llm.sh --check
opencode
```

The `--agent` command installs the official OpenCode CLI **only when missing**. If it already exists, it leaves it alone.

Inside OpenCode:
- `/connect` → choose **OpenRouter** and provide your own key via the provider's login/credential flow; `/models` → filter to **free** models. The OpenRouter free router ID is `openrouter/free` (OpenCode's full provider-prefixed form is `openrouter/openrouter/free`).
- Or `/connect` → **Groq** → select a model available in your account's **Free plan**. Verify its model ID and live rate limit first.
- Never paste credentials into a prompt, source file, screenshot, Git commit, or public logs. Prefer GitHub Codespaces Secrets if environment injection is needed.

## Optional: zero-per-token local API, without hosted keys

Run **one** of the following only if the Codespace memory/storage budget permits:

```bash
bash scripts/setup-free-llm.sh --local-small
# or, if a larger CPU model is justified:
bash scripts/setup-free-llm.sh --local-balanced
bash scripts/setup-free-llm.sh --check
opencode
```

In OpenCode, choose `ollama/qwen3:1.7b` or `ollama/qwen3:4b` from `/models`. Current OpenCode autodiscovers Ollama on `127.0.0.1:11434`. Local inference will usually be much slower than a remote free API on a CPU-only Codespace, and small models may not reliably handle autonomous multi-file refactors.

The local OpenAI-style endpoint is `http://127.0.0.1:11434/v1`. It binds to loopback only; do not expose it to public Codespaces ports. Installation uses the official Ollama Linux installer, which should be reviewed before use.

## Required safeguards

1. Keep work on the canonical branch; do not merge or deploy production.
2. Don't turn on paid inference, credit-card billing, Vercel Agent Review, or optional model downloads automatically.
3. Do not put user documents or private scholarship applicant data into free hosted providers without explicit approval and privacy review.
4. Use a deterministic coding/test workflow; **a model answer is never proof of passing tests**.
5. Stop the Codespace when finished to minimize charges.
6. An API key cannot be generated or injected by a GitHub repository commit. The account owner must connect a chosen free provider.
7. If model access is unavailable or quotas are depleted, use the existing deterministic BursYar engine; do not fail open to a paid model.

## Official references

- [OpenCode installation](https://opencode.ai/docs/)
- [OpenCode provider setup and Ollama discovery](https://opencode.ai/docs/providers)
- [Ollama on Linux](https://ollama.com/download/linux)
- [Qwen3 1.7B Apache-2.0 license](https://huggingface.co/Qwen/Qwen3-1.7B)
- [OpenRouter free models and limits](https://openrouter.ai/collections/free-models)
- [GroqCloud free-model rate limits](https://console.groq.com/docs/rate-limits)
