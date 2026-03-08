import { describe, expect, test } from "bun:test"
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { compileProject } from "../definitions/compiler/cli.ts"

function setupProject(): string {
  const root = mkdtempSync(join(tmpdir(), "omo-compile-"))
  mkdirSync(join(root, "definitions/omo-ir/agents"), { recursive: true })
  mkdirSync(join(root, "definitions/omo-ir/commands"), { recursive: true })
  mkdirSync(join(root, "definitions/omo-ir/policies"), { recursive: true })
  writeFileSync(join(root, "definitions/omo-ir/agents/atlas.json"), JSON.stringify({ slug: "atlas", visibility: "direct", systemPrompt: "execute", skills: [] }))
  writeFileSync(join(root, "definitions/omo-ir/agents/sisyphus.json"), JSON.stringify({ slug: "sisyphus", visibility: "direct", systemPrompt: "orchestrate", skills: [] }))
  writeFileSync(join(root, "definitions/omo-ir/commands/ultrawork.json"), JSON.stringify({ name: "ultrawork", aliases: ["/ultrawork"], description: "run", targetAgent: "atlas" }))
  writeFileSync(join(root, "definitions/omo-ir/policies/default.json"), JSON.stringify({ forbiddenCommands: ["/tui"], virtualAgents: {} }))
  return root
}

describe("compileProject", () => {
  test("writes generated artifacts", () => {
    const root = setupProject()

    const result = compileProject(root)

    expect(result.aliases).toEqual({ "/ultrawork": "ultrawork" })
    expect(existsSync(join(root, "definitions/generated/opencode.generated.json"))).toBeTrue()
    expect(JSON.parse(readFileSync(join(root, "definitions/generated/openclaw.generated.json"), "utf8"))).toEqual({
      personas: [
        { slug: "atlas", label: "atlas" },
        { slug: "sisyphus", label: "sisyphus" },
      ],
      slashCommands: [
        { name: "ultrawork", description: "run" },
      ],
    })
  })
})
