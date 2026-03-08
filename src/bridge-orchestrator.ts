import { BridgeSdkClient } from "./bridge-sdk-client.ts"
import { EventBridge } from "./event-bridge.ts"
import { type PermissionRequest, PermissionBridge } from "./permission-bridge.ts"
import { PolicyEnforcer } from "./policy-enforcer.ts"
import { type BridgeEvent, CorrelationTracker } from "./correlation-tracker.ts"
import { RouteEngine } from "./route-engine.ts"
import { RuntimeManager } from "./runtime-manager.ts"
import { type MessageCorrelation, SessionGraphManager } from "./session-graph-manager.ts"

export interface BridgeTaskInput {
  threadID: string
  title?: string
  commandHint: string
  args: string
  model: string
  prompt: string
  requestedAgent?: string
}

export type BridgeExecutionResult =
  | {
      type: "command"
      sessionID: string
      request: unknown
    }
  | {
      type: "agent"
      sessionID: string
      agent: string
      request: unknown
    }

export class BridgeOrchestrator {
  private readonly pendingPermissions = new Map<string, PermissionRequest>()
  private routeEngine?: RouteEngine
  private sessionGraph?: SessionGraphManager
  private correlationTracker?: CorrelationTracker
  private permissionBridge?: PermissionBridge
  private policyEnforcer?: PolicyEnforcer
  private eventBridge?: EventBridge

  constructor(
    private readonly options: {
      runtimeManager: RuntimeManager
      sdkClient: BridgeSdkClient
      routeEngine?: RouteEngine
      sessionGraph?: SessionGraphManager
      correlationTracker?: CorrelationTracker
      eventBridge?: EventBridge
      permissionBridge?: PermissionBridge
      policyEnforcer?: PolicyEnforcer
      capabilities?: string[]
    },
  ) {}

  async executeTask(input: BridgeTaskInput): Promise<BridgeExecutionResult> {
    await this.options.runtimeManager.start()

    const policy = this.getPolicyEnforcer().evaluate({
      commandHint: input.commandHint,
      requestedAgent: input.requestedAgent,
      capabilities: this.options.capabilities ?? ["runtime"],
    })
    if (!policy.allowed) {
      throw new Error(policy.reason)
    }

    const sessionID = await this.ensureRootSession(input.threadID, input.title)
    const route = this.getRouteEngine().plan(input)

    if (route.type === "command") {
      const result = await this.options.sdkClient.command({
        sessionID,
        command: route.command.name,
        arguments: route.command.arguments,
        model: route.command.model,
      })
      return {
        type: "command",
        sessionID,
        request: result.request,
      }
    }

    const existingMessages = await this.options.sdkClient.messages(sessionID)
    const knownMessageIDs = existingMessages.data.map((message) => message.info.id)
    this.getCorrelationTracker().recordKnownMessages(sessionID, knownMessageIDs)

    const result = await this.options.sdkClient.promptAsync({
      sessionID,
      agent: route.agent.slug,
      model: route.model.asPromptModel,
      parts: [{ type: "text", text: input.prompt }],
    })

    return {
      type: "agent",
      sessionID,
      agent: route.agent.slug,
      request: result.request,
    }
  }

  async getHealth(): Promise<{ healthy: boolean; version: string; baseUrl: string }> {
    await this.options.runtimeManager.start()
    const health = await this.options.sdkClient.health()
    return {
      healthy: health.data.healthy,
      version: health.data.version,
      baseUrl: this.options.runtimeManager.getBaseUrl(),
    }
  }

  async injectContext(threadID: string, text: string, title?: string): Promise<void> {
    await this.options.runtimeManager.start()
    const sessionID = await this.ensureRootSession(threadID, title)
    await this.options.sdkClient.promptAsync({
      sessionID,
      noReply: true,
      parts: [{ type: "text", text }],
    })
  }

  handleEvent(event: BridgeEvent): MessageCorrelation | null {
    this.getEventBridge().ingest(event)

    if (event.type === "permission.asked") {
      const request = this.parsePermissionRequest(event)
      if (request) {
        this.pendingPermissions.set(request.id, request)
      }
    }

    const correlation = this.getCorrelationTracker().ingestEvent(event)
    if (!correlation) {
      return null
    }

    const threadID = this.getSessionGraph().getThreadForSession(correlation.sessionID)
    if (!threadID) {
      return null
    }

    const record: MessageCorrelation = {
      threadID,
      sessionID: correlation.sessionID,
      messageID: correlation.messageID,
      source: "event",
    }
    this.getSessionGraph().recordMessageCorrelation(record)
    return record
  }

