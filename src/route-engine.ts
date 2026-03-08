import { AgentAdapter, type ResolvedAgent } from "./agent-adapter.ts"
import { CommandAdapter, type CommandAlias, type UnifiedModelParam } from "./command-adapter.ts"

export interface RoutePlanInput {
  commandHint: string
  args: string
  model: string
  prompt: string
  requestedAgent?: string
}

export type RoutePlan =
  | {
      type: "command"
      command: {
        name: string
        arguments: string
        model: string
      }
    }
  | {
      type: "agent"
      agent: ResolvedAgent
      model: UnifiedModelParam
    }

export class RouteEngine {
  private readonly commandAdapter: CommandAdapter
  private readonly agentAdapter: AgentAdapter

  constructor(options?: { commandAliases?: CommandAlias[] }) {
    this.commandAdapter = new CommandAdapter(options?.commandAliases ?? [])
    this.agentAdapter = new AgentAdapter()
  }

  plan(input: RoutePlanInput): RoutePlan {
    const command = this.commandAdapter.resolve({
      commandHint: input.commandHint,
      args: input.args,
      model: input.model,
    })
    if (command) {
      return {
        type: "command",
        command,
      }
    }

    return {
      type: "agent",
      agent: this.agentAdapter.resolve({
        requestedAgent: input.requestedAgent,
        prompt: input.prompt,
      }),
      model: this.commandAdapter.normalizeModel(input.model),
    }
  }
}
