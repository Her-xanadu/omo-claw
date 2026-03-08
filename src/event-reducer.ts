import type { BridgeEvent } from "./correlation-tracker.ts"

export interface ReducedProgress {
  sessionID: string
  latestMessageID?: string
  summaryText: string
  todoVersion: number
  permissionPending: number
  eventCount: number
}

interface SessionProgressState {
  latestMessageID?: string
  textByPart: Map<number, string>
  todoVersion: number
  permissionPending: number
  eventCount: number
  compactedSummary?: string
}

export class EventReducer {
  private readonly sessions = new Map<string, SessionProgressState>()

  reduce(event: BridgeEvent): ReducedProgress | null {
    const sessionID = this.getSessionID(event)
    if (!sessionID) return null

    const state = this.sessions.get(sessionID) ?? {
      textByPart: new Map<number, string>(),
      todoVersion: 0,
      permissionPending: 0,
      eventCount: 0,
    }

    state.eventCount += 1

    const messageID = this.getMessageID(event)
    if (messageID) {
      state.latestMessageID = messageID
    }

    if (event.type === "message.part.delta") {
      const delta = typeof event.properties?.delta === "string" ? event.properties.delta : undefined
      if (delta) {
        const partIndex = typeof event.properties?.partIndex === "number" ? event.properties.partIndex : 0
        const previous = state.textByPart.get(partIndex) ?? ""
        state.textByPart.set(partIndex, previous + delta)
      }
    }

    if (event.type === "message.part.updated") {
      const updated = typeof event.properties?.delta === "string" ? event.properties.delta : undefined
      if (updated !== undefined) {
        const partIndex = typeof event.properties?.partIndex === "number" ? event.properties.partIndex : 0
        state.textByPart.set(partIndex, updated)
      }
    }

    if (event.type === "message.part.removed") {
      const partIndex = typeof event.properties?.partIndex === "number" ? event.properties.partIndex : 0
      state.textByPart.delete(partIndex)
    }

    if (event.type === "session.compacted") {
      const summary = typeof event.properties?.summary === "string" ? event.properties.summary : undefined
      if (summary !== undefined) {
        state.compactedSummary = summary
      }
    }

    if (event.type === "todo.updated") {
      state.todoVersion += 1
    }

    if (event.type === "permission.asked") {
      state.permissionPending += 1
    }

    if (event.type === "permission.replied" && state.permissionPending > 0) {
      state.permissionPending -= 1
    }

    this.sessions.set(sessionID, state)

    return {
      sessionID,
      latestMessageID: state.latestMessageID,
      summaryText: this.toSummary(state),
      todoVersion: state.todoVersion,
      permissionPending: state.permissionPending,
      eventCount: state.eventCount,
    }
  }

  get(sessionID: string): ReducedProgress | undefined {
    const state = this.sessions.get(sessionID)
    if (!state) return undefined
    return {
      sessionID,
      latestMessageID: state.latestMessageID,
      summaryText: this.toSummary(state),
      todoVersion: state.todoVersion,
      permissionPending: state.permissionPending,
      eventCount: state.eventCount,
    }
  }

  private getSessionID(event: BridgeEvent): string | undefined {
    const request = event.properties?.request
    if (request && typeof request === "object" && typeof (request as Record<string, unknown>).sessionID === "string") {
      return (request as Record<string, string>).sessionID
    }
    return event.properties?.sessionID ?? event.properties?.info?.sessionID
  }

  private getMessageID(event: BridgeEvent): string | undefined {
    return event.properties?.messageID ?? event.properties?.info?.id
  }

  private toSummary(state: SessionProgressState): string {
    const text = [...state.textByPart.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, value]) => value)
      .join("")
    return state.compactedSummary ?? text
  }
}
