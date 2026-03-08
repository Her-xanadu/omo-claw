import { describe, expect, test } from "bun:test"
import sdkNamespaceLock from "../../contracts/sdk-namespace.lock.json" with { type: "json" }
import todoSemantics from "../../contracts/todo-semantics.contract.json" with { type: "json" }
import permissionFlow from "../../contracts/permission-flow.contract.json" with { type: "json" }
import bridgeConfig from "../../integration/bridge-runtime/opencode.bridge.json" with { type: "json" }
import capabilityBaseline from "../../compatibility/capability-snapshots/capability-baseline.json" with { type: "json" }
import { CAPABILITY_SNAPSHOT_REQUIRED_TOP_LEVEL_KEYS } from "../../compatibility/capability-snapshots/capability-snapshot.schema.ts"

describe("phase 0 contracts", () => {
  test("locks SDK namespace to v2 with known directory header", () => {
    expect(sdkNamespaceLock.namespace).toBe("v2")
    expect(sdkNamespaceLock.bridgeExpectations.directoryHeader).toBe("x-opencode-directory")
  })

  test("freezes todo semantics as read-only from SDK perspective", () => {
    expect(todoSemantics.direction).toBe("omo-to-openclaw")
    expect(todoSemantics.sdkCapabilities.setTodoApiAvailable).toBeFalse()
    expect(todoSemantics.sdkCapabilities.writeEndpoint).toBeNull()
  })

  test("requires both session and global permission reply paths", () => {
    expect(permissionFlow.sdkCapabilities.sessionScopedReplyEndpoint).toContain("/session/")
    expect(permissionFlow.sdkCapabilities.globalReplyEndpoint).toBe("/permission/{requestID}/reply")
    expect(permissionFlow.sdkCapabilities.replyShapes.sessionScoped.values).toEqual(["once", "always", "reject"])
    expect(permissionFlow.sdkCapabilities.replyShapes.global.field).toBe("reply")
    expect(permissionFlow.bridgeRules.fallbackReply).toBe("reject")
  })

  test("bridge config stays aligned with contracts", () => {
    expect(bridgeConfig.bridge.sdkNamespace).toBe(sdkNamespaceLock.namespace)
    expect(bridgeConfig.bridge.directoryHeader).toBe(sdkNamespaceLock.bridgeExpectations.directoryHeader)
    expect(bridgeConfig.policy.todoSync).toBe(todoSemantics.direction)
  })

  test("capability snapshot schema exports stable required keys", () => {
    expect(CAPABILITY_SNAPSHOT_REQUIRED_TOP_LEVEL_KEYS).toEqual([
      "capturedAt",
      "opencodeVersion",
      "omoVersion",
      "sdkNamespace",
      "tools",
      "commands",
      "agents",
      "events",
      "permissions",
      "plugins",
    ])
  })

  test("capability baseline uses the locked namespace and records key event hooks", () => {
    expect(capabilityBaseline.sdkNamespace).toBe(sdkNamespaceLock.namespace)
    expect(capabilityBaseline.events.supportedSet).toContain("message.updated")
    expect(capabilityBaseline.plugins.hooks).toContain("experimental.session.compacting")
  })
})
