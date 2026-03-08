export interface BridgeTodo {
  content: string
  status: string
  priority: string
}

export interface TodoSnapshot {
  sessionID: string
  items: BridgeTodo[]
  updatedAt: string
}

export class TodoSync {
  private readonly snapshots = new Map<string, TodoSnapshot>()

  update(sessionID: string, items: BridgeTodo[]): TodoSnapshot {
    const snapshot: TodoSnapshot = {
      sessionID,
      items,
      updatedAt: new Date().toISOString(),
    }
    this.snapshots.set(sessionID, snapshot)
    return snapshot
  }

  get(sessionID: string): TodoSnapshot | undefined {
    return this.snapshots.get(sessionID)
  }
}
