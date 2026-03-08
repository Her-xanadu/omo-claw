import { describe, expect, test } from "bun:test"
import { AdapterRegistry } from "../compatibility/adapter-registry/adapter-registry.ts"
import { CompatibilityController } from "../src/compatibility-controller.ts"

describe("Compatibility mode switch", () => {
  test("switches mode and returns matching adapters", () => {
    const registry = new AdapterRegistry()
    registry.register({ mode: "safe", name: "safe-event-filter-adapter" })
    const controller = new CompatibilityController({ registry })

    expect(controller.switchMode("safe")).toEqual({
      mode: "safe",
      adapters: ["safe-event-filter-adapter"],
    })
    expect(controller.getMode()).toBe("safe")
  })
})
