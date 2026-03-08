# omo claw

`omo claw` is an SDK-only OpenClaw plugin and context engine that bridges OpenClaw threads into an isolated headless OpenCode + OmO runtime.

## What it provides

- isolated headless `opencode serve` runtime on a dedicated port
- OpenClaw context-engine plugin entrypoint
- thread → session tree orchestration
- command / agent routing with virtual agent support
- permission reply bridge and timeout fallback
- todo mirror, event reduction, summary cache, replay support
- capability snapshot, diff classification, compatibility mode switching

## Architecture

- **OpenClaw**: user-facing entry, thread binding, plugin host
- **omo claw**: bridge core, route engine, session graph, event bridge, compatibility controller
- **Headless OpenCode + OmO**: execution runtime for agents and tools

## Install into OpenClaw

1. Copy this repository into your OpenClaw plugin workspace.
2. Register the plugin using `openclaw.plugin.json`.
3. Configure the context-engine slot to use plugin id `omo-claw`.
4. Start the isolated runtime with `integration/bridge-runtime/bridge-launcher.sh`.

## Quick start

```bash
git clone https://github.com/Her-xanadu/omo-claw.git
cd omo-claw
./scripts/setup-local.sh
./integration/bridge-runtime/bridge-launcher.sh
./tests/live/runtime-health.smoke.sh
```

If you are installing into OpenClaw directly, place this repo in your plugin workspace and point OpenClaw at `openclaw.plugin.json` with plugin id `omo-claw`.

## Local development

```bash
./scripts/setup-local.sh
bun test
bun run typecheck
./tests/live/runtime-health.smoke.sh
```

## Runtime operations

See [OPERATIONS.md](./OPERATIONS.md) for startup, verification, rollback, and troubleshooting.

## Repository layout

- `src/` bridge implementation
- `integration/bridge-runtime/` isolated runtime wrapper and config
- `definitions/` single-source IR and generated outputs
- `compatibility/` snapshot, diff, and adapter logic
- `contracts/` machine-checkable bridge contracts
- `tests/` unit, contract, e2e, and live smoke verification

## Security

- never commit `integration/bridge-runtime/.bridge-secret`
- keep runtime state under ignored `integration/bridge-runtime/xdg/`
- review generated artifacts before publishing if local metadata changes

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security policy

See [SECURITY.md](./SECURITY.md).

## License

MIT
