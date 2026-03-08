import { describe, expect, test } from "bun:test"
import { SessionGraphManager } from "../src/session-graph-manager.ts"
import { SessionReplay } from "../src/session-replay.ts"

describe("SessionReplay", () => {
  test("creates and rebinds replay snapshot", () => {
    const graph = new SessionGraphManager()
    graph.bindRootSession("thread-1", "ses_root_1")
    const replay = new SessionReplay(graph)

    const snapshot = replay.createSnapshot("thread-1", [{
      sessionID: "ses_root_1",
      threadID: "thread-1",
      messageID: "msg_1",
      summaryText: "done",
      updatedAt: "2026-03-08T00:00:00.000Z",
      todoVersion: 1,
      permissionPending: 0,
    }], [
      { messageID: "msg_1", partIndex: 0, text: "done" },
    ])

    const rebound = replay.rebind(snapshot)

    expect(rebound).toBe("ses_root_1")
    expect(graph.getRootSession("thread-1")).toBe("ses_root_1")
    expect(snapshot.parts).toEqual([{ messageID: "msg_1", partIndex: 0, text: "done" }])
  })
})
