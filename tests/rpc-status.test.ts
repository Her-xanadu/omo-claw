import { describe, expect, test } from "bun:test"
import { buildRpcStatus } from "../src/rpc-status.ts"

describe("buildRpcStatus", () => {
  test("returns combined runtime and session status", async () => {
    const result = await buildRpcStatus({
      async getHealth() {
        return { healthy: true, version: "1.2.21", baseUrl: "http://127.0.0.1:19222" }
      },
      getStatus() {
        return { runtimeBaseUrl: "http://127.0.0.1:19222", threads: [], pendingPermissions: [] }
      },
    } as never)

    expect(result).toEqual({
      ok: true,
      runtime: { healthy: true, version: "1.2.21", baseUrl: "http://127.0.0.1:19222" },
      status: { runtimeBaseUrl: "http://127.0.0.1:19222", threads: [], pendingPermissions: [] },
    })
  })
})
