import { describe, expect, test } from "bun:test"
import { DefinitionLoader } from "../definitions/compiler/loader.ts"

describe("DefinitionLoader", () => {
  test("loads bundle from project definitions", () => {
    const loader = new DefinitionLoader()
    const bundle = loader.load(process.cwd())

    expect(bundle.agents.map((agent) => agent.slug)).toEqual([
      "artemis",
      "atlas",
      "cynthia",
      "explore",
      "librarian",
      "metis",
      "momus",
      "oracle",
      "prometheus",
      "sisyphus-junior",
      "sisyphus",
    ])
    expect(bundle.commands.map((command) => command.name)).toEqual(["omo_claw_status", "ultrawork"])
    expect(bundle.policy.forbiddenCommands).toEqual(["/tui"])
  })
})
