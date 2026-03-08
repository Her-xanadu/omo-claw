import type { SessionSummary } from "./summary-cache.ts"
import { SessionGraphManager } from "./session-graph-manager.ts"

export interface ReplaySnapshot {
  threadID: string
  rootSessionID: string
  summaries: SessionSummary[]
  parts?: Array<{
    messageID: string
    partIndex: number
    text: string
  }>
}

export class SessionReplay {
  constructor(private readonly graph: SessionGraphManager) {}

  createSnapshot(threadID: string, summaries: SessionSummary[], parts?: ReplaySnapshot["parts"]): ReplaySnapshot {
    return {
      threadID,
      rootSessionID: this.graph.getOrThrow(threadID),
      summaries,
      parts,
    }
  }

  rebind(snapshot: ReplaySnapshot): string {
    this.graph.bindRootSession(snapshot.threadID, snapshot.rootSessionID)
    return snapshot.rootSessionID
  }
}
