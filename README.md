# omo claw

<p align="center">
  <img src="./docs/assets/readme-banner.svg" alt="omo claw banner" width="100%" />
</p>

<p align="center">
  <strong>SDK-only OpenClaw plugin and context-engine bridge for OpenCode + OmO</strong>
</p>

<p align="center">
  <a href="./README.zh-CN.md">简体中文</a> ·
  <a href="./OPERATIONS.md">Operations</a> ·
  <a href="./CONTRIBUTING.md">Contributing</a> ·
  <a href="./SECURITY.md">Security</a>
</p>

<p align="center">
  <img alt="platform" src="https://img.shields.io/badge/platform-macOS%20%2F%20OpenClaw-0f172a?style=for-the-badge&logo=apple&logoColor=white">
  <img alt="runtime" src="https://img.shields.io/badge/runtime-Bun%20%2B%20OpenCode-1d4ed8?style=for-the-badge&logo=bun&logoColor=white">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-111827?style=for-the-badge">
</p>

`omo claw` connects **OpenClaw threads** to an **isolated headless OpenCode + OmO runtime**. It gives you a clean plugin entrypoint, a controlled bridge layer, replay-aware event reduction, permission flow management, and compatibility-aware operation without depending on ACP.

---

## Why this project exists

Most integrations stop at “call an SDK and hope it works.” `omo claw` goes further:

- it isolates a dedicated headless `opencode serve` runtime
- it maps OpenClaw threads into a session tree
- it keeps permission flow, todo mirroring, summary reduction, and replay semantics in one bridge
- it adds compatibility snapshots, diff classification, and mode switching so upgrades are survivable

This makes it useful both as a **real plugin** and as a **reference implementation** for building serious OpenClaw ↔ OpenCode bridges.

---

## Architecture at a glance

<p align="center">
  <img src="./docs/assets/architecture.svg" alt="omo claw architecture" width="100%" />
</p>

### Core layers

| Layer | Responsibilities |
| --- | --- |
| OpenClaw | Plugin host, context-engine registration, gateway status, user entry |
| omo claw bridge core | Runtime management, SDK client, route engine, session graph, permission bridge, event reducer, replay, compatibility controller |
| Headless OpenCode + OmO | Agent execution, event stream, todo source of truth, compaction, permission requests |

---

## Highlights

### Runtime & execution
- isolated `opencode serve` runtime on port `19222`
- XDG-separated config / data / state
- Basic Auth protected bridge runtime

### Session intelligence
- thread → root session mapping
- command-first, agent-fallback routing
- message correlation for `promptAsync` + SSE flow

### Long-running task continuity
- event reduction
- summary cache
- todo mirror
- replay / rebind support
- compaction-friendly companion hook path

### Compatibility controls
- capability snapshot collection
- diff classification
- mode switching (`full`, `compatible`, `safe`, `quarantine`)
- adapter registry plumbing

---

## Prerequisites

Before using `omo claw`, make sure you have:

- [Bun](https://bun.sh/)
- `opencode` CLI available in PATH (or at `~/.opencode/bin/opencode`)
- an OpenClaw installation that supports context-engine plugins
- permission to run a local headless service on `127.0.0.1:19222`

> This repository is **not** a standalone Homebrew-style desktop app. It is an OpenClaw plugin project with a managed runtime bridge.

---

## Quick start

```bash
git clone https://github.com/Her-xanadu/omo-claw.git
cd omo-claw
./scripts/setup-local.sh
./integration/bridge-runtime/bridge-launcher.sh
./tests/live/runtime-health.smoke.sh
```

If everything is wired correctly, the smoke check returns:

```json
{"healthy": true, "version": "1.2.21"}
```

---

## Install into OpenClaw

1. Place this repository into your OpenClaw plugin workspace.
2. Register `openclaw.plugin.json` with your OpenClaw installation.
3. Configure the context-engine slot to use plugin id **`omo-claw`**.
4. Start the bridge runtime with `./integration/bridge-runtime/bridge-launcher.sh`.
5. Verify the runtime with `./tests/live/runtime-health.smoke.sh`.

The main OpenClaw-facing identifiers are:

| Item | Value |
| --- | --- |
| Plugin id | `omo-claw` |
| Plugin name | `omo claw` |
| Gateway method | `omo-claw.status` |
| Status command | `omo_claw_status` |

---

## Local development

```bash
./scripts/setup-local.sh
bun test
bun run typecheck
./tests/live/runtime-health.smoke.sh
```

Useful extra commands:

```bash
bun run compile:definitions
./scripts/publish-github.sh omo-claw Her-xanadu public
```

---

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/` | bridge implementation |
| `integration/bridge-runtime/` | isolated runtime wrapper, config, launcher |
| `definitions/` | single-source IR, compiler, generated manifests |
| `compatibility/` | snapshots, diff classifier, adapter registry |
| `contracts/` | machine-checkable bridge contracts |
| `tests/` | unit, contract, e2e, smoke verification |
| `docs/assets/` | README visual assets |

---

## Security notes

- never commit `integration/bridge-runtime/.bridge-secret`
- keep runtime state under ignored `integration/bridge-runtime/xdg/`
- review generated artifacts before publishing if local metadata changes
- validate compatibility mode and event-directory filtering after upgrades

---

## Documentation

- [中文说明 / README.zh-CN.md](./README.zh-CN.md)
- [Operations](./OPERATIONS.md)
- [Publishing](./PUBLISHING.md)
- [Contributing](./CONTRIBUTING.md)
- [Security](./SECURITY.md)

---

## License

MIT
