import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const launcherPath = new URL("../../integration/bridge-runtime/bridge-launcher.sh", import.meta.url)
const launcher = readFileSync(launcherPath, "utf8")

describe("bridge launcher", () => {
  test("exports isolated XDG and OpenCode env vars", () => {
    expect(launcher).toContain('export XDG_CONFIG_HOME="$RUNTIME_DIR/xdg/config"')
    expect(launcher).toContain('export XDG_DATA_HOME="$RUNTIME_DIR/xdg/data"')
    expect(launcher).toContain('export XDG_STATE_HOME="$RUNTIME_DIR/xdg/state"')
    expect(launcher).toContain('export OPENCODE_CONFIG="$RUNTIME_DIR/opencode.bridge.json"')
    expect(launcher).toContain('export OPENCODE_CONFIG_DIR="$RUNTIME_DIR/.opencode"')
  })

  test("launches dedicated headless server on pinned bridge port", () => {
    expect(launcher).toContain("exec opencode serve --port 19222 --hostname 127.0.0.1")
  })

  test("fails fast when bridge secret is missing", () => {
    expect(launcher).toContain('if [ ! -f "$SECRET_FILE" ]; then')
    expect(launcher).toContain('Missing bridge secret: $SECRET_FILE')
  })
})
