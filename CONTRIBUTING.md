# Contributing

## Development workflow

1. Install dependencies with `bun install`
2. Regenerate definitions with `bun run compile:definitions`
3. Run `bun test`
4. Run `bun run typecheck`
5. For runtime changes, run `./tests/live/runtime-health.smoke.sh`

## Pull requests

- keep changes scoped and test-backed
- update generated definition artifacts when IR changes
- avoid committing secrets, runtime databases, or local logs

## Style

- TypeScript, ESM, strict typing
- keep bridge contracts and generated artifacts aligned
- prefer contract tests for integration behavior
