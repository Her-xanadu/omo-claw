import { describe, expect, test } from "bun:test"
import { CorrelationTracker } from "../src/correlation-tracker.ts"

describe("CorrelationTracker", () => {
  test("matches first unseen message in watched session", () => {
    const tracker = new CorrelationTracker()

    tracker.recordKnownMessages("ses_1", ["msg_old"])

    const match = tracker.ingestEvent({
      type: "message.updated",
      properties: {
        info: { id: "msg_new", sessionID: "ses_1" },
      },
    })

    expect(match).toEqual({
      sessionID: "ses_1",
      messageID: "msg_new",
      eventType: "message.updated",
    })
  })

  test("ignores already known messages", () => {
    const tracker = new CorrelationTracker()

    tracker.recordKnownMessages("ses_1", ["msg_existing"])

    const match = tracker.ingestEvent({
      type: "message.updated",
      properties: {
        info: { id: "msg_existing", sessionID: "ses_1" },
      },
    })

    expect(match).toBeNull()
  })

  test("accepts part delta events when message id is exposed on properties", () => {
    const tracker = new CorrelationTracker()

    const match = tracker.ingestEvent({
      type: "message.part.delta",
      properties: {
        sessionID: "ses_2",
        messageID: "msg_2",
      },
    })

    expect(match).toEqual({
      sessionID: "ses_2",
      messageID: "msg_2",
      eventType: "message.part.delta",
    })
  })
})
