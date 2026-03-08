import { describe, expect, test } from "bun:test"
import { BridgeSdkClient, type OpencodeSdkLike } from "../src/bridge-sdk-client.ts"
import { RuntimeManager } from "../src/runtime-manager.ts"
import { createRuntimeOptions } from "./test-helpers.ts"

function createFakeSdk(): OpencodeSdkLike {
  return {
    global: {
      async health() {
        return { data: { healthy: true, version: "1.2.21" } }
      },
      async event() {
        return { stream: [] as unknown as AsyncIterable<unknown> }
      },
    },
    session: {
      async create(parameters) {
        return { data: { id: "ses_created", title: "created" }, request: parameters }
      },
      async get(parameters) {
        return { data: { id: String(parameters.sessionID), title: "loaded" }, request: parameters }
      },
      async messages(parameters) {
        return { data: [{ info: { id: "msg_existing", role: "assistant" }, parts: [] }], request: parameters }
      },
      async promptAsync(parameters) {
        return { data: undefined, request: parameters }
      },
      async command(parameters) {
        return { data: { ok: true }, request: parameters }
      },
      async todo(parameters) {
        return { data: [{ content: "a", status: "pending", priority: "high" }], request: parameters }
      },
      async respondPermission(parameters) {
        return { data: true, request: parameters }
      },
    },
    permission: {
      async reply(parameters) {
        return { data: true, request: parameters }
      },
    },
  }
}

describe("BridgeSdkClient", () => {
  test("buildClientConfig injects baseUrl, directory header and basic auth", () => {
    const runtime = new RuntimeManager(createRuntimeOptions())
    const bridge = new BridgeSdkClient({
      runtime,
      workingDirectory: "/tmp/project",
      sdkFactory: () => createFakeSdk(),
    })

    const config = bridge.buildClientConfig()

    expect(config.baseUrl).toBe("http://127.0.0.1:19222")
    expect(config.directory).toBe("/tmp/project")
    expect(config.headers).toEqual({
      Authorization: "Basic b3BlbmNvZGU6c2VjcmV0LTEyMw==",
    })
  })

  test("health delegates to sdk global.health", async () => {
    const runtime = new RuntimeManager(createRuntimeOptions())
    const bridge = new BridgeSdkClient({
      runtime,
      workingDirectory: "/tmp/project",
      sdkFactory: () => createFakeSdk(),
    })

    const result = await bridge.health()

    expect(result.data.healthy).toBeTrue()
    expect(result.data.version).toBe("1.2.21")
  })

  test("createSession forwards bridge directory", async () => {
    const runtime = new RuntimeManager(createRuntimeOptions())
    const bridge = new BridgeSdkClient({
      runtime,
      workingDirectory: "/tmp/project",
      sdkFactory: () => createFakeSdk(),
    })

    const result = await bridge.createSession({ title: "Bridge Root" })

    expect(result.request).toEqual({
      directory: "/tmp/project",
      parentID: undefined,
      title: "Bridge Root",
    })
  })

  test("promptAsync forwards session scoped parameters with normalized directory", async () => {
    const runtime = new RuntimeManager(createRuntimeOptions())
    const bridge = new BridgeSdkClient({
      runtime,
      workingDirectory: "/tmp/project",
      sdkFactory: () => createFakeSdk(),
    })

    const result = await bridge.promptAsync({
      sessionID: "ses_123",
      agent: "atlas",
      model: { providerID: "openai", modelID: "gpt-5.4" },
      parts: [{ type: "text", text: "hello" }],
    })

    expect(result.request).toEqual({
      sessionID: "ses_123",
      directory: "/tmp/project",
      agent: "atlas",
      model: { providerID: "openai", modelID: "gpt-5.4" },
      noReply: undefined,
      parts: [{ type: "text", text: "hello" }],
    })
  })

  test("respondSessionPermission uses session scoped endpoint shape", async () => {
    const runtime = new RuntimeManager(createRuntimeOptions())
    const bridge = new BridgeSdkClient({
      runtime,
      workingDirectory: "/tmp/project",
      sdkFactory: () => createFakeSdk(),
    })

    const result = await bridge.respondSessionPermission({
      sessionID: "ses_123",
      permissionID: "perm_123",
      response: "always",
    })

    expect(result.request).toEqual({
      sessionID: "ses_123",
      permissionID: "perm_123",
      directory: "/tmp/project",
      response: "always",
    })
  })

  test("replyPermission uses global request endpoint shape", async () => {
    const runtime = new RuntimeManager(createRuntimeOptions())
    const bridge = new BridgeSdkClient({
      runtime,
      workingDirectory: "/tmp/project",
      sdkFactory: () => createFakeSdk(),
    })

    const result = await bridge.replyPermission({
      requestID: "perm_123",
      reply: "reject",
      message: "timeout",
    })

    expect(result.request).toEqual({
      requestID: "perm_123",
      directory: "/tmp/project",
      reply: "reject",
      message: "timeout",
    })
  })
})
