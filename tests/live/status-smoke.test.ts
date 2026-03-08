import { describe, expect, test } from "bun:test"
import { ObservabilityHub } from "../../src/observability-hub.ts"

describe("Status smoke", () => {
  test("records observable bridge events for status surfaces", () => {
    const hub = new ObservabilityHub()
    hub.record({ service: "omo-claw.status", level: "info", message: "ok" })
    hub.record({ service: "event-bridge", level: "warn", message: "filtered directory mismatch" })

    expect(hub.list()).toEqual([
      { service: "omo-claw.status", level: "info", message: "ok" },
      { service: "event-bridge", level: "warn", message: "filtered directory mismatch" },
    ])
  })
})
