import { describe, expect, test } from "bun:test"
import { RouteEngine } from "../src/route-engine.ts"

describe("RouteEngine", () => {
  test("prefers command execution when adapter resolves a slash command", () => {
    const engine = new RouteEngine({
      commandAliases: [{ trigger: "/ultrawork", target: "ultrawork" }],
    })

    const route = engine.plan({
      commandHint: "/ultrawork",
      args: "--fast",
      model: "openai/gpt-5.4",
      prompt: "run ultrawork",
    })

    expect(route).toEqual({
      type: "command",
      command: {
        name: "ultrawork",
        arguments: "--fast",
        model: "openai/gpt-5.4",
      },
    })
  })

  test("falls back to agent route with normalized prompt model", () => {
    const engine = new RouteEngine()

    const route = engine.plan({
      commandHint: "",
      args: "",
      model: "openai/gpt-5.4",
      prompt: "design a system architecture",
      requestedAgent: "oracle",
    })

    expect(route).toEqual({
      type: "agent",
      agent: {
        slug: "oracle",
        kind: "builtin",
        skillHints: [],
      },
      model: {
        raw: "openai/gpt-5.4",
        asCommandModel: "openai/gpt-5.4",
        asPromptModel: {
          providerID: "openai",
          modelID: "gpt-5.4",
        },
      },
    })
  })

  test("returns virtual agent route for artemis requests", () => {
    const engine = new RouteEngine()

    const route = engine.plan({
      commandHint: "",
      args: "",
      model: "openai/gpt-5.4",
      prompt: "scrape a website",
      requestedAgent: "artemis",
    })

    expect(route.type).toBe("agent")
    if (route.type === "agent") {
      expect(route.agent.virtualName).toBe("artemis")
      expect(route.agent.skillHints).toContain("browser-automation")
    }
  })
})
