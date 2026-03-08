import { describe, expect, test } from "bun:test"
import { CompanionPlugin } from "../src/companion-plugin.ts"

describe("CompanionPlugin", () => {
  test("injects bridge summary into compacting hook and config dir into shell env", async () => {
    const hooks = new CompanionPlugin({ configDir: "/tmp/bridge/.opencode" }).createHooks()

    await expect(hooks["experimental.session.compacting"]({
      sessionID: "ses_1",
      summary: {
        sessionID: "ses_1",
        summaryText: "bridge summary",
        updatedAt: "2026-03-08T00:00:00.000Z",
        todoVersion: 1,
        permissionPending: 0,
      },
    })).resolves.toEqual({
      prependSystemContext: "Bridge summary for ses_1:\nbridge summary",
    })

    await expect(hooks["shell.env"]({ env: { PATH: "/usr/bin" } })).resolves.toEqual({
      PATH: "/usr/bin",
      OPENCODE_CONFIG_DIR: "/tmp/bridge/.opencode",
    })
  })
})
