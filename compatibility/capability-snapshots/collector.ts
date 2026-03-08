import type { CapabilitySnapshot } from "./capability-snapshot.schema.ts"

export interface CapabilityCollectorInput {
  opencodeVersion: string
  omoVersion: string
  sdkNamespace: "v1" | "v2"
  tools: { ids: string[]; mcpServers: string[] }
  commands: { list: string[]; aliases: Record<string, string> }
  agents: { configs: Array<{ slug: string; hidden: boolean; hasSystemPrompt: boolean }> }
  events: { supportedSet: string[] }
  permissions: { flow: "auto-approve" | "prompt-user" | "deny-all"; toolRestrictions: Record<string, string[]> }
  plugins: { hooks: string[] }
}

export class CapabilityCollector {
  collect(input: CapabilityCollectorInput): CapabilitySnapshot {
    return {
      capturedAt: new Date().toISOString(),
      opencodeVersion: input.opencodeVersion,
      omoVersion: input.omoVersion,
      sdkNamespace: input.sdkNamespace,
      tools: input.tools,
      commands: input.commands,
      agents: input.agents,
      events: input.events,
      permissions: input.permissions,
      plugins: input.plugins,
    }
  }
}
