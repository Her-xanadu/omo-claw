export interface CapabilitySnapshot {
  capturedAt: string
  opencodeVersion: string
  omoVersion: string
  sdkNamespace: "v1" | "v2"
  tools: {
    ids: string[]
    mcpServers: string[]
  }
  commands: {
    list: string[]
    aliases: Record<string, string>
  }
  agents: {
    configs: Array<{
      slug: string
      hidden: boolean
      hasSystemPrompt: boolean
    }>
  }
  events: {
    supportedSet: string[]
  }
  permissions: {
    flow: "auto-approve" | "prompt-user" | "deny-all"
    toolRestrictions: Record<string, string[]>
  }
  plugins: {
    hooks: string[]
  }
}

export const CAPABILITY_SNAPSHOT_REQUIRED_TOP_LEVEL_KEYS = [
  "capturedAt",
  "opencodeVersion",
  "omoVersion",
  "sdkNamespace",
  "tools",
  "commands",
  "agents",
  "events",
  "permissions",
  "plugins",
] as const
