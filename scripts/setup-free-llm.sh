#!/usr/bin/env bash
# Free-LLM bootstrap for the GitHub Codespace, not for production deployment.
# Explicit opt-in for model downloads: Codespaces compute/storage may be billed.
set -Eeuo pipefail

usage() {
  cat <<'HELP'
BursYar free LLM setup (GitHub Codespaces, Linux)

  bash scripts/setup-free-llm.sh --agent
      Install OpenCode CLI if not already available (no inference requests).
  bash scripts/setup-free-llm.sh --all-small
      Install OpenCode plus Ollama/Qwen3 1.7B in one opt-in command.
  bash scripts/setup-free-llm.sh --local-small
      Install Ollama if needed, start loopback-only server, pull Qwen3 1.7B (~1.4GB).
  bash scripts/setup-free-llm.sh --local-balanced
      Install Ollama if needed, start loopback-only server, pull Qwen3 4B (~2.5GB).
  bash scripts/setup-free-llm.sh --check
      Check available CLI, local endpoint, and presence (not values) of API keys.

Then: opencode  -> /connect for Groq or OpenRouter, or /models for local Ollama.
Do not use this script on Render/Vercel/production. No paid API is enabled by it.
HELP
}
require_codespace() {
  if [[ "${CODESPACES:-}" != "true" && "${CODESPACE_NAME:-}" == "" ]]; then
    echo 'Refusing model installation outside a GitHub Codespace. For details read docs/FREE-LLM-SETUP.md.' >&2
    exit 2
  fi
}
install_agent() {
  require_codespace
  if command -v opencode >/dev/null 2>&1; then
    printf 'OpenCode already available: %s\n' "$(command -v opencode)"
    return
  fi
  command -v npm >/dev/null 2>&1 || { echo 'npm is not installed.' >&2; exit 1; }
  npm install -g @opencode/cli --no-audit --no-fund
  command -v opencode >/dev/null 2>&1 || { echo 'OpenCode installer finished but binary is not on PATH.' >&2; exit 1; }
  opencode --version
}
install_ollama() {
  require_codespace
  if command -v ollama >/dev/null 2>&1; then return; fi
  command -v curl >/dev/null 2>&1 || { echo 'curl is required.' >&2; exit 1; }
  local installer
  installer="$(mktemp)"
  curl -fLsS --proto '=https' --tlsv1.2 https://ollama.com/install.sh -o "$installer"
  # Official vendor installer. Review https://ollama.com/download/linux first.
  sh "$installer"
  rm -f "$installer"
  command -v ollama >/dev/null 2>&1 || { echo 'Ollama binary missing after installation.' >&2; exit 1; }
}
start_ollama() {
  if curl --max-time 2 -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then return; fi
  mkdir -p "$HOME/.cache/bursyar"
  OLLAMA_HOST=127.0.0.1:11434 nohup ollama serve >"$HOME/.cache/bursyar/ollama.log" 2>&1 </dev/null &
  local i
  for i in $(seq 1 25); do
    if curl --max-time 2 -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then return; fi
    sleep 1
  done
  echo "Ollama did not start. See $HOME/.cache/bursyar/ollama.log" >&2
  exit 1
}
local_model() {
  require_codespace
  local name="$1"
  echo "Codespaces is metered. About to download $name. No paid inference API will be used."
  install_ollama
  start_ollama
  ollama pull "$name"
  echo "Local model ready: $name. Launch 'opencode' and choose ollama/$name in /models."
}
check() {
  printf 'OpenCode: '
  if command -v opencode >/dev/null 2>&1; then opencode --version; else echo 'not installed'; fi
  printf 'Ollama: '
  if command -v ollama >/dev/null 2>&1; then ollama --version; else echo 'not installed'; fi
  printf 'Local API: '
  if curl --max-time 2 -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then echo 'responding (127.0.0.1:11434)'; else echo 'not responding'; fi
  for k in OPENROUTER_API_KEY GROQ_API_KEY; do
    if [[ -n "${!k:-}" ]]; then printf '%s: set (not printed)\n' "$k"; else printf '%s: not set\n' "$k"; fi
  done
}
case "${1:---help}" in
  --help|-h) usage ;;
  --agent) install_agent ;;
  --all-small) install_agent; local_model 'qwen3:1.7b' ;;
  --local-small) local_model 'qwen3:1.7b' ;;
  --local-balanced) local_model 'qwen3:4b' ;;
  --check) check ;;
  *) usage; exit 2 ;;
esac
