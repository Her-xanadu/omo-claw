import { describe, expect, test } from "bun:test"
import {
  PermissionBridge,
  type PermissionRequest,
} from "../src/permission-bridge.ts"

function createRequest(): PermissionRequest {
  return {
    id: "perm_123",
    sessionID: "ses_123",
    permission: "bash",
    patterns: ["npm *"],
    metadata: {},
    always: [],
    tool: {
      messageID: "msg_123",
      callID: "call_123",
    },
  }
}

describe("PermissionBridge", () => {
  test("buildSessionReply targets session-scoped permission endpoint", () => {
    const bridge = new PermissionBridge({ timeoutMs: 120000, fallbackReply: "reject" })

    const reply = bridge.buildSessionReply(createRequest(), "once")

    expect(reply.path).toEqual({
      sessionID: "ses_123",
      permissionID: "perm_123",
    })
    expect(reply.body).toEqual({ response: "once" })
  })

  test("buildGlobalReply targets request-scoped fallback endpoint", () => {
    const bridge = new PermissionBridge({ timeoutMs: 120000, fallbackReply: "reject" })

    const reply = bridge.buildGlobalReply(createRequest(), "always", "approved by bridge")

    expect(reply.path).toEqual({ requestID: "perm_123" })
    expect(reply.body).toEqual({
      reply: "always",
      message: "approved by bridge",
    })
  })

  test("buildTimeoutFallback returns configured reject response", () => {
    const bridge = new PermissionBridge({ timeoutMs: 120000, fallbackReply: "reject" })

    const fallback = bridge.buildTimeoutFallback(createRequest())

    expect(fallback.reply).toBe("reject")
    expect(fallback.message).toContain("timed out after 120000ms")
    expect(fallback.requestID).toBe("perm_123")
  })
})
