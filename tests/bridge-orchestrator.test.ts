import { describe, expect, test } from "bun:test"
import { BridgeOrchestrator } from "../src/bridge-orchestrator.ts"
import { BridgeSdkClient, type OpencodeSdkLike } from "../src/bridge-sdk-client.ts"
import { PermissionBridge } from "../src/permission-bridge.ts"
import { PolicyEnforcer } from "../src/policy-enforcer.ts"
import { RouteEngine } from "../src/route-engine.ts"
import { RuntimeManager } from "../src/runtime-manager.ts"
import { CorrelationTracker } from "../src/correlation-tracker.ts"
import { SessionGraphManager } from "../src/session-graph-manager.ts"
import { createRuntimeOptions } from "./test-helpers.ts"

function createHarness() {
  const requests: Record<string, Array<Record<string, unknown>>> = {
    create: [],
    messages: [],
    promptAsync: [],
    command: [],
    reply: [],
    respondPermission: [],
  }

  const sdk: OpencodeSdkLike = {
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
        requests.create.push(parameters)
        return { data: { id: "ses_root_1", title: "root" }, request: parameters }
      },
      async get(parameters) {
        return { data: { id: String(parameters.sessionID), title: "root" }, request: parameters }
      },
      async messages(parameters) {
        requests.messages.push(parameters)
        return {
          data: [{ info: { id: "msg_before", role: "assistant" }, parts: [] }],
          request: parameters,
        }
      },
      async promptAsync(parameters) {
        requests.promptAsync.push(parameters)
        return { data: undefined, request: parameters }
      },
      async command(parameters) {
        requests.command.push(parameters)
        return { data: { ok: true }, request: parameters }
      },
      async todo(parameters) {
        return { data: [], request: parameters }
      },
      async respondPermission(parameters) {
        requests.respondPermission.push(parameters)
        return { data: true, request: parameters }
      },
    },
    permission: {
      async reply(parameters) {
        requests.reply.push(parameters)
        return { data: true, request: parameters }
      },
    },
  }

  const runtimeManager = new RuntimeManager(createRuntimeOptions(), {
    spawn() {
      return {
        pid: 31337,
        exitCode: null,
        killed: false,
        kill() { return true },
        once() { return this },
      }
    },
    fetch: async (_input, _init) => new Response(JSON.stringify({ healthy: true, version: "1.2.21" }), { status: 200 }),
    sleep: async () => {},
  })

  const sdkClient = new BridgeSdkClient({
    runtime: runtimeManager,
    workingDirectory: "/tmp/project",
    sdkFactory: () => sdk,
  })

  const orchestrator = new BridgeOrchestrator({
    runtimeManager,
    sdkClient,
    routeEngine: new RouteEngine({ commandAliases: [{ trigger: "/omo_claw_status", target: "omo_claw_status" }] }),
    sessionGraph: new SessionGraphManager(),
    correlationTracker: new CorrelationTracker(),
    permissionBridge: new PermissionBridge({ timeoutMs: 120000, fallbackReply: "reject" }),
    policyEnforcer: new PolicyEnforcer(),
    capabilities: ["runtime", "browser-automation"],
  })

  return { orchestrator, requests }
}

