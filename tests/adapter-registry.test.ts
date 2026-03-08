import { describe, expect, test } from "bun:test"
import { AdapterRegistry } from "../compatibility/adapter-registry/adapter-registry.ts"

describe("AdapterRegistry", () => {
  test("resolves adapters by compatibility mode", () => {
    const registry = new AdapterRegistry()
    registry.register({ mode: "safe", name: "safe-command-adapter" })
    registry.register({ mode: "quarantine", name: "quarantine-runtime-adapter" })

    expect(registry.resolve("safe")).toEqual([{ mode: "safe", name: "safe-command-adapter" }])
    expect(registry.resolve("quarantine")).toEqual([{ mode: "quarantine", name: "quarantine-runtime-adapter" }])
  })
})
