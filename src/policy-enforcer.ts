export interface PolicyInput {
  commandHint: string
  requestedAgent?: string
  capabilities: string[]
}

export class PolicyEnforcer {
  evaluate(input: PolicyInput): { allowed: true } | { allowed: false; reason: string } {
    if (input.commandHint.trim().startsWith("/tui")) {
      return {
        allowed: false,
        reason: "Bridge policy forbids /tui access from headless runtime",
      }
    }

    const agent = input.requestedAgent?.trim().toLowerCase()
    if (agent === "artemis" && !input.capabilities.includes("browser-automation")) {
      return {
        allowed: false,
        reason: "Virtual agent artemis requires browser-automation capability",
      }
    }

    return { allowed: true }
  }
}
