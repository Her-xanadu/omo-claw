import type { BridgeOrchestrator } from "./bridge-orchestrator.ts"

export async function buildRpcStatus(orchestrator: BridgeOrchestrator) {
  const health = await orchestrator.getHealth()
  const status = orchestrator.getStatus()
  return {
    ok: true,
    runtime: health,
    status,
  }
}
