import type { CapabilitySnapshot } from "../compatibility/capability-snapshots/capability-snapshot.schema.ts"
import { AdapterRegistry } from "../compatibility/adapter-registry/adapter-registry.ts"
import { DiffClassifier, type CompatibilityMode } from "../compatibility/diff-classifier/diff-classifier.ts"

export class CompatibilityController {
  private currentMode: CompatibilityMode = "full"

  constructor(
    private readonly options: {
      classifier?: DiffClassifier
      registry?: AdapterRegistry
    } = {},
  ) {}

  evaluate(previous: CapabilitySnapshot, next: CapabilitySnapshot): {
    mode: CompatibilityMode
    changes: string[]
    adapters: string[]
  } {
    const diff = this.getClassifier().classify(previous, next)
    const adapters = this.getRegistry().resolve(diff.severity).map((item) => item.name)
    return {
      mode: diff.severity,
      changes: diff.changes,
      adapters,
    }
  }

  switchMode(mode: CompatibilityMode) {
    this.currentMode = mode
    return {
      mode,
      adapters: this.getRegistry().resolve(mode).map((item) => item.name),
    }
  }

  getMode(): CompatibilityMode {
    return this.currentMode
  }

  private getClassifier(): DiffClassifier {
    return this.options.classifier ?? new DiffClassifier()
  }

  private getRegistry(): AdapterRegistry {
    return this.options.registry ?? new AdapterRegistry()
  }
}
