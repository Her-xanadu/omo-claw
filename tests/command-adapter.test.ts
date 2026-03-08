import { describe, expect, test } from "bun:test"
import { CommandAdapter } from "../src/command-adapter.ts"

describe("CommandAdapter", () => {
  test("normalizes unified model into command and prompt shapes", () => {
    const adapter = new CommandAdapter()

    const normalized = adapter.normalizeModel("openai/gpt-5.4")

    expect(normalized.raw).toBe("openai/gpt-5.4")
    expect(normalized.asCommandModel).toBe("openai/gpt-5.4")
    expect(normalized.asPromptModel).toEqual({
      providerID: "openai",
      modelID: "gpt-5.4",
    })
  })

  test("resolves slash command tasks before agent fallback", () => {
    const adapter = new CommandAdapter([
      { trigger: "/omo_claw_status", target: "omo_claw_status" },
      { trigger: "/ultrawork", target: "ultrawork" },
    ])

    const resolved = adapter.resolve({
      commandHint: "/ultrawork",
      args: "--fast",
      model: "openai/gpt-5.4",
    })

    expect(resolved).toEqual({
      name: "ultrawork",
      arguments: "--fast",
      model: "openai/gpt-5.4",
    })
  })

  test("returns null when task should fall back to agent routing", () => {
    const adapter = new CommandAdapter([{ trigger: "/omo_claw_status", target: "omo_claw_status" }])

    const resolved = adapter.resolve({
      commandHint: "atlas implement runtime",
      args: "",
      model: "openai/gpt-5.4",
    })

    expect(resolved).toBeNull()
  })
})
