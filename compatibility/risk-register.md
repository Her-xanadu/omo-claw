# Risk Register

| ID | Risk | Impact | Mitigation |
| --- | --- | --- | --- |
| R1 | Official docs prose drifts from SDK wire contract for permission replies | Wrong bridge payload shape | Freeze SDK-v2 contract in `contracts/permission-flow.contract.json` and test it. |
| R2 | Bridge runtime accidentally shares config/plugin directories with daily TUI | User environment contamination | Enforce `IsolationGuard` and explicit XDG launcher. |
| R3 | `promptAsync` returns `204` and loses direct message correlation | Missing result binding | Track pre-message ids and consume SSE with `CorrelationTracker`. |
| R4 | Command and prompt APIs use different model parameter shapes | Runtime request failures | Normalize through `CommandAdapter`. |
| R5 | Virtual agents are mistaken for builtin OmO agents | Broken dispatch | Route through `AgentAdapter` with explicit virtual mapping. |
| R6 | Headless runtime hangs on permission flow | Stalled sessions | Use `PermissionBridge` timeout fallback with reject semantics. |
