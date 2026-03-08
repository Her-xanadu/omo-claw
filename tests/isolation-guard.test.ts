import { describe, expect, test } from "bun:test"
import { IsolationGuard } from "../src/isolation-guard.ts"

describe("IsolationGuard", () => {
  test("accepts fully isolated bridge runtime", () => {
    const guard = new IsolationGuard({
      bridgeBaseUrl: "http://127.0.0.1:19222",
      bridgeConfigDir: "/tmp/bridge/.opencode",
      bridgePluginDir: "/tmp/bridge/.opencode/plugins",
      bridgeWorktree: "/tmp/bridge-worktree",
      tuiBaseUrl: "http://127.0.0.1:4096",
      tuiConfigDir: "/Users/herxanadu/.config/opencode",
      tuiPluginDir: "/Users/herxanadu/.config/opencode/plugins",
      tuiWorktree: "/Users/herxanadu/project",
    })

    expect(guard.evaluate().ok).toBeTrue()
  })

  test("rejects shared config dir and shared server", () => {
    const guard = new IsolationGuard({
      bridgeBaseUrl: "http://127.0.0.1:4096",
      bridgeConfigDir: "/Users/herxanadu/.config/opencode",
      bridgePluginDir: "/tmp/bridge/.opencode/plugins",
      bridgeWorktree: "/tmp/bridge-worktree",
      tuiBaseUrl: "http://127.0.0.1:4096",
      tuiConfigDir: "/Users/herxanadu/.config/opencode",
      tuiPluginDir: "/Users/herxanadu/.config/opencode/plugins",
      tuiWorktree: "/Users/herxanadu/project",
    })

    const result = guard.evaluate()

    expect(result.ok).toBeFalse()
    expect(result.violations).toContain("bridge and daily TUI must not share server baseUrl")
    expect(result.violations).toContain("bridge and daily TUI must not share config dir")
  })

  test("rejects shared plugin dir and shared worktree", () => {
    const guard = new IsolationGuard({
      bridgeBaseUrl: "http://127.0.0.1:19222",
      bridgeConfigDir: "/tmp/bridge/.opencode",
      bridgePluginDir: "/Users/herxanadu/.config/opencode/plugins",
      bridgeWorktree: "/Users/herxanadu/project",
      tuiBaseUrl: "http://127.0.0.1:4096",
      tuiConfigDir: "/Users/herxanadu/.config/opencode",
      tuiPluginDir: "/Users/herxanadu/.config/opencode/plugins",
      tuiWorktree: "/Users/herxanadu/project",
    })

    const result = guard.evaluate()

    expect(result.ok).toBeFalse()
    expect(result.violations).toContain("bridge and daily TUI must not share plugin dir")
    expect(result.violations).toContain("bridge and daily TUI should not share worktree")
  })
})
