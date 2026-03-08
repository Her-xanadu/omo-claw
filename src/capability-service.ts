import baseline from "../compatibility/capability-snapshots/capability-baseline.json" with { type: "json" }
import { CapabilityCollector, type CapabilityCollectorInput } from "../compatibility/capability-snapshots/collector.ts"
import { AdapterRegistry } from "../compatibility/adapter-registry/adapter-registry.ts"
import type { CapabilitySnapshot } from "../compatibility/capability-snapshots/capability-snapshot.schema.ts"
import { CompatibilityController } from "./compatibility-controller.ts"

export class CapabilityService {
  private readonly baselineSnapshot: CapabilitySnapshot = baseline as CapabilitySnapshot
  private readonly collector = new CapabilityCollector()
  private readonly registry = new AdapterRegistry()
  private readonly controller = new CompatibilityController({ registry: this.registry })

  constructor() {
    this.registry.register({ mode: "compatible", name: "compat-directory-header-adapter" })
    this.registry.register({ mode: "safe", name: "safe-event-filter-adapter" })
    this.registry.register({ mode: "quarantine", name: "quarantine-sdk-namespace-adapter" })
  }

  snapshotAndEvaluate(input: CapabilityCollectorInput) {
    const current = this.collector.collect(input)
    const compatibility = this.controller.evaluate(this.baselineSnapshot, current)
    return {
      baseline: this.baselineSnapshot,
      current,
      compatibility,
    }
  }

  switchMode(mode: "full" | "compatible" | "safe" | "quarantine") {
    return this.controller.switchMode(mode)
  }

  getMode() {
    return this.controller.getMode()
  }
}
