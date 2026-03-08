export interface BridgeLogEntry {
  service: string
  level: "info" | "warn" | "error"
  message: string
  extra?: Record<string, unknown>
}

export class ObservabilityHub {
  private readonly entries: BridgeLogEntry[] = []

  record(entry: BridgeLogEntry): void {
    this.entries.push(entry)
  }

  list(): BridgeLogEntry[] {
    return [...this.entries]
  }
}
