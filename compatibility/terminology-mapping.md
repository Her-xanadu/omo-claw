# Terminology Mapping

| Bridge Term | OpenCode / OmO Term | OpenClaw Term | Notes |
| --- | --- | --- | --- |
| thread | parent session tree | thread | One OpenClaw thread maps to one OpenCode root session plus child sessions. |
| root session | session | conversation root | Stable anchor for promptAsync, command, todo, and event correlation. |
| child session | child session | delegated run | Used for Atlas, Oracle, Explore, Librarian, and other routed work. |
| command route | `session.command()` | slash command | Model shape stays string form. |
| agent route | `session.prompt()` / `session.promptAsync()` | persona dispatch | Model shape must be `{ providerID, modelID }`. |
| permission request | `permission.asked` / `/permission/{requestID}/reply` | approval prompt | Wire values are `once`, `always`, `reject`. |
| todo sync | `todo.updated` / `session.todo()` | task list mirror | Read-only from bridge perspective. |
| virtual agent | bridge-only alias | persona alias | `artemis` and `cynthia` are bridge-level virtual names. |
| runtime isolation | dedicated `opencode serve` | gateway sidecar | Must not share server, config dir, plugin dir, or worktree with daily TUI. |
