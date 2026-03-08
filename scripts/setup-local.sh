#!/bin/sh
set -eu

if ! command -v bun >/dev/null 2>&1; then
  printf '%s\n' "bun is required" >&2
  exit 1
fi

cp -n integration/bridge-runtime/.bridge-secret.example integration/bridge-runtime/.bridge-secret || true
chmod 600 integration/bridge-runtime/.bridge-secret

bun install
bun run compile:definitions

printf '%s\n' "Local setup complete. Next steps:"
printf '%s\n' "  1. edit integration/bridge-runtime/.bridge-secret if needed"
printf '%s\n' "  2. run ./integration/bridge-runtime/bridge-launcher.sh"
printf '%s\n' "  3. verify with ./tests/live/runtime-health.smoke.sh"
