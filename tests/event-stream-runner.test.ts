import { describe, expect, test } from "bun:test"
import { EventBridge } from "../src/event-bridge.ts"
import { EventStreamRunner } from "../src/event-stream-runner.ts"
import { BridgeSdkClient, type OpencodeSdkLike } from "../src/bridge-sdk-client.ts"
import { RuntimeManager } from "../src/runtime-manager.ts"
import { createRuntimeOptions } from "./test-helpers.ts"

describe("EventStreamRunner", () => {
  test("consumes async event stream into event bridge", async () => {
    const sdk: OpencodeSdkLike = {
      global: {
        async health() { return { data: { healthy: true, version: "1.2.21" } } },
        async event() { return { stream: [] as unknown as AsyncIterable<unknown> } },
      },
      session: {
        async create(parameters) { return { data: { id: "ses_1" }, request: parameters } },
        async get(parameters) { return { data: { id: String(parameters.sessionID) }, request: parameters } },
        async messages(parameters) { return { data: [], request: parameters } },
        async promptAsync(parameters) { return { data: undefined, request: parameters } },
        async command(parameters) { return { data: undefined, request: parameters } },
        async todo(parameters) { return { data: [], request: parameters } },
      },
      permission: {
        async reply(parameters) { return { data: true, request: parameters } },
      },
    }

    const bridge = new EventBridge({
      sdkClient: new BridgeSdkClient({
        runtime: new RuntimeManager(createRuntimeOptions()),
        workingDirectory: "/tmp/project",
        sdkFactory: () => sdk,
      }),
    })
    const runner = new EventStreamRunner(bridge)

    async function* stream() {
      yield { type: "message.part.delta", properties: { threadID: "thread-1", sessionID: "ses_1", messageID: "msg_1", delta: "hello" } }
      yield { type: "todo.updated", properties: { threadID: "thread-1", sessionID: "ses_1", todos: [{ content: "ship", status: "pending", priority: "high" }] } }
    }

    const count = await runner.run(stream())

    expect(count).toBe(2)
    expect(bridge.getSummary("ses_1")?.summaryText).toBe("hello")
    expect(bridge.getTodo("ses_1")?.items[0]?.content).toBe("ship")
  })
})
