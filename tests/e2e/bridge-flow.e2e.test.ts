import { describe, expect, test } from "bun:test"
import { BridgeOrchestrator } from "../../src/bridge-orchestrator.ts"
import { BridgeSdkClient, type OpencodeSdkLike } from "../../src/bridge-sdk-client.ts"
import { EventBridge } from "../../src/event-bridge.ts"
import { RuntimeManager } from "../../src/runtime-manager.ts"
import { createRuntimeOptions } from "../test-helpers.ts"

describe("Bridge flow e2e", () => {
  test("runs command, agent, todo sync and health in one flow", async () => {
    const seen: string[] = []
    const sdk: OpencodeSdkLike = {
      global: {
        async health() {
          seen.push("health")
          return { data: { healthy: true, version: "1.2.21" } }
        },
        async event() {
          return { stream: [] as unknown as AsyncIterable<unknown> }
        },
      },
      session: {
        async create(parameters) {
          seen.push(`create:${String(parameters.title)}`)
          return { data: { id: "ses_e2e", title: String(parameters.title) }, request: parameters }
        },
        async get(parameters) {
          return { data: { id: String(parameters.sessionID) }, request: parameters }
        },
        async messages(parameters) {
          return { data: [{ info: { id: "msg_before" }, parts: [] }], request: parameters }
        },
        async promptAsync(parameters) {
          seen.push(`prompt:${String(parameters.agent ?? "context")}`)
          return { data: undefined, request: parameters }
        },
        async command(parameters) {
          seen.push(`command:${String(parameters.command)}`)
          return { data: { ok: true }, request: parameters }
        },
        async todo(parameters) {
          return { data: [{ content: "ship", status: "pending", priority: "high" }], request: parameters }
        },
        async respondPermission(parameters) {
          seen.push(`respond:${String(parameters.permissionID)}`)
          return { data: true, request: parameters }
        },
      },
      permission: {
        async reply(parameters) {
          seen.push(`reply:${String(parameters.requestID)}`)
          return { data: true, request: parameters }
        },
      },
    }

    const runtimeManager = new RuntimeManager(createRuntimeOptions(), {
      spawn() {
        return { pid: 999, exitCode: null, killed: false, kill() { return true }, once() { return this } }
      },
      fetch: async () => new Response(JSON.stringify({ healthy: true, version: "1.2.21" }), { status: 200 }),
      sleep: async () => {},
    })
    const sdkClient = new BridgeSdkClient({ runtime: runtimeManager, workingDirectory: "/tmp/e2e", sdkFactory: () => sdk })
    const eventBridge = new EventBridge({ sdkClient })
    const orchestrator = new BridgeOrchestrator({ runtimeManager, sdkClient, eventBridge, capabilities: ["runtime", "browser-automation"] })

    const commandResult = await orchestrator.executeTask({
      threadID: "thread-e2e-command",
      title: "e2e",
      commandHint: "/unknown",
      args: "",
      model: "openai/gpt-5.4",
      prompt: "architecture tradeoff",
      requestedAgent: "oracle",
    })
    orchestrator.handleEvent({
      type: "todo.updated",
      properties: {
        threadID: "thread-e2e-command",
        sessionID: commandResult.sessionID,
        todos: [{ content: "ship", status: "pending", priority: "high" }],
      },
    })
    const health = await orchestrator.getHealth()

    expect(commandResult.type).toBe("agent")
    expect(orchestrator.getTodoSnapshot("ses_e2e")?.items[0].content).toBe("ship")
    expect(health.healthy).toBeTrue()
    expect(seen).toContain("prompt:oracle")
  })
})
