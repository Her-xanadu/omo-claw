import { describe, expect, test } from "bun:test"
import { EventEmitter } from "node:events"
import { RuntimeManager, type ChildProcessLike } from "../src/runtime-manager.ts"
import { createRuntimeOptions } from "./test-helpers.ts"

class FakeChildProcess extends EventEmitter implements ChildProcessLike {
  pid = 4242
  exitCode: number | null = null
  killed = false

  kill(): boolean {
    this.killed = true
    this.exitCode = 0
    return true
  }
}

describe("RuntimeManager", () => {
  test("buildServerEnv creates isolated bridge runtime variables", () => {
    const manager = new RuntimeManager(createRuntimeOptions())

    const env = manager.buildServerEnv()

    expect(env.XDG_CONFIG_HOME).toContain("integration/bridge-runtime/xdg/config")
    expect(env.XDG_DATA_HOME).toContain("integration/bridge-runtime/xdg/data")
    expect(env.XDG_STATE_HOME).toContain("integration/bridge-runtime/xdg/state")
    expect(env.OPENCODE_CONFIG_DIR).toContain("integration/bridge-runtime/.opencode")
    expect(env.OPENCODE_SERVER_PASSWORD).toBe("secret-123")
  })

  test("buildSpawnSpec pins host, port and auth health endpoint", () => {
    const manager = new RuntimeManager(createRuntimeOptions())

    const spec = manager.buildSpawnSpec()

    expect(spec.command).toBe("opencode")
    expect(spec.args).toEqual(["serve", "--port", "19222", "--hostname", "127.0.0.1"])
    expect(spec.healthUrl).toBe("http://127.0.0.1:19222/global/health")
    expect(spec.basicAuthHeader).toBe("Basic b3BlbmNvZGU6c2VjcmV0LTEyMw==")
  })

  test("healthcheck request includes Authorization header", () => {
    const manager = new RuntimeManager(createRuntimeOptions())

    const request = manager.buildHealthcheckRequest()

    expect(request.url).toBe("http://127.0.0.1:19222/global/health")
    expect(request.init.headers).toEqual({
      Authorization: "Basic b3BlbmNvZGU6c2VjcmV0LTEyMw==",
    })
  })

  test("start spawns process and waits for health", async () => {
    const child = new FakeChildProcess()
    const spawnCalls: Array<{ command: string; args: string[] }> = []
    let fetchCount = 0
    const manager = new RuntimeManager(createRuntimeOptions(), {
      spawn(command, args) {
        spawnCalls.push({ command, args })
        return child
      },
      fetch: async (_input, _init) => {
        fetchCount += 1
        return new Response(JSON.stringify({ healthy: fetchCount >= 2, version: "1.2.21" }), { status: 200 })
      },
      sleep: async () => {},
    })

    const result = await manager.start()

    expect(spawnCalls).toEqual([
      { command: "opencode", args: ["serve", "--port", "19222", "--hostname", "127.0.0.1"] },
    ])
    expect(result.pid).toBe(4242)
    expect(result.baseUrl).toBe("http://127.0.0.1:19222")
    expect(manager.isRunning()).toBeTrue()
  })

  test("stop terminates spawned process", async () => {
    const child = new FakeChildProcess()
    const manager = new RuntimeManager(createRuntimeOptions(), {
      spawn() {
        return child
      },
      fetch: async (_input, _init) => new Response(JSON.stringify({ healthy: true, version: "1.2.21" }), { status: 200 }),
      sleep: async () => {},
    })

    await manager.start()
    await manager.stop()

    expect(child.killed).toBeTrue()
    expect(manager.isRunning()).toBeFalse()
  })
})