describe("BridgeOrchestrator", () => {
  test("creates a root session and dispatches command routes", async () => {
    const { orchestrator, requests } = createHarness()

    const result = await orchestrator.executeTask({
      threadID: "thread-1",
      title: "Bridge Thread",
      commandHint: "/omo_claw_status",
      args: "",
      model: "openai/gpt-5.4",
      prompt: "status",
    })

    expect(result.type).toBe("command")
    expect(requests.create).toHaveLength(1)
    expect(requests.command[0]).toEqual({
      sessionID: "ses_root_1",
      directory: "/tmp/project",
      command: "omo_claw_status",
      arguments: "",
      agent: undefined,
      model: "openai/gpt-5.4",
    })
  })

  test("records known messages before promptAsync agent dispatch", async () => {
    const { orchestrator, requests } = createHarness()

    const result = await orchestrator.executeTask({
      threadID: "thread-2",
      title: "Bridge Thread",
      commandHint: "",
      args: "",
      model: "openai/gpt-5.4",
      prompt: "implement runtime manager",
      requestedAgent: "atlas",
    })

    expect(result.type).toBe("agent")
    expect(requests.messages).toHaveLength(1)
    expect(requests.promptAsync[0]).toEqual({
      sessionID: "ses_root_1",
      directory: "/tmp/project",
      agent: "atlas",
      model: { providerID: "openai", modelID: "gpt-5.4" },
      noReply: undefined,
      parts: [{ type: "text", text: "implement runtime manager" }],
    })
  })

  test("tracks event-based message correlation for known thread session", async () => {
    const { orchestrator } = createHarness()

    await orchestrator.executeTask({
      threadID: "thread-2",
      title: "Bridge Thread",
      commandHint: "",
      args: "",
      model: "openai/gpt-5.4",
      prompt: "implement runtime manager",
      requestedAgent: "atlas",
    })

    orchestrator.handleEvent({
      type: "message.updated",
      properties: {
        info: {
          id: "msg_ignored",
          sessionID: "ses_unknown",
        },
      },
    })

    const graphResult = orchestrator.handleEvent({
      type: "message.updated",
      properties: {
        info: {
          id: "msg_new",
          sessionID: "ses_root_1",
        },
      },
    })

    expect(graphResult).toEqual({
      threadID: "thread-2",
      sessionID: "ses_root_1",
      messageID: "msg_new",
      source: "event",
    })
    expect(orchestrator.getSummary("ses_root_1")?.messageID).toBe("msg_new")
  })

  test("captures permission requests and replies through both endpoints", async () => {
    const { orchestrator, requests } = createHarness()

    await orchestrator.executeTask({
      threadID: "thread-3",
      title: "Bridge Thread",
      commandHint: "",
      args: "",
      model: "openai/gpt-5.4",
      prompt: "implement runtime manager",
      requestedAgent: "atlas",
    })

    orchestrator.handleEvent({
      type: "permission.asked",
      properties: {
        request: {
          id: "perm_1",
          sessionID: "ses_root_1",
          permission: "bash",
          patterns: ["npm *"],
          metadata: {},
          always: [],
          tool: {
            messageID: "msg_1",
            callID: "call_1",
          },
        },
      },
    })

    await orchestrator.replyToPermission("perm_1", "once")

    expect(requests.reply[0]).toEqual({
      requestID: "perm_1",
      directory: "/tmp/project",
      reply: "once",
      message: undefined,
    })
    expect(requests.respondPermission[0]).toEqual({
      sessionID: "ses_root_1",
      permissionID: "perm_1",
      directory: "/tmp/project",
      response: "once",
    })
  })

  test("stores todo snapshot from incoming todo event", async () => {
    const { orchestrator } = createHarness()

    await orchestrator.executeTask({
      threadID: "thread-4",
      title: "Bridge Thread",
      commandHint: "",
      args: "",
      model: "openai/gpt-5.4",
      prompt: "plan work",
      requestedAgent: "atlas",
    })

    orchestrator.handleEvent({
      type: "todo.updated",
      properties: {
        threadID: "thread-4",
        sessionID: "ses_root_1",
        todos: [{ content: "implement", status: "in_progress", priority: "high" }],
      },
    })

    expect(orchestrator.getTodoSnapshot("ses_root_1")?.items).toEqual([
      { content: "implement", status: "in_progress", priority: "high" },
    ])
  })

  test("builds explainable status surface", async () => {
    const { orchestrator } = createHarness()

    await orchestrator.executeTask({
      threadID: "thread-5",
      title: "Bridge Thread",
      commandHint: "",
      args: "",
      model: "openai/gpt-5.4",
      prompt: "status",
      requestedAgent: "atlas",
    })
    orchestrator.handleEvent({
      type: "todo.updated",
      properties: {
        threadID: "thread-5",
        sessionID: "ses_root_1",
        todos: [{ content: "observe", status: "pending", priority: "medium" }],
      },
    })

    const status = orchestrator.getStatus()

    expect(status.runtimeBaseUrl).toBe("http://127.0.0.1:19222")
    expect(status.pendingPermissions).toEqual([])
    expect(status.threads[0]?.threadID).toBe("thread-5")
    expect(status.threads[0]?.rootSessionID).toBe("ses_root_1")
    expect(status.threads[0]?.children).toEqual([])
    expect(status.threads[0]?.summary?.todoVersion).toBe(1)
    expect(status.threads[0]?.todo?.items).toEqual([
      { content: "observe", status: "pending", priority: "medium" },
    ])
  })
})
