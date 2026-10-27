#!/bin/zsh
# Finder or Terminal entry point. No keys, passwords or budget values in this file.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd -- "${0:A:h}" || exit 1
if ! command -v node >/dev/null 2>&1; then
  print -u2 'Node.js 24.12 or newer is required.'
  exit 1
fi
if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>24||(a===24&&b>=12)?0:1)'; then
  print -u2 'Node.js 24.12 or newer is required.'
  exit 1
fi
exec node verification/macos-start.mjs
