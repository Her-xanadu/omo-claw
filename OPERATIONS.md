# omo claw Operations

## Start headless runtime

```bash
cp integration/bridge-runtime/.bridge-secret.example integration/bridge-runtime/.bridge-secret
chmod 600 integration/bridge-runtime/.bridge-secret
./integration/bridge-runtime/bridge-launcher.sh
```

## Verify runtime

1. `curl -u opencode:$(cat integration/bridge-runtime/.bridge-secret) http://127.0.0.1:19222/global/health`
2. Open `http://127.0.0.1:19222/doc`
3. Run `bun test && bun run typecheck`
4. Run `./tests/live/runtime-health.smoke.sh`
5. Run `bun run compile:definitions`

## Rollback / cleanup

1. Stop the headless `opencode serve` process.
2. Remove `integration/bridge-runtime/.bridge-secret` if the environment is being reset.
3. Delete `integration/bridge-runtime/xdg/{config,data,state}` only for a full bridge reset.
4. Revert generated files under `definitions/generated/` if definition outputs need a clean rebuild.

## Troubleshooting

- If health never turns green, verify `OPENCODE_SERVER_PASSWORD` and `XDG_*` paths from `integration/bridge-runtime/bridge-launcher.sh`.
- If events look cross-workspace, confirm `EventBridge` is configured with the expected `allowedDirectory`.
- If permissions hang, inspect `BridgeOrchestrator.getStatus().pendingPermissions` and apply timeout fallback.
- If compatibility drops to `safe` or `quarantine`, inspect the `capability` payload from `omo-claw.status` and compare against `compatibility/capability-snapshots/capability-baseline.json`.
- If replay output looks wrong, verify `message.part.updated`, `message.part.removed`, and `session.compacted` ordering in the incoming event trace.
