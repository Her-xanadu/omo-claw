import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { DefinitionCompiler } from "./definition-compiler.ts"
import { DefinitionLoader } from "./loader.ts"

export function compileProject(rootDir: string) {
  const loader = new DefinitionLoader()
  const compiler = new DefinitionCompiler()
  const bundle = loader.load(rootDir)
  const generatedDir = join(rootDir, "definitions/generated")
  mkdirSync(generatedDir, { recursive: true })

  const opencode = compiler.compileOpenCode(bundle)
  const openclaw = compiler.compileOpenClaw(bundle)
  const aliases = compiler.buildAliasManifest(bundle)

  writeFileSync(join(generatedDir, "opencode.generated.json"), JSON.stringify(opencode, null, 2))
  writeFileSync(join(generatedDir, "openclaw.generated.json"), JSON.stringify(openclaw, null, 2))
  writeFileSync(join(generatedDir, "aliases.generated.json"), JSON.stringify(aliases, null, 2))

  return { opencode, openclaw, aliases }
}

if (import.meta.main) {
  compileProject(process.cwd())
}
