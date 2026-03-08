export interface BridgeEvent {
  type: string
  properties?: {
    sessionID?: string
    messageID?: string
    partIndex?: number
    delta?: string
    directory?: string
    threadID?: string
    summary?: string
    request?: unknown
    info?: {
      id?: string
      sessionID?: string
    }
    [key: string]: unknown
  }
}

export interface CorrelationMatch {
  sessionID: string
  messageID: string
  eventType: string
}

export class CorrelationTracker {
  private readonly knownMessages = new Map<string, Set<string>>()

  recordKnownMessages(sessionID: string, messageIDs: string[]): void {
    this.knownMessages.set(sessionID, new Set(messageIDs))
  }

  ingestEvent(event: BridgeEvent): CorrelationMatch | null {
    const sessionID = event.properties?.sessionID ?? event.properties?.info?.sessionID
    const messageID = event.properties?.messageID ?? event.properties?.info?.id
    if (!sessionID || !messageID) return null

    const known = this.knownMessages.get(sessionID) ?? new Set<string>()
    if (known.has(messageID)) {
      return null
    }

    known.add(messageID)
    this.knownMessages.set(sessionID, known)

    return {
      sessionID,
      messageID,
      eventType: event.type,
    }
  }
}
