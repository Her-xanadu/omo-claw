import type { CapabilitySnapshot } from "../capability-snapshots/capability-snapshot.schema.ts"

export type CompatibilityMode = "full" | "compatible" | "safe" | "quarantine"

export interface CapabilityDiff {
  severity: CompatibilityMode
  changes: string[]
}

export class DiffClassifier {
  classify(previous: CapabilitySnapshot, next: CapabilitySnapshot): CapabilityDiff {
    const changes: string[] = []

    if (previous.sdkNamespace !== next.sdkNamespace) {
      changes.push(`sdkNamespace:${previous.sdkNamespace}->${next.sdkNamespace}`)
    }
    if (previous.events.supportedSet.join("|") !== next.events.supportedSet.join("|")) {
      changes.push("events")
    }
    if (previous.commands.list.join("|") !== next.commands.list.join("|")) {
      changes.push("commands")
    }
    if (previous.tools.ids.join("|") !== next.tools.ids.join("|")) {
      changes.push("tools")
    }

    if (changes.some((item) => item.startsWith("sdkNamespace"))) {
      return { severity: "quarantine", changes }
    }
    if (changes.includes("events") || changes.includes("commands")) {
      return { severity: "safe", changes }
    }
    if (changes.includes("tools")) {
      return { severity: "compatible", changes }
    }
    return { severity: "full", changes }
  }
}
