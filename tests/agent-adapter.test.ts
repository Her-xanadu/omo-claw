import { describe, expect, test } from "bun:test"
import { AgentAdapter } from "../src/agent-adapter.ts"

describe("AgentAdapter", () => {
  test("passes through builtin omoc agent names", () => {
    const adapter = new AgentAdapter()

    const resolved = adapter.resolve({
      requestedAgent: "atlas",
      prompt: "implement runtime manager",
    })

    expect(resolved).toEqual({
      slug: "atlas",
      kind: "builtin",
      skillHints: [],
    })
  })

  test("maps artemis virtual agent to builtin executor plus automation skill", () => {
    const adapter = new AgentAdapter()

    const resolved = adapter.resolve({
      requestedAgent: "artemis",
      prompt: "open browser and scrape page",
    })

    expect(resolved).toEqual({
      slug: "explore",
      kind: "virtual",
      virtualName: "artemis",
      skillHints: ["browser-automation"],
    })
  })

  test("uses keyword routing when no explicit agent is supplied", () => {
    const adapter = new AgentAdapter()

    const resolved = adapter.resolve({
      prompt: "please review architecture and tradeoffs",
    })

    expect(resolved.slug).toBe("oracle")
    expect(resolved.kind).toBe("builtin")
  })
})
