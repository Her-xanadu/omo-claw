import { describe, expect, test } from "bun:test"
import { CapabilityService } from "../src/capability-service.ts"

describe("CapabilityService mode", () => {
  test("switches runtime compatibility mode", () => {
    const service = new CapabilityService()

    expect(service.switchMode("compatible")).toEqual({
      mode: "compatible",
      adapters: ["compat-directory-header-adapter"],
    })
    expect(service.getMode()).toBe("compatible")
  })
})
