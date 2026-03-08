import { readFileSync } from "node:fs"
import { spawn } from "node:child_process"

export interface RuntimeManagerOptions {
  rootDir: string
  runtimeDir: string
  port: number
  hostname: string
  serverPasswordFile: string
  configPath: string
  configDir: string
  xdgConfigHome: string
  xdgDataHome: string
  xdgStateHome: string
  serverUsername?: string
  startupTimeoutMs?: number
  healthPollIntervalMs?: number
}

export interface RuntimeSpawnSpec {
  command: string
  args: string[]
  env: Record<string, string>
  healthUrl: string
  basicAuthHeader: string
}

export interface ChildProcessLike {
  pid?: number
  exitCode: number | null
  killed: boolean
  kill(signal?: NodeJS.Signals | number): boolean
  once(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this
  once(event: "error", listener: (error: Error) => void): this
}

export interface RuntimeManagerDeps {
  spawn?: (command: string, args: string[], options: { cwd: string; env: NodeJS.ProcessEnv; stdio: "ignore" }) => ChildProcessLike
  fetch?: (input: string, init?: RequestInit) => Promise<Response>
  now?: () => number
  sleep?: (ms: number) => Promise<void>
}

export class RuntimeManager {
  private readonly deps: Required<RuntimeManagerDeps>
  private child?: ChildProcessLike

  constructor(
    private readonly options: RuntimeManagerOptions,
    deps?: RuntimeManagerDeps,
  ) {
    this.deps = {
      spawn: deps?.spawn ?? ((command, args, spawnOptions) => {
        return spawn(command, args, spawnOptions)
      }),
      fetch: deps?.fetch ?? ((input, init) => fetch(input, init)),
      now: deps?.now ?? (() => Date.now()),
      sleep: deps?.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
    }
  }

  buildServerEnv(): Record<string, string> {
    const password = this.readServerPassword()

    return {
      XDG_CONFIG_HOME: this.options.xdgConfigHome,
      XDG_DATA_HOME: this.options.xdgDataHome,
      XDG_STATE_HOME: this.options.xdgStateHome,
      OPENCODE_CONFIG: this.options.configPath,
      OPENCODE_CONFIG_DIR: this.options.configDir,
      OPENCODE_SERVER_PASSWORD: password,
      ...(this.options.serverUsername
        ? { OPENCODE_SERVER_USERNAME: this.options.serverUsername }
        : {}),
    }
  }

  buildSpawnSpec(): RuntimeSpawnSpec {
    const env = this.buildServerEnv()

    return {
      command: "opencode",
      args: [
        "serve",
        "--port",
        String(this.options.port),
        "--hostname",
        this.options.hostname,
      ],
      env,
      healthUrl: this.getHealthUrl(),
      basicAuthHeader: this.getBasicAuthHeader(),
    }
  }

  buildHealthcheckRequest(): { url: string; init: RequestInit } {
    return {
      url: this.getHealthUrl(),
      init: {
        headers: {
          Authorization: this.getBasicAuthHeader(),
        },
      },
    }
  }

  getBaseUrl(): string {
    return `http://${this.options.hostname}:${this.options.port}`
  }

  getHealthUrl(): string {
    return `${this.getBaseUrl()}/global/health`
  }

  getBasicAuthHeader(): string {
    const username = this.options.serverUsername ?? "opencode"
    const token = `${username}:${this.readServerPassword()}`
    return `Basic ${Buffer.from(token).toString("base64")}`
  }

  isRunning(): boolean {
    return this.child !== undefined && this.child.exitCode === null && !this.child.killed
  }

  async start(): Promise<{ pid?: number; baseUrl: string }> {
    if (this.isRunning()) {
      return { pid: this.child?.pid, baseUrl: this.getBaseUrl() }
    }

    const spec = this.buildSpawnSpec()
    const child = this.deps.spawn(spec.command, spec.args, {
      cwd: this.options.rootDir,
      env: { ...process.env, ...spec.env },
      stdio: "ignore",
    })
    this.child = child

    await this.waitForHealthy()

    return { pid: child.pid, baseUrl: this.getBaseUrl() }
  }

  async waitForHealthy(): Promise<{ healthy: true; version?: string }> {
    const timeoutMs = this.options.startupTimeoutMs ?? 5_000
    const pollMs = this.options.healthPollIntervalMs ?? 100
    const startedAt = this.deps.now()
    let lastError: unknown = undefined

    while (this.deps.now() - startedAt <= timeoutMs) {
      this.assertProcessHealthyState()
      try {
        const response = await this.deps.fetch(this.getHealthUrl(), this.buildHealthcheckRequest().init)
        if (response.ok) {
          const body = await response.json() as { healthy?: boolean; version?: string }
          if (body.healthy) {
            return { healthy: true, version: body.version }
          }
        }
      } catch (error) {
        lastError = error
      }

      await this.deps.sleep(pollMs)
    }

    const detail = lastError instanceof Error ? ` Last error: ${lastError.message}` : ""
    throw new Error(`Timed out waiting for bridge runtime health after ${timeoutMs}ms.${detail}`)
  }

  async stop(): Promise<void> {
    const child = this.child
    this.child = undefined
    if (!child) return
    if (child.exitCode !== null || child.killed) return
    child.kill("SIGTERM")
  }

  private assertProcessHealthyState(): void {
    if (!this.child) {
      throw new Error("Bridge runtime has not been started")
    }
    if (this.child.exitCode !== null) {
      throw new Error(`Bridge runtime exited before becoming healthy (exitCode=${this.child.exitCode})`)
    }
  }

  private readServerPassword(): string {
    return readFileSync(this.options.serverPasswordFile, "utf8").trim()
  }
}
