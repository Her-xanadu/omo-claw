#!/bin/sh
set -eu

usage() {
  cat <<'EOF'
Usage: omo-claw-install [target-dir]

Clone the omo claw repository into target-dir, run the local setup script,
and print the remaining OpenClaw registration steps.

Arguments:
  target-dir           Optional install destination.
                       Default: $PWD/omo-claw

Environment:
  OMO_CLAW_INSTALL_DIR Override the default install destination.
  OMO_CLAW_REPO_URL    Override the git clone source.
  OMO_CLAW_SKIP_SETUP  Set to 1 to skip ./scripts/setup-local.sh.
EOF
}

case "${1:-}" in
  -h|--help)
    usage
    exit 0
    ;;
esac

if ! command -v git >/dev/null 2>&1; then
  printf '%s\n' "git is required to install omo claw." >&2
  exit 1
fi

REPO_URL=${OMO_CLAW_REPO_URL:-https://github.com/Her-xanadu/omo-claw.git}
TARGET_DIR=${1:-${OMO_CLAW_INSTALL_DIR:-$(pwd)/omo-claw}}
TARGET_PARENT=$(dirname "$TARGET_DIR")

if [ -e "$TARGET_DIR" ]; then
  printf '%s\n' "Target path already exists: $TARGET_DIR" >&2
  printf '%s\n' "Choose an empty directory or remove the existing path first." >&2
  exit 1
fi

mkdir -p "$TARGET_PARENT"
git clone "$REPO_URL" "$TARGET_DIR"

if [ "${OMO_CLAW_SKIP_SETUP:-0}" != "1" ]; then
  (
    cd "$TARGET_DIR"
    ./scripts/setup-local.sh
  )
fi

printf '%s\n' "omo claw source installed at: $TARGET_DIR"
printf '%s\n' "Next steps:"
printf '%s\n' "  1. register $TARGET_DIR/openclaw.plugin.json with OpenClaw"
printf '%s\n' "  2. use plugin id: omo-claw"
printf '%s\n' "  3. start: $TARGET_DIR/integration/bridge-runtime/bridge-launcher.sh"
printf '%s\n' "  4. verify: $TARGET_DIR/tests/live/runtime-health.smoke.sh"
