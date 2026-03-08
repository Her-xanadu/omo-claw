#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
RUNTIME_DIR="$ROOT_DIR/integration/bridge-runtime"
SECRET_FILE="$RUNTIME_DIR/.bridge-secret"

if [ ! -f "$SECRET_FILE" ]; then
  printf '%s\n' "Missing bridge secret: $SECRET_FILE" >&2
  exit 1
fi

export XDG_CONFIG_HOME="$RUNTIME_DIR/xdg/config"
export XDG_DATA_HOME="$RUNTIME_DIR/xdg/data"
export XDG_STATE_HOME="$RUNTIME_DIR/xdg/state"
export OPENCODE_CONFIG="$RUNTIME_DIR/opencode.bridge.json"
export OPENCODE_CONFIG_DIR="$RUNTIME_DIR/.opencode"
export OPENCODE_SERVER_PASSWORD=$(tr -d '\r\n' < "$SECRET_FILE")

exec opencode serve --port 19222 --hostname 127.0.0.1
