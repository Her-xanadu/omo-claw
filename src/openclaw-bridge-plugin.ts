import { BridgeOrchestrator } from "./bridge-orchestrator.ts"
import { CapabilityService } from "./capability-service.ts"
import { ObservabilityHub } from "./observability-hub.ts"
import { buildRpcStatus } from "./rpc-status.ts"

export interface OpenClawPluginApi {
  registerGatewayMethod(name: string, handler: (context: { respond: (ok: boolean, body: unknown) => void; params?: Record<string, unknown> }) => void | Promise<void>): void
  registerCommand(command: {
    name: string
    description: string
    acceptsArgs?: boolean
    requireAuth?: boolean
    handler: (context: { args?: string; commandBody: string; channel?: string }) => { text: string } | Promise<{ text: string }>
  }): void
  registerContextEngine(id: string, factory: () => {
    info: { id: string; name: string; ownsCompaction: boolean }
    ingest: (input: { threadID: string; text: string }) => Promise<{ ingested: boolean }>
    assemble: (input: { messages: Array<unknown> }) => Promise<{ messages: Array<unknown>; estimatedTokens: number }>
    compact: () => Promise<{ ok: boolean; compacted: boolean }>
  }): void
}

export function createOpenClawBridgePlugin(orchestrator: BridgeOrchestrator) {
  const capabilityService = new CapabilityService()
  const observability = new ObservabilityHub()

  return function register(api: OpenClawPluginApi) {
    api.registerGatewayMethod("omo-claw.status", async ({ respond }) => {
      observability.record({
        service: "omo-claw.status",
        level: "info",
        message: "gateway status requested",
      })
      const payload = await buildRpcStatus(orchestrator)
      const capability = capabilityService.snapshotAndEvaluate({
        opencodeVersion: payload.runtime.version,
        omoVersion: "3.11.1",
        sdkNamespace: "v2",
        tools: { ids: ["bash"], mcpServers: ["peekaboo", "github", "xiaohongshu"] },
        commands: { list: ["omo_claw_status"], aliases: { "/omo_claw_status": "omo_claw_status" } },
        agents: { configs: [{ slug: "atlas", hidden: false, hasSystemPrompt: true }] },
        events: { supportedSet: ["message.updated", "todo.updated", "permission.asked", "permission.replied"] },
        permissions: { flow: "prompt-user", toolRestrictions: { atlas: ["/tui"] } },
        plugins: { hooks: ["experimental.session.compacting", "shell.env"] },
      })
      respond(true, {
        ...payload,
        capability,
        mode: capabilityService.getMode(),
        logs: observability.list(),
      })
    })

    api.registerCommand({
      name: "omo_claw_status",
      description: "Show omo claw bridge status",
      handler: async () => {
        const health = await orchestrator.getHealth()
        const status = orchestrator.getStatus()
        observability.record({
          service: "omo_claw_status",
          level: "info",
          message: "command status requested",
        })
        return {
          text: `bridge=${health.baseUrl} healthy=${String(health.healthy)} threads=${status.threads.length} pendingPermissions=${status.pendingPermissions.length}`,
        }
      },
    })

    api.registerContextEngine("omo-claw", () => ({
      info: {
        id: "omo-claw",
        name: "omo claw",
        ownsCompaction: false,
      },
      ingest: async ({ threadID, text }) => {
        await orchestrator.injectContext(threadID, text)
        return { ingested: true }
      },
      assemble: async ({ messages }) => ({
        messages,
        estimatedTokens: 0,
      }),
      compact: async () => ({
        ok: true,
        compacted: false,
      }),
    }))
  }
}
