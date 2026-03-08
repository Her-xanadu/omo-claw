export interface AgentIr {
  slug: string
  visibility: "direct" | "expert" | "internal"
  systemPrompt: string
  skills: string[]
}

export interface CommandIr {
  name: string
  aliases: string[]
  description: string
  targetAgent: string
}

export interface PolicyIr {
  forbiddenCommands: string[]
  virtualAgents: Record<string, string[]>
}

export interface DefinitionBundle {
  agents: AgentIr[]
  commands: CommandIr[]
  policy: PolicyIr
}

export class DefinitionCompiler {
  compileOpenCode(bundle: DefinitionBundle) {
    return {
      agents: bundle.agents.map((agent) => ({
        slug: agent.slug,
        systemPrompt: agent.systemPrompt,
        hidden: agent.visibility === "internal",
      })),
      commands: bundle.commands.map((command) => ({
        name: command.name,
        description: command.description,
        agent: command.targetAgent,
      })),
    }
  }

  compileOpenClaw(bundle: DefinitionBundle) {
    return {
      personas: bundle.agents
        .filter((agent) => agent.visibility !== "internal")
        .map((agent) => ({
          slug: agent.slug,
          label: agent.slug,
        })),
      slashCommands: bundle.commands.map((command) => ({
        name: command.name,
        description: command.description,
      })),
    }
  }

  buildAliasManifest(bundle: DefinitionBundle): Record<string, string> {
    return Object.fromEntries(
      bundle.commands.flatMap((command) => command.aliases.map((alias) => [alias, command.name])),
    )
  }
}
