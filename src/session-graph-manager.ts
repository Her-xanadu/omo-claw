export interface SessionEdge {
  childSessionID: string
  role: string
}

export interface MessageCorrelation {
  threadID: string
  sessionID: string
  messageID: string
  source: "promptAsync" | "command" | "event"
}

export class SessionGraphManager {
  private readonly threadRoots = new Map<string, string>()
  private readonly sessionThreads = new Map<string, string>()
  private readonly edges = new Map<string, SessionEdge[]>()
  private readonly correlations = new Map<string, MessageCorrelation>()

  bindRootSession(threadID: string, sessionID: string): void {
    this.threadRoots.set(threadID, sessionID)
    this.sessionThreads.set(sessionID, threadID)
  }

  getRootSession(threadID: string): string | undefined {
    return this.threadRoots.get(threadID)
  }

  getOrThrow(threadID: string): string {
    const sessionID = this.getRootSession(threadID)
    if (!sessionID) {
      throw new Error(`No root session bound for thread: ${threadID}`)
    }
    return sessionID
  }

  bindChildSession(input: {
    threadID: string
    parentSessionID: string
    childSessionID: string
    role: string
  }): void {
    const list = this.edges.get(input.parentSessionID) ?? []
    list.push({ childSessionID: input.childSessionID, role: input.role })
    this.edges.set(input.parentSessionID, list)
    this.sessionThreads.set(input.childSessionID, input.threadID)
  }

  getChildren(sessionID: string): SessionEdge[] {
    return this.edges.get(sessionID) ?? []
  }

  getThreadForSession(sessionID: string): string | undefined {
    return this.sessionThreads.get(sessionID)
  }

  recordMessageCorrelation(entry: MessageCorrelation): void {
    this.correlations.set(entry.messageID, entry)
  }

  findCorrelation(messageID: string): MessageCorrelation | undefined {
    return this.correlations.get(messageID)
  }

  listThreads(): Array<{ threadID: string; rootSessionID: string }> {
    return [...this.threadRoots.entries()].map(([threadID, rootSessionID]) => ({ threadID, rootSessionID }))
  }
}
