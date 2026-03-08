import { describe, expect, test } from "bun:test"
import { EventReducer } from "../src/event-reducer.ts"

describe("EventReducer", () => {
  test("reduces message delta, todo and permission counters", () => {
    const reducer = new EventReducer()

    reducer.reduce({
      type: "message.part.delta",
      properties: {
        sessionID: "ses_1",
        messageID: "msg_1",
        delta: "hello ",
      },
    })
    reducer.reduce({
      type: "message.part.delta",
      properties: {
        sessionID: "ses_1",
        messageID: "msg_1",
        delta: "world",
      },
    })
    reducer.reduce({
      type: "permission.asked",
      properties: {
        request: {
          id: "perm_1",
          sessionID: "ses_1",
          permission: "bash",
        },
      },
    })
    const reduced = reducer.reduce({
      type: "todo.updated",
      properties: {
        sessionID: "ses_1",
      },
    })

    expect(reduced).toEqual({
      sessionID: "ses_1",
      latestMessageID: "msg_1",
      summaryText: "hello world",
      todoVersion: 1,
      permissionPending: 1,
      eventCount: 4,
    })
  })

  test("applies updated removed and compacted replay semantics", () => {
    const reducer = new EventReducer()

    reducer.reduce({
      type: "message.part.delta",
      properties: { sessionID: "ses_2", messageID: "msg_2", partIndex: 0, delta: "hello" },
    })
    reducer.reduce({
      type: "message.part.updated",
      properties: { sessionID: "ses_2", messageID: "msg_2", partIndex: 0, delta: "HELLO" },
    })
    reducer.reduce({
      type: "message.part.delta",
      properties: { sessionID: "ses_2", messageID: "msg_2", partIndex: 1, delta: " world" },
    })
    reducer.reduce({
      type: "message.part.removed",
      properties: { sessionID: "ses_2", messageID: "msg_2", partIndex: 1 },
    })

    expect(reducer.get("ses_2")?.summaryText).toBe("HELLO")

    reducer.reduce({
      type: "session.compacted",
      properties: { sessionID: "ses_2", summary: "compacted summary" },
    })

    expect(reducer.get("ses_2")?.summaryText).toBe("compacted summary")
  })
})
