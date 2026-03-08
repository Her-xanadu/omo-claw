#!/bin/sh
set -eu

REPO_NAME="${1:-omo-claw}"
OWNER="${2:-oasjkow}"
VISIBILITY="${3:-public}"
DESCRIPTION="SDK-only OpenClaw plugin and context engine bridging OpenClaw threads into an isolated headless OpenCode + OmO runtime."

if ! command -v gh >/dev/null 2>&1; then
  printf '%s\n' "gh is required" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  printf '%s\n' "GitHub CLI is not authenticated. Run: gh auth login -h github.com" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  printf '%s\n' "Working tree is not clean. Commit or stash changes before publishing." >&2
  exit 1
fi

if ! gh repo view "$OWNER/$REPO_NAME" >/dev/null 2>&1; then
  gh repo create "$OWNER/$REPO_NAME" --"$VISIBILITY" --description "$DESCRIPTION" --source=. --remote=origin --push=false
fi

if ! git remote | grep -qx origin; then
  git remote add origin "https://github.com/$OWNER/$REPO_NAME.git"
fi

git push -u origin HEAD

gh repo edit "$OWNER/$REPO_NAME" --description "$DESCRIPTION" --add-topic openclaw --add-topic omo --add-topic sdk-bridge --add-topic context-engine --add-topic opencode

printf '%s\n' "Published: https://github.com/$OWNER/$REPO_NAME"
