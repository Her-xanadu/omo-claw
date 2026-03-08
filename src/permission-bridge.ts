export type PermissionDecision = "once" | "always" | "reject"

export interface PermissionRequest {
  id: string
  sessionID: string
  permission: string
  patterns: string[]
  metadata: Record<string, unknown>
  always: string[]
  tool?: {
    messageID: string
    callID: string
  }
}

export interface PermissionBridgeOptions {
  timeoutMs: number
  fallbackReply: PermissionDecision
}

export class PermissionBridge {
  constructor(private readonly options: PermissionBridgeOptions) {}

  buildSessionReply(request: PermissionRequest, response: Exclude<PermissionDecision, "reject"> | "reject") {
    return {
      path: {
        sessionID: request.sessionID,
        permissionID: request.id,
      },
      body: {
        response,
      },
    }
  }

  buildGlobalReply(request: PermissionRequest, reply: PermissionDecision, message?: string) {
    return {
      path: {
        requestID: request.id,
      },
      body: {
        reply,
        ...(message ? { message } : {}),
      },
    }
  }

  buildTimeoutFallback(request: PermissionRequest) {
    return {
      requestID: request.id,
      reply: this.options.fallbackReply,
      message: `Bridge approval timed out after ${this.options.timeoutMs}ms`,
    }
  }
}
