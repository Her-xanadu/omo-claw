import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { RuntimeManagerOptions } from "../src/runtime-manager.ts"

export function createRuntimeOptions(prefix = "omo-claw-"): RuntimeManagerOptions {
  const root = mkdtempSync(join(tmpdir(), prefix))
  const runtimeDir = join(root, "integration", "bridge-runtime")
  mkdirSync(join(runtimeDir, "xdg", "config"), { recursive: true })
  mkdirSync(join(runtimeDir, "xdg", "data"), { recursive: true })
  mkdirSync(join(runtimeDir, "xdg", "state"), { recursive: true })
  mkdirSync(join(runtimeDir, ".opencode"), { recursive: true })
  writeFileSync(join(runtimeDir, ".bridge-secret"), "secret-123\n")

  return {
    rootDir: root,
    runtimeDir,
    port: 19222,
    hostname: "127.0.0.1",
    serverPasswordFile: join(runtimeDir, ".bridge-secret"),
    configPath: join(runtimeDir, "opencode.bridge.json"),
    configDir: join(runtimeDir, ".opencode"),
    xdgConfigHome: join(runtimeDir, "xdg", "config"),
    xdgDataHome: join(runtimeDir, "xdg", "data"),
    xdgStateHome: join(runtimeDir, "xdg", "state"),
  }
}
