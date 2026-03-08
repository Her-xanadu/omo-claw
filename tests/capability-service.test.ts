import { describe, expect, test } from "bun:test"
import { CapabilityService } from "../src/capability-service.ts"

describe("CapabilityService", () => {
  test("returns current snapshot and compatibility decision against baseline", () => {
    const service = new CapabilityService()
    const result = service.snapshotAndEvaluate({
      opencodeVersion: "1.2.21",
      omoVersion: "3.11.1",
      sdkNamespace: "v2",
      tools: { ids: ["bash"], mcpServers: ["peekaboo"] },
      commands: { list: ["omo_claw_status"], aliases: { "/omo_claw_status": "omo_claw_status" } },
      agents: { configs: [{ slug: "atlas", hidden: false, hasSystemPrompt: true }] },
      events: { supportedSet: ["message.updated", "todo.updated"] },
      permissions: { flow: "prompt-user", toolRestrictions: { atlas: ["/tui"] } },
      plugins: { hooks: ["experimental.session.compacting", "shell.env"] },
    })

    expect(result.current.sdkNamespace).toBe("v2")
    expect(result.compatibility.mode).toBe("safe")
    expect(result.compatibility.changes).toContain("commands")
  })
})
