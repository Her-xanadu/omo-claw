import { describe, expect, test } from "bun:test"
import { DefinitionCompiler } from "../definitions/compiler/definition-compiler.ts"

describe("DefinitionCompiler", () => {
  test("compiles single-source IR into opencode, openclaw and alias outputs", () => {
    const compiler = new DefinitionCompiler()
    const bundle = {
      agents: [
        { slug: "atlas", visibility: "direct" as const, systemPrompt: "execute", skills: [] },
        { slug: "explore", visibility: "internal" as const, systemPrompt: "search", skills: [] },
      ],
      commands: [
        { name: "ultrawork", aliases: ["/ultrawork", "/ulw-loop"], description: "run", targetAgent: "atlas" },
      ],
      policy: {
        forbiddenCommands: ["/tui"],
        virtualAgents: { artemis: ["browser-automation"] },
      },
    }

    const opencode = compiler.compileOpenCode(bundle)
    const openclaw = compiler.compileOpenClaw(bundle)
    const aliases = compiler.buildAliasManifest(bundle)

    expect(opencode.agents).toEqual([
      { slug: "atlas", systemPrompt: "execute", hidden: false },
      { slug: "explore", systemPrompt: "search", hidden: true },
    ])
    expect(openclaw.personas).toEqual([{ slug: "atlas", label: "atlas" }])
    expect(aliases).toEqual({
      "/ultrawork": "ultrawork",
      "/ulw-loop": "ultrawork",
    })
  })
})
