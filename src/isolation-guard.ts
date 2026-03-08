export interface IsolationGuardOptions {
  bridgeBaseUrl: string
  bridgeConfigDir: string
  bridgePluginDir: string
  bridgeWorktree: string
  tuiBaseUrl: string
  tuiConfigDir: string
  tuiPluginDir: string
  tuiWorktree: string
}

export class IsolationGuard {
  constructor(private readonly options: IsolationGuardOptions) {}

  evaluate(): { ok: boolean; violations: string[] } {
    const violations: string[] = []

    if (this.options.bridgeBaseUrl === this.options.tuiBaseUrl) {
      violations.push("bridge and daily TUI must not share server baseUrl")
    }

    if (this.options.bridgeConfigDir === this.options.tuiConfigDir) {
      violations.push("bridge and daily TUI must not share config dir")
    }

    if (this.options.bridgePluginDir === this.options.tuiPluginDir) {
      violations.push("bridge and daily TUI must not share plugin dir")
    }

    if (this.options.bridgeWorktree === this.options.tuiWorktree) {
      violations.push("bridge and daily TUI should not share worktree")
    }

    return {
      ok: violations.length === 0,
      violations,
    }
  }
}
