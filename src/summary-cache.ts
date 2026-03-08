import type { ReducedProgress } from "./event-reducer.ts"

export interface SessionSummary {
  sessionID: string
  threadID?: string
  messageID?: string
  summaryText: string
  updatedAt: string
  todoVersion: number
  permissionPending: number
}

export class SummaryCache {
  private readonly summaries = new Map<string, SessionSummary>()

  upsert(progress: ReducedProgress, threadID?: string): SessionSummary {
    const summary: SessionSummary = {
      sessionID: progress.sessionID,
      threadID,
      messageID: progress.latestMessageID,
      summaryText: progress.summaryText,
      updatedAt: new Date().toISOString(),
      todoVersion: progress.todoVersion,
      permissionPending: progress.permissionPending,
    }
    this.summaries.set(progress.sessionID, summary)
    return summary
  }

  get(sessionID: string): SessionSummary | undefined {
    return this.summaries.get(sessionID)
  }

  list(): SessionSummary[] {
    return [...this.summaries.values()]
  }
}
