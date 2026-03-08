import { describe, expect, test } from "bun:test"
import { AdapterRegistry } from "../compatibility/adapter-registry/adapter-registry.ts"
import type { CapabilitySnapshot } from "../compatibility/capability-snapshots/capability-snapshot.schema.ts"
import { CompatibilityController } from "../src/compatibility-controller.ts"

function snapshot(namespace: "v1" | "v2"): CapabilitySnapshot {
  return {
    capturedAt: "2026-03-08T00:00:00.000Z",
    opencodeVersion: "1.2.21",
    omoVersion: "3.11.1",
    sdkNamespace: namespace,
    tools: { ids: ["bash"], mcpServers: ["peekaboo"] },
    commands: { list: ["ultrawork"], aliases: { "/ultrawork": "ultrawork" } },
    agents: { configs: [{ slug: "atlas", hidden: false, hasSystemPrompt: true }] },
    events: { supportedSet: ["message.updated"] },
    permissions: { flow: "prompt-user", toolRestrictions: {} },
    plugins: { hooks: ["experimental.session.compacting"] },
  }
}

describe("CompatibilityController", () => {
  test("maps diff severity to adapter set", () => {
    const registry = new AdapterRegistry()
    registry.register({ mode: "quarantine", name: "namespace-fallback" })
    const controller = new CompatibilityController({ registry })

    expect(controller.evaluate(snapshot("v2"), snapshot("v1"))).toEqual({
      mode: "quarantine",
      changes: ["sdkNamespace:v2->v1"],
      adapters: ["namespace-fallback"],
    })
  })
})
