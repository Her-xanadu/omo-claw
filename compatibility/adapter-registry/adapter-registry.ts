import type { CompatibilityMode } from "../diff-classifier/diff-classifier.ts"

export interface AdapterRecord {
  mode: CompatibilityMode
  name: string
}

export class AdapterRegistry {
  private readonly records = new Map<CompatibilityMode, AdapterRecord[]>()

  register(record: AdapterRecord): void {
    const existing = this.records.get(record.mode) ?? []
    existing.push(record)
    this.records.set(record.mode, existing)
  }

  resolve(mode: CompatibilityMode): AdapterRecord[] {
    return this.records.get(mode) ?? []
  }
}
