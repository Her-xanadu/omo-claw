import { describe, expect, test } from "bun:test"
import { PolicyEnforcer } from "../src/policy-enforcer.ts"

describe("PolicyEnforcer", () => {
  test("blocks direct tui control calls", () => {
    const enforcer = new PolicyEnforcer()

    const result = enforcer.evaluate({
      commandHint: "/tui",
      requestedAgent: "atlas",
      capabilities: ["runtime"],
    })

    expect(result.allowed).toBeFalse()
    if (!result.allowed) {
      expect(result.reason).toContain("/tui")
    }
  })

  test("blocks artemis when browser automation capability is absent", () => {
    const enforcer = new PolicyEnforcer()

    const result = enforcer.evaluate({
      commandHint: "",
      requestedAgent: "artemis",
      capabilities: ["runtime"],
    })

    expect(result.allowed).toBeFalse()
    if (!result.allowed) {
      expect(result.reason).toContain("browser-automation")
    }
  })

  test("allows normal bridge execution paths", () => {
    const enforcer = new PolicyEnforcer()

    const result = enforcer.evaluate({
      commandHint: "/ultrawork",
      requestedAgent: "atlas",
      capabilities: ["runtime", "browser-automation"],
    })

    expect(result).toEqual({ allowed: true })
  })
})
