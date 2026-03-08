# Install omo claw

This guide is written for AI coding agents and human operators.

## Goal

Install `omo claw`, bootstrap the local runtime, register the OpenClaw plugin, and verify that the bridge is healthy.

## Required identifiers

- Repository: `https://github.com/Her-xanadu/omo-claw.git`
- Plugin id: `omo-claw`
- Plugin name: `omo claw`
- Gateway method: `omo-claw.status`
- Status command: `omo_claw_status`

## Preferred install paths

### Option 1: Homebrew on macOS

```bash
brew tap Her-xanadu/omo-claw https://github.com/Her-xanadu/omo-claw
brew install --HEAD omo-claw
omo-claw-install /path/to/your/openclaw/plugins/omo-claw
```

### Option 2: npm via GitHub

```bash
npm install -g github:Her-xanadu/omo-claw
omo-claw-install /path/to/your/openclaw/plugins/omo-claw
```

### Option 3: direct git clone

```bash
git clone https://github.com/Her-xanadu/omo-claw.git
cd omo-claw
./scripts/setup-local.sh
```

## What the installer must do

1. Install the repository into the user's OpenClaw plugin workspace, or fall back to `./omo-claw` if no workspace path is provided.
2. Run `./scripts/setup-local.sh` inside the repository.
3. Register `openclaw.plugin.json` with OpenClaw.
4. Configure the context-engine entry to use plugin id `omo-claw`.
5. Start `./integration/bridge-runtime/bridge-launcher.sh`.
6. Verify with `./tests/live/runtime-health.smoke.sh`.
7. Report the final plugin id, gateway method, status command, and health-check result.

## Runtime verification

Expected smoke response:

```json
{"healthy": true, "version": "1.2.21"}
```
