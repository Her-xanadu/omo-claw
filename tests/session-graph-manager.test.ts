import { describe, expect, test } from "bun:test"
import { SessionGraphManager } from "../src/session-graph-manager.ts"

describe("SessionGraphManager", () => {
  test("creates stable root mapping per thread", () => {
    const graph = new SessionGraphManager()

    graph.bindRootSession("thread-1", "ses_root_1")

    expect(graph.getRootSession("thread-1")).toBe("ses_root_1")
    expect(graph.getOrThrow("thread-1")).toBe("ses_root_1")
  })

  test("tracks child session lineage under a thread", () => {
    const graph = new SessionGraphManager()
    graph.bindRootSession("thread-1", "ses_root_1")

    graph.bindChildSession({
      threadID: "thread-1",
      parentSessionID: "ses_root_1",
      childSessionID: "ses_child_1",
      role: "atlas",
    })

    expect(graph.getChildren("ses_root_1")).toEqual([
      {
        childSessionID: "ses_child_1",
        role: "atlas",
      },
    ])
    expect(graph.getThreadForSession("ses_child_1")).toBe("thread-1")
  })

  test("records command correlation by message id", () => {
    const graph = new SessionGraphManager()
    graph.bindRootSession("thread-1", "ses_root_1")

    graph.recordMessageCorrelation({
      threadID: "thread-1",
      sessionID: "ses_root_1",
      messageID: "msg_1",
      source: "promptAsync",
    })

    expect(graph.findCorrelation("msg_1")).toEqual({
      threadID: "thread-1",
      sessionID: "ses_root_1",
      messageID: "msg_1",
      source: "promptAsync",
    })
  })
})