  async replyToPermission(requestID: string, decision: "once" | "always" | "reject") {
    const request = this.pendingPermissions.get(requestID)
    if (!request) {
      throw new Error(`Unknown permission request: ${requestID}`)
    }

    const globalReply = this.getPermissionBridge().buildGlobalReply(request, decision)
    await this.options.sdkClient.replyPermission({
      requestID: globalReply.path.requestID,
      reply: globalReply.body.reply,
      message: typeof globalReply.body.message === "string" ? globalReply.body.message : undefined,
    })

    try {
      const sessionReply = this.getPermissionBridge().buildSessionReply(request, decision)
      await this.options.sdkClient.respondSessionPermission({
        sessionID: sessionReply.path.sessionID,
        permissionID: sessionReply.path.permissionID,
        response: sessionReply.body.response,
      })
    } catch {
    }

    this.pendingPermissions.delete(requestID)
  }

  async timeoutPermission(requestID: string) {
    const request = this.pendingPermissions.get(requestID)
    if (!request) {
      throw new Error(`Unknown permission request: ${requestID}`)
    }
    const fallback = this.getPermissionBridge().buildTimeoutFallback(request)
    await this.options.sdkClient.replyPermission(fallback)
    this.pendingPermissions.delete(requestID)
    return fallback
  }

  getPendingPermission(requestID: string): PermissionRequest | undefined {
    return this.pendingPermissions.get(requestID)
  }

  getStatus() {
    const graph = this.getSessionGraph()
    return {
      runtimeBaseUrl: this.options.runtimeManager.getBaseUrl(),
      threads: graph.listThreads().map((thread) => ({
        ...thread,
        children: graph.getChildren(thread.rootSessionID),
        summary: this.getEventBridge().getSummary(thread.rootSessionID),
        todo: this.getEventBridge().getTodo(thread.rootSessionID),
      })),
      pendingPermissions: [...this.pendingPermissions.keys()],
    }
  }

  getSummary(sessionID: string) {
    return this.getEventBridge().getSummary(sessionID)
  }

  getTodoSnapshot(sessionID: string) {
    return this.getEventBridge().getTodo(sessionID)
  }

  async subscribeEvents(): Promise<AsyncIterable<unknown>> {
    await this.options.runtimeManager.start()
    return this.getEventBridge().subscribe()
  }

  private async ensureRootSession(threadID: string, title?: string): Promise<string> {
    const existing = this.getSessionGraph().getRootSession(threadID)
    if (existing) {
      return existing
    }

    const created = await this.options.sdkClient.createSession({
      title: title ?? `Bridge thread ${threadID}`,
    })
    this.getSessionGraph().bindRootSession(threadID, created.data.id)
    return created.data.id
  }

  private parsePermissionRequest(event: BridgeEvent): PermissionRequest | null {
    const raw = event.properties?.request
    if (!raw || typeof raw !== "object") {
      return null
    }

    const data = raw as Record<string, unknown>
    if (typeof data.id !== "string" || typeof data.sessionID !== "string" || typeof data.permission !== "string") {
      return null
    }

    return {
      id: data.id,
      sessionID: data.sessionID,
      permission: data.permission,
      patterns: Array.isArray(data.patterns) ? data.patterns.filter((item): item is string => typeof item === "string") : [],
      metadata: typeof data.metadata === "object" && data.metadata !== null ? data.metadata as Record<string, unknown> : {},
      always: Array.isArray(data.always) ? data.always.filter((item): item is string => typeof item === "string") : [],
      tool: typeof data.tool === "object" && data.tool !== null && typeof (data.tool as Record<string, unknown>).messageID === "string" && typeof (data.tool as Record<string, unknown>).callID === "string"
        ? {
            messageID: (data.tool as Record<string, string>).messageID,
            callID: (data.tool as Record<string, string>).callID,
          }
        : undefined,
    }
  }

  private getRouteEngine(): RouteEngine {
    this.routeEngine ??= this.options.routeEngine ?? new RouteEngine()
    return this.routeEngine
  }

  private getSessionGraph(): SessionGraphManager {
    this.sessionGraph ??= this.options.sessionGraph ?? new SessionGraphManager()
    return this.sessionGraph
  }

  private getCorrelationTracker(): CorrelationTracker {
    this.correlationTracker ??= this.options.correlationTracker ?? new CorrelationTracker()
    return this.correlationTracker
  }

  private getPermissionBridge(): PermissionBridge {
    this.permissionBridge ??= this.options.permissionBridge ?? new PermissionBridge({ timeoutMs: 120000, fallbackReply: "reject" })
    return this.permissionBridge
  }

  private getEventBridge(): EventBridge {
    this.eventBridge ??= this.options.eventBridge ?? new EventBridge({ sdkClient: this.options.sdkClient })
    return this.eventBridge
  }

  private getPolicyEnforcer(): PolicyEnforcer {
    this.policyEnforcer ??= this.options.policyEnforcer ?? new PolicyEnforcer()
    return this.policyEnforcer
  }
}
