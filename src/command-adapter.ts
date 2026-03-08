export interface UnifiedModelParam {
  raw: string
  asCommandModel: string
  asPromptModel: {
    providerID: string
    modelID: string
  }
}

export interface CommandAlias {
  trigger: string
  target: string
}

export interface CommandTask {
  commandHint: string
  args: string
  model: string
}

export class CommandAdapter {
  constructor(private readonly aliases: CommandAlias[] = []) {}

  normalizeModel(raw: string): UnifiedModelParam {
    const [providerID, ...rest] = raw.split("/")
    if (!providerID || rest.length === 0) {
      throw new Error(`Invalid model identifier: ${raw}`)
    }

    return {
      raw,
      asCommandModel: raw,
      asPromptModel: {
        providerID,
        modelID: rest.join("/"),
      },
    }
  }

  resolve(task: CommandTask): { name: string; arguments: string; model: string } | null {
    const match = this.aliases.find((alias) => alias.trigger === task.commandHint)
    if (!match) return null

    return {
      name: match.target,
      arguments: task.args,
      model: this.normalizeModel(task.model).asCommandModel,
    }
  }
}
