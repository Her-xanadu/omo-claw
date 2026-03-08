import type { BridgeSdkClient } from "./bridge-sdk-client.ts"
import type { BridgeEvent } from "./correlation-tracker.ts"
import { EventReducer, type ReducedProgress } from "./event-reducer.ts"
import { SummaryCache, type SessionSummary } from "./summary-cache.ts"
import { TodoSync, type TodoSnapshot } from "./todo-sync.ts"

export class EventBridge {
  private reducer?: EventReducer
  private summaryCache?: SummaryCache
  private todoSync?: TodoSync

  constructor(
    private readonly options: {
      sdkClient: BridgeSdkClient
      reducer?: EventReducer
      summaryCache?: SummaryCache
      todoSync?: TodoSync
      allowedDirectory?: string
      onEvent?: (event: BridgeEvent) => void
    },
  ) {}

  async subscribe(): Promise<AsyncIterable<unknown>> {
    const result = await this.options.sdkClient.subscribeEvents()
    return result.stream
  }

  ingest(event: BridgeEvent): {
    reduced?: ReducedProgress
    summary?: SessionSummary
    todoSnapshot?: TodoSnapshot
  } {
    if (this.options.allowedDirectory && event.properties?.directory && event.properties.directory !== this.options.allowedDirectory) {
      return {}
    }

    this.options.onEvent?.(event)
    const reduced = this.getReducer().reduce(event)
    if (!reduced) {
      return {}
    }

    const threadID = event.properties?.threadID
    const summary = this.getSummaryCache().upsert(reduced, typeof threadID === "string" ? threadID : undefined)
    let todoSnapshot: TodoSnapshot | undefined

    if (event.type === "todo.updated") {
      const todos = Array.isArray(event.properties?.todos)
        ? event.properties?.todos.filter((item): item is { content: string; status: string; priority: string } => {
            return typeof item === "object" && item !== null
              && typeof (item as Record<string, unknown>).content === "string"
              && typeof (item as Record<string, unknown>).status === "string"
              && typeof (item as Record<string, unknown>).priority === "string"
          })
        : []
      todoSnapshot = this.getTodoSync().update(reduced.sessionID, todos)
    }

    return {
      reduced,
      summary,
      todoSnapshot,
    }
  }

  getSummary(sessionID: string): SessionSummary | undefined {
    return this.getSummaryCache().get(sessionID)
  }

  getTodo(sessionID: string): TodoSnapshot | undefined {
    return this.getTodoSync().get(sessionID)
  }

  private getReducer(): EventReducer {
    this.reducer ??= this.options.reducer ?? new EventReducer()
    return this.reducer
  }

  private getSummaryCache(): SummaryCache {
    this.summaryCache ??= this.options.summaryCache ?? new SummaryCache()
    return this.summaryCache
  }

  private getTodoSync(): TodoSync {
    this.todoSync ??= this.options.todoSync ?? new TodoSync()
    return this.todoSync
  }
}
