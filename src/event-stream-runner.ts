import type { BridgeEvent } from "./correlation-tracker.ts"
import type { EventBridge } from "./event-bridge.ts"

export class EventStreamRunner {
  constructor(private readonly bridge: EventBridge) {}

  async run(stream: AsyncIterable<unknown>, maxEvents?: number): Promise<number> {
    let count = 0
    for await (const item of stream) {
      if (item && typeof item === "object" && typeof (item as Record<string, unknown>).type === "string") {
        this.bridge.ingest(item as BridgeEvent)
        count += 1
      }
      if (maxEvents !== undefined && count >= maxEvents) {
        return count
      }
    }
    return count
  }
}
