#!/bin/sh
set -eu

OS_NAME=$(uname -s)

if ! command -v bun >/dev/null 2>&1; then
  printf '%s\n' "bun is required. Install from https://bun.sh/" >&2
  exit 1
fi

if ! command -v opencode >/dev/null 2>&1 && [ ! -x "$HOME/.opencode/bin/opencode" ]; then
  printf '%s\n' "opencode CLI is required. Ensure 'opencode' is in PATH or installed at ~/.opencode/bin/opencode" >&2
  exit 1
fi

case "$OS_NAME" in
  Darwin)
    ;;
  Linux)
    printf '%s\n' "Warning: Linux is not the primary tested platform. Continue only if your OpenClaw + opencode environment already works." >&2
    ;;
  *)
    printf '%s\n' "Unsupported operating system: $OS_NAME. This project is currently documented for macOS and partially for Linux." >&2
    exit 1
    ;;
esac

cp -n integration/bridge-runtime/.bridge-secret.example integration/bridge-runtime/.bridge-secret || true
chmod 600 integration/bridge-runtime/.bridge-secret

bun install
bun run compile:definitions

printf '%s\n' "Local setup complete. Next steps:"
printf '%s\n' "  platform: $OS_NAME"
printf '%s\n' "  1. edit integration/bridge-runtime/.bridge-secret if needed"
printf '%s\n' "  2. run ./integration/bridge-runtime/bridge-launcher.sh"
printf '%s\n' "  3. verify with ./tests/live/runtime-health.smoke.sh"
