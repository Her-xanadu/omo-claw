#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
SECRET_FILE="$ROOT_DIR/integration/bridge-runtime/.bridge-secret"

if [ ! -f "$SECRET_FILE" ]; then
  printf '%s\n' "missing secret file: $SECRET_FILE" >&2
  exit 1
fi

export PATH="/Users/herxanadu/.opencode/bin:$PATH"

"$ROOT_DIR/integration/bridge-runtime/bridge-launcher.sh" >/tmp/omo-claw-runtime-health.log 2>&1 &
PID=$!
cleanup() {
  kill "$PID" 2>/dev/null || true
  wait "$PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 5
python3 - <<'PY'
import base64, json, pathlib, urllib.request
root = pathlib.Path.cwd()
secret = (root / 'integration/bridge-runtime/.bridge-secret').read_text().strip()
req = urllib.request.Request('http://127.0.0.1:19222/global/health')
req.add_header('Authorization', 'Basic ' + base64.b64encode(f'opencode:{secret}'.encode()).decode())
with urllib.request.urlopen(req, timeout=10) as resp:
    data = json.loads(resp.read().decode())
    print(json.dumps(data))
PY
