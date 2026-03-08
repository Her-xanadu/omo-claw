import { describe, expect, test } from "bun:test"
import type { CapabilitySnapshot } from "../compatibility/capability-snapshots/capability-snapshot.schema.ts"
import { DiffClassifier } from "../compatibility/diff-classifier/diff-classifier.ts"

function createSnapshot(): CapabilitySnapshot {
  return {
    capturedAt: "2026-03-08T00:00:00.000Z",
    opencodeVersion: "1.2.21",
    omoVersion: "3.11.1",
    sdkNamespace: "v2",
    tools: { ids: ["bash"], mcpServers: ["peekaboo"] },
    commands: { list: ["ultrawork"], aliases: { "/ultrawork": "ultrawork" } },
    agents: { configs: [{ slug: "atlas", hidden: false, hasSystemPrompt: true }] },
    events: { supportedSet: ["message.updated"] },
    permissions: { flow: "prompt-user", toolRestrictions: {} },
    plugins: { hooks: ["tool.execute.before"] },
  }
}

describe("DiffClassifier", () => {
  test("marks namespace drift as quarantine", () => {
    const classifier = new DiffClassifier()
    const previous = createSnapshot()
    const next = { ...createSnapshot(), sdkNamespace: "v1" as const }

    expect(classifier.classify(previous, next)).toEqual({
      severity: "quarantine",
      changes: ["sdkNamespace:v2->v1"],
    })
  })

  test("marks event drift as safe", () => {
    const classifier = new DiffClassifier()
    const previous = createSnapshot()
    const next = { ...createSnapshot(), events: { supportedSet: ["message.updated", "todo.updated"] } }

    expect(classifier.classify(previous, next)).toEqual({
      severity: "safe",
      changes: ["events"],
    })
  })
})
