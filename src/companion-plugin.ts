import type { SessionSummary } from "./summary-cache.ts"

export interface CompanionPluginHooks {
  "experimental.session.compacting": (input: {
    sessionID: string
    summary?: SessionSummary
    existingSystem?: string
  }) => Promise<{ prependSystemContext?: string }>
  "shell.env": (input: { env: Record<string, string> }) => Promise<Record<string, string>>
}

export class CompanionPlugin {
  constructor(private readonly options: { configDir: string }) {}

  createHooks(): CompanionPluginHooks {
    return {
      "experimental.session.compacting": async (input) => {
        if (!input.summary) {
          return {}
        }
        return {
          prependSystemContext: [
            `Bridge summary for ${input.sessionID}:`,
            input.summary.summaryText || "(empty summary)",
          ].join("\n"),
        }
      },
      "shell.env": async (input) => ({
        ...input.env,
        OPENCODE_CONFIG_DIR: this.options.configDir,
      }),
    }
  }
}
