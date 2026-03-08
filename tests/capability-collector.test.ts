import { describe, expect, test } from "bun:test"
import { CapabilityCollector } from "../compatibility/capability-snapshots/collector.ts"

describe("CapabilityCollector", () => {
  test("collects structured capability snapshot", () => {
    const collector = new CapabilityCollector()
    const snapshot = collector.collect({
      opencodeVersion: "1.2.21",
      omoVersion: "3.11.1",
      sdkNamespace: "v2",
      tools: { ids: ["bash"], mcpServers: ["peekaboo"] },
      commands: { list: ["ultrawork"], aliases: { "/ultrawork": "ultrawork" } },
      agents: { configs: [{ slug: "atlas", hidden: false, hasSystemPrompt: true }] },
      events: { supportedSet: ["message.updated"] },
      permissions: { flow: "prompt-user", toolRestrictions: { atlas: ["tui"] } },
      plugins: { hooks: ["experimental.session.compacting"] },
    })

    expect(snapshot.sdkNamespace).toBe("v2")
    expect(snapshot.tools.ids).toEqual(["bash"])
    expect(snapshot.permissions.toolRestrictions).toEqual({ atlas: ["tui"] })
  })
})
