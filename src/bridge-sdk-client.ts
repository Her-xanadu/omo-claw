import type { RuntimeManager } from "./runtime-manager.ts"

export interface BridgeSdkClientConfig {
  baseUrl: string
  directory: string
  headers: Record<string, string>
}

export interface PromptAsyncInput {
  sessionID: string
  agent?: string
  model?: {
    providerID: string
    modelID: string
  }
  noReply?: boolean
  parts: Array<unknown>
}

export interface CommandInput {
  sessionID: string
  command: string
  arguments?: string
  agent?: string
  model?: string
}

export interface SessionCreateInput {
  parentID?: string
  title?: string
}

export interface PermissionReplyInput {
  requestID: string
  reply: "once" | "always" | "reject"
  message?: string
}

export interface SessionPermissionReplyInput {
  sessionID: string
  permissionID: string
  response: "once" | "always" | "reject"
}

export interface SessionRecord {
  id: string
  title?: string
  parentID?: string
  directory?: string
}

export interface SessionMessageRecord {
  info: {
    id: string
    role?: string
  }
  parts?: Array<unknown>
}

type RequestEnvelope<T> = Promise<{ data: T; request?: Record<string, unknown> }>

export interface OpencodeSdkLike {
  global: {
    health(): Promise<{ data: { healthy: boolean; version: string } }>
    event(): Promise<{ stream: AsyncIterable<unknown> }>
  }
  session: {
    create(parameters: Record<string, unknown>): RequestEnvelope<SessionRecord>
    get(parameters: Record<string, unknown>): RequestEnvelope<SessionRecord>
    messages(parameters: Record<string, unknown>): RequestEnvelope<SessionMessageRecord[]>
    promptAsync(parameters: Record<string, unknown>): RequestEnvelope<unknown>
    command(parameters: Record<string, unknown>): RequestEnvelope<unknown>
    todo(parameters: Record<string, unknown>): RequestEnvelope<unknown>
    respondPermission?(parameters: Record<string, unknown>): RequestEnvelope<boolean>
  }
  permission: {
    reply(parameters: Record<string, unknown>): RequestEnvelope<boolean>
  }
}

export class BridgeSdkClient {
  private sdk?: OpencodeSdkLike

  constructor(
    private readonly options: {
      runtime: RuntimeManager
      workingDirectory: string
      sdkFactory: (config: BridgeSdkClientConfig) => OpencodeSdkLike
    },
  ) {}

  buildClientConfig(): BridgeSdkClientConfig {
    return {
      baseUrl: this.options.runtime.getBaseUrl(),
      directory: this.options.workingDirectory,
      headers: {
        Authorization: this.options.runtime.getBasicAuthHeader(),
      },
    }
  }

  async health() {
    return this.getSdk().global.health()
  }

  async subscribeEvents() {
    return this.getSdk().global.event()
  }

  async createSession(input: SessionCreateInput) {
    return this.getSdk().session.create({
      directory: this.options.workingDirectory,
      parentID: input.parentID,
      title: input.title,
    })
  }

  async getSession(sessionID: string) {
    return this.getSdk().session.get({
      sessionID,
      directory: this.options.workingDirectory,
    })
  }

  async messages(sessionID: string, limit?: number) {
    return this.getSdk().session.messages({
      sessionID,
      directory: this.options.workingDirectory,
      ...(limit ? { limit } : {}),
    })
  }

  async promptAsync(input: PromptAsyncInput) {
    return this.getSdk().session.promptAsync({
      sessionID: input.sessionID,
      directory: this.options.workingDirectory,
      agent: input.agent,
      model: input.model,
      noReply: input.noReply,
      parts: input.parts,
    })
  }

  async command(input: CommandInput) {
    return this.getSdk().session.command({
      sessionID: input.sessionID,
      directory: this.options.workingDirectory,
      command: input.command,
      arguments: input.arguments,
      agent: input.agent,
      model: input.model,
    })
  }

  async todo(sessionID: string) {
    return this.getSdk().session.todo({
      sessionID,
      directory: this.options.workingDirectory,
    })
  }

  async replyPermission(input: PermissionReplyInput) {
    return this.getSdk().permission.reply({
      requestID: input.requestID,
      directory: this.options.workingDirectory,
      reply: input.reply,
      message: input.message,
    })
  }

  async respondSessionPermission(input: SessionPermissionReplyInput) {
    const respondPermission = this.getSdk().session.respondPermission
    if (!respondPermission) {
      throw new Error("Session-scoped permission response is not available on this SDK client")
    }

    return respondPermission({
      sessionID: input.sessionID,
      permissionID: input.permissionID,
      directory: this.options.workingDirectory,
      response: input.response,
    })
  }

  private getSdk(): OpencodeSdkLike {
    if (!this.sdk) {
      this.sdk = this.options.sdkFactory(this.buildClientConfig())
    }
    return this.sdk
  }
}
