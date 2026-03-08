# Publishing omo claw to GitHub

## Preconditions

1. `gh auth status` must show a valid GitHub login.
2. The working tree must be clean.
3. Local verification should already pass:
   - `bun run compile:definitions`
   - `bun test`
   - `bun run typecheck`
   - `./tests/live/runtime-health.smoke.sh`

## One-command publish

```bash
./scripts/publish-github.sh omo-claw Her-xanadu public
```

## What the script does

1. verifies `gh` authentication
2. creates `Her-xanadu/omo-claw` if it does not exist
3. configures `origin` if needed
4. pushes the current branch to GitHub
5. applies repository description and topics

## Manual fallback

```bash
gh repo create Her-xanadu/omo-claw --public --description "SDK-only OpenClaw plugin and context engine bridging OpenClaw threads into an isolated headless OpenCode + OmO runtime."
git remote add origin https://github.com/Her-xanadu/omo-claw.git
git push -u origin HEAD
```
