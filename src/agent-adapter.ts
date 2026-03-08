export interface AgentResolutionInput {
  requestedAgent?: string
  prompt: string
}

export interface ResolvedAgent {
  slug: string
  kind: "builtin" | "virtual"
  virtualName?: string
  skillHints: string[]
}

const BUILTIN_AGENTS = new Set([
  "sisyphus",
  "atlas",
  "oracle",
  "prometheus",
  "explore",
  "metis",
  "momus",
  "librarian",
  "sisyphus-junior",
])

const VIRTUAL_AGENT_MAP: Record<string, ResolvedAgent> = {
  artemis: {
    slug: "explore",
    kind: "virtual",
    virtualName: "artemis",
    skillHints: ["browser-automation"],
  },
  cynthia: {
    slug: "oracle",
    kind: "virtual",
    virtualName: "cynthia",
    skillHints: ["deep-learning"],
  },
}

export class AgentAdapter {
  resolve(input: AgentResolutionInput): ResolvedAgent {
    const requested = input.requestedAgent?.trim().toLowerCase()
    if (requested) {
      if (requested in VIRTUAL_AGENT_MAP) {
        return VIRTUAL_AGENT_MAP[requested]
      }
      if (BUILTIN_AGENTS.has(requested)) {
        return {
          slug: requested,
          kind: "builtin",
          skillHints: [],
        }
      }
    }

    const prompt = input.prompt.toLowerCase()
    if (prompt.includes("architecture") || prompt.includes("tradeoff")) {
      return { slug: "oracle", kind: "builtin", skillHints: [] }
    }
    if (prompt.includes("document") || prompt.includes("official doc")) {
      return { slug: "librarian", kind: "builtin", skillHints: [] }
    }
    return { slug: "atlas", kind: "builtin", skillHints: [] }
  }
}
