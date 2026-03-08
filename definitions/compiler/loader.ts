import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { AgentIr, CommandIr, DefinitionBundle, PolicyIr } from "./definition-compiler.ts"

export class DefinitionLoader {
  load(rootDir: string): DefinitionBundle {
    const agentDir = join(rootDir, "definitions/omo-ir/agents")
    const commandDir = join(rootDir, "definitions/omo-ir/commands")
    const policyPath = join(rootDir, "definitions/omo-ir/policies/default.json")

    const agentFiles = readdirSync(agentDir).filter((file) => file.endsWith(".json")).sort()
    const commandFiles = readdirSync(commandDir).filter((file) => file.endsWith(".json")).sort()

    return {
      agents: agentFiles.map((file) => this.readJson<AgentIr>(join(agentDir, file))),
      commands: commandFiles.map((file) => this.readJson<CommandIr>(join(commandDir, file))),
      policy: this.readJson<PolicyIr>(policyPath),
    }
  }

  private readJson<T>(filePath: string): T {
    return JSON.parse(readFileSync(filePath, "utf8")) as T
  }
}
